const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');
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

    // Socket.io authentication middleware
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

        socket.on('join', async (data) => {
            try {
                const { userId, userType } = data;

                // Verify the socket's authenticated user matches the join request
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
            } catch (err) {
                logger.error('Socket join error', { error: err.message, socketId: socket.id });
                socket.emit('error', { message: 'Failed to join' });
            }
        });

        socket.on('update-location-captain', async (data) => {
            try {
                const { userId, location } = data;

                if (socket.userId !== userId) {
                    return socket.emit('error', { message: 'User ID mismatch' });
                }

                if (!location || typeof location.ltd !== 'number' || typeof location.lng !== 'number') {
                    return socket.emit('error', { message: 'Invalid location data' });
                }

                // Update to GeoJSON format for 2dsphere index
                await captainModel.findByIdAndUpdate(userId, {
                    location: {
                        type: 'Point',
                        coordinates: [location.lng, location.ltd], // GeoJSON: [lng, lat]
                    },
                });
            } catch (err) {
                logger.error('Location update error', {
                    error: err.message,
                    socketId: socket.id,
                });
                socket.emit('error', { message: 'Failed to update location' });
            }
        });

        // Captain online/offline toggle
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
                logger.error('Status update error', {
                    error: err.message,
                    socketId: socket.id,
                });
                socket.emit('error', { message: 'Failed to update status' });
            }
        });

        socket.on('disconnect', async () => {
            logger.debug('Client disconnected', { socketId: socket.id });

            // Clean up socketId references
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
}

function sendMessageToSocketId(socketId, messageObject) {
    if (!io) {
        logger.warn('Socket.io not initialized, cannot send message');
        return;
    }

    if (!socketId) {
        logger.debug('No socketId provided, skipping message');
        return;
    }

    io.to(socketId).emit(messageObject.event, messageObject.data);
}

function getIO() {
    return io;
}

module.exports = { initializeSocket, sendMessageToSocketId, getIO };