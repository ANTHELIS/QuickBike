/**
 * Socket Event Handlers — Modular handlers for each event category.
 *
 * This file contains pure handler factories that accept socket, io,
 * and dependencies as parameters. This makes them:
 *   - Unit testable (inject mocks)
 *   - Isolated from each other
 *   - Easy to add new event categories
 */

const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');
const rideModel = require('../models/ride.model');
const { getRedisClient } = require('../utils/redis');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────
// JOIN — User/Captain registers their socket ID
// ─────────────────────────────────────────────────
function handleJoin(socket, io) {
    socket.on('join', async (data) => {
        try {
            const { userId, userType } = data;

            // Verify the socket's authenticated user matches the join request
            if (socket.userId !== userId) {
                return socket.emit('error', { message: 'User ID mismatch' });
            }

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
                // Join a user-specific room for targeted events
                socket.join(`user:${userId}`);
            } else if (userType === 'captain') {
                const captain = await captainModel.findById(userId);
                await captainModel.findByIdAndUpdate(userId, {
                    socketId: socket.id,
                    ...(captain?.status !== 'inactive' && { status: 'active' }),
                });
                socket.join(`captain:${userId}`);
            } else {
                return socket.emit('error', { message: 'Invalid user type' });
            }

            socket.userType = userType;

            // ── Ride State Sync ──
            // On reconnect, send any active ride back to the client
            // This prevents the "blank screen after refresh" problem
            await syncActiveRide(socket, userId, userType);

            logger.debug('Socket join', {
                userId,
                userType,
                socketId: socket.id,
            });
        } catch (err) {
            logger.error('Socket join error', { error: err.message, socketId: socket.id });
            socket.emit('error', { message: 'Failed to join' });
        }
    });
}

/**
 * Sync active ride state on reconnect.
 * If the user/captain has an active ride, push the current state to them.
 */
async function syncActiveRide(socket, userId, userType) {
    try {
        let activeRide;
        if (userType === 'user') {
            activeRide = await rideModel
                .findOne({
                    user: userId,
                    status: { $in: ['pending', 'accepted', 'ongoing'] },
                })
                .populate('captain', 'fullname vehicle location ratings phone')
                .lean();
        } else if (userType === 'captain') {
            activeRide = await rideModel
                .findOne({
                    captain: userId,
                    status: { $in: ['accepted', 'ongoing'] },
                })
                .populate('user', 'fullname phone')
                .lean();
        }

        if (activeRide) {
            socket.emit('ride-state-sync', activeRide);
            logger.debug('Synced active ride on reconnect', {
                userId,
                rideId: activeRide._id,
                status: activeRide.status,
            });
        }
    } catch (err) {
        logger.warn('Ride sync failed', { userId, error: err.message });
    }
}

// ─────────────────────────────────────────────────
// CAPTAIN LOCATION — High-frequency GPS updates
// ─────────────────────────────────────────────────
function handleCaptainLocation(socket, io) {
    // Throttle: max 1 DB write per 5 seconds per captain
    const lastDbWrite = new Map();
    const DB_WRITE_INTERVAL = 5000; // ms

    socket.on('update-location-captain', async (data) => {
        try {
            const { userId, location } = data;

            if (socket.userId !== userId) {
                return socket.emit('error', { message: 'User ID mismatch' });
            }

            if (!location || typeof location.ltd !== 'number' || typeof location.lng !== 'number') {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            // Validate coordinate ranges (basic sanity check)
            if (Math.abs(location.ltd) > 90 || Math.abs(location.lng) > 180) {
                return socket.emit('error', { message: 'Coordinates out of range' });
            }

            // Skip [0, 0] — GPS cold start
            if (location.ltd === 0 && location.lng === 0) {
                return;
            }

            const redis = getRedisClient();

            // ── Redis: Always update (fast, O(1)) ──
            // Store as JSON in Redis for instant lookup
            await redis.setex(
                `captain:loc:${userId}`,
                300, // 5 min TTL (auto-expire if captain goes offline)
                JSON.stringify({
                    ltd: location.ltd,
                    lng: location.lng,
                    updatedAt: Date.now(),
                })
            );

            // ── MongoDB: Throttled writes (expensive, O(log n)) ──
            const now = Date.now();
            const lastWrite = lastDbWrite.get(userId) || 0;
            if (now - lastWrite >= DB_WRITE_INTERVAL) {
                lastDbWrite.set(userId, now);
                // Non-blocking DB update
                captainModel.findByIdAndUpdate(userId, {
                    location: {
                        type: 'Point',
                        coordinates: [location.lng, location.ltd],
                    },
                }).catch(err => {
                    logger.warn('Captain location DB write failed', {
                        captainId: userId,
                        error: err.message,
                    });
                });
            }

            // ── Relay to rider with active ride ──
            const activeRide = await rideModel
                .findOne({
                    captain: userId,
                    status: { $in: ['accepted', 'ongoing'] },
                })
                .populate('user', 'socketId')
                .lean();

            if (activeRide?.user?.socketId) {
                io.to(activeRide.user.socketId).emit('captain-location-update', {
                    ltd: location.ltd,
                    lng: location.lng,
                });
            }

            // The LiveTracking map fetches nearby captains via HTTP polling, so we skip emitting 'nearby-captain-moved' to everyone to avoid privacy leaks and massive traffic.
        } catch (err) {
            logger.error('Location update error', {
                error: err.message,
                socketId: socket.id,
            });
        }
    });
}

// ─────────────────────────────────────────────────
// CAPTAIN STATUS — Online/Offline toggle
// ─────────────────────────────────────────────────
function handleCaptainStatus(socket, io) {
    socket.on('update-status-captain', async (data) => {
        try {
            const { userId, status } = data;

            if (socket.userId !== userId) {
                return socket.emit('error', { message: 'User ID mismatch' });
            }

            if (!['active', 'inactive'].includes(status)) {
                return socket.emit('error', { message: 'Invalid status' });
            }

            await captainModel.findByIdAndUpdate(userId, { status });

            const redis = getRedisClient();
            if (status === 'inactive') {
                // Remove location from Redis when going offline
                await redis.del(`captain:loc:${userId}`);
            }

            socket.emit('status-updated', { status });
            logger.debug('Captain status updated', { userId, status });
        } catch (err) {
            logger.error('Status update error', { error: err.message });
            socket.emit('error', { message: 'Failed to update status' });
        }
    });
}

// ─────────────────────────────────────────────────
// HEARTBEAT — Captain presence detection
// ─────────────────────────────────────────────────
function handleHeartbeat(socket) {
    socket.on('heartbeat', async (data) => {
        try {
            const redis = getRedisClient();

            // Refresh presence TTL (3 minutes)
            await redis.setex(`presence:${socket.userId}`, 180, socket.id);

            // Respond with server time (helps detect clock skew)
            socket.emit('heartbeat-ack', { serverTime: Date.now() });
        } catch (err) {
            // Non-critical — don't break the connection
        }
    });
}

// ─────────────────────────────────────────────────
// DISCONNECT — Cleanup
// ─────────────────────────────────────────────────
function handleDisconnect(socket) {
    socket.on('disconnect', async (reason) => {
        logger.debug('Client disconnected', {
            socketId: socket.id,
            userId: socket.userId,
            reason,
        });

        try {
            const redis = getRedisClient();

            // Remove presence
            await redis.del(`presence:${socket.userId}`);

            // Clear socketId in DB
            // Only clear if the current socketId matches (prevents race with reconnect)
            await Promise.all([
                userModel.findOneAndUpdate(
                    { socketId: socket.id },
                    { socketId: null }
                ),
                captainModel.findOneAndUpdate(
                    { socketId: socket.id },
                    { socketId: null }
                ),
            ]);
        } catch (err) {
            logger.error('Socket cleanup error', { error: err.message });
        }
    });
}

module.exports = {
    handleJoin,
    handleCaptainLocation,
    handleCaptainStatus,
    handleHeartbeat,
    handleDisconnect,
    syncActiveRide,
};
