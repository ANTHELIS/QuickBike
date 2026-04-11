const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');
const rideModel = require('./models/ride.model');
const logger = require('./utils/logger');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: config.cors.origins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // ── JWT auth middleware ──
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token || socket.handshake.query?.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, config.jwt.secret);
            socket.userId = decoded._id;
            next();
        } catch (err) {
            logger.warn('Socket auth failed', { error: err.message });
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        logger.debug('Client connected', { socketId: socket.id, userId: socket.userId });

        // ── join ──
        socket.on('join', async (data) => {
            try {
                const { userId, userType } = data;
                if (socket.userId !== userId) {
                    return socket.emit('error', { message: 'User ID mismatch' });
                }
                if (userType === 'user') {
                    await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
                } else if (userType === 'captain') {
                    await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
                } else {
                    return socket.emit('error', { message: 'Invalid user type' });
                }
                logger.debug('Socket join', { userId, userType, socketId: socket.id });
            } catch (err) {
                logger.error('Socket join error', { error: err.message });
                socket.emit('error', { message: 'Failed to join' });
            }
        });

        // ── Captain location update → save to DB + relay to rider ──
        socket.on('update-location-captain', async (data) => {
            try {
                const { userId, location } = data;
                if (socket.userId !== userId) {
                    return socket.emit('error', { message: 'User ID mismatch' });
                }
                if (!location || typeof location.ltd !== 'number' || typeof location.lng !== 'number') {
                    return socket.emit('error', { message: 'Invalid location data' });
                }

                // Persist location in DB
                await captainModel.findByIdAndUpdate(userId, {
                    location: {
                        type: 'Point',
                        coordinates: [location.lng, location.ltd],
                    },
                });

                // Relay to rider who has an active ride with this captain
                const activeRide = await rideModel
                    .findOne({
                        captain: userId,
                        status: { $in: ['accepted', 'ongoing'] },
                    })
                    .populate('user', 'socketId');

                if (activeRide?.user?.socketId) {
                    io.to(activeRide.user.socketId).emit('captain-location-update', {
                        ltd: location.ltd,
                        lng: location.lng,
                    });
                }

                // Broadcast a lightweight ping to ALL connected clients so
                // LiveTracking.jsx can trigger a fresh /maps/nearby-captains poll
                socket.broadcast.emit('nearby-captain-moved', {
                    ltd: location.ltd,
                    lng: location.lng,
                });
            } catch (err) {
                logger.error('Location update error', { error: err.message });
                socket.emit('error', { message: 'Failed to update location' });
            }
        });

        // ── Captain online/offline toggle ──
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
                socket.emit('status-updated', { status });
                logger.debug('Captain status updated', { userId, status });
            } catch (err) {
                logger.error('Status update error', { error: err.message });
                socket.emit('error', { message: 'Failed to update status' });
            }
        });

        socket.on('disconnect', async () => {
            logger.debug('Client disconnected', { socketId: socket.id });
            try {
                await Promise.all([
                    userModel.findOneAndUpdate({ socketId: socket.id }, { socketId: null }),
                    captainModel.findOneAndUpdate({ socketId: socket.id }, { socketId: null }),
                ]);
            } catch (err) {
                logger.error('Socket cleanup error', { error: err.message });
            }
        });
    });

    // ── Smart re-dispatch: every 60s, re-broadcast rides pending > 60s ──
    setInterval(async () => {
        try {
            const cutoff = new Date(Date.now() - 60_000);
            const staleRides = await rideModel
                .find({ status: 'pending', dispatchedAt: { $lt: cutoff } })
                .populate('user', 'fullname');

            if (staleRides.length === 0) return;

            const mapService = require('./services/maps.service');

            for (const ride of staleRides) {
                // Expand search radius on each re-dispatch attempt
                const attemptRadius = 7; // km — wider than initial 5km
                try {
                    const pickupCoords = await mapService.getAddressCoordinate(ride.pickup);
                    const captains = await mapService.getCaptainsInTheRadius(
                        pickupCoords.ltd,
                        pickupCoords.lng,
                        attemptRadius
                    );

                    for (const captain of captains) {
                        if (captain.socketId) {
                            io.to(captain.socketId).emit('new-ride', ride);
                        }
                    }

                    // Update dispatchedAt so we don't blast every 60s forever
                    await rideModel.findByIdAndUpdate(ride._id, { dispatchedAt: new Date() });

                    logger.debug('Re-dispatched stale ride', {
                        rideId: ride._id,
                        captainsNotified: captains.length,
                    });
                } catch (err) {
                    logger.warn('Re-dispatch error for ride', { rideId: ride._id, err: err.message });
                }
            }
        } catch (err) {
            logger.error('Re-dispatch cron error', { err: err.message });
        }
    }, 60_000);
}

function sendMessageToSocketId(socketId, messageObject) {
    if (!io) {
        logger.warn('Socket.io not initialized');
        return;
    }
    if (!socketId) return;
    io.to(socketId).emit(messageObject.event, messageObject.data);
}

function getIO() {
    return io;
}

module.exports = { initializeSocket, sendMessageToSocketId, getIO };