const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

async function connectToDb() {
    try {
        await mongoose.connect(config.db.uri, {
            // Connection pool tuning from config
            maxPoolSize: config.db.maxPoolSize,
            minPoolSize: config.db.minPoolSize,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger.info('Connected to MongoDB');

        // Clear stranded socket connections from previous server runs / crashes
        const userModel = require('../models/user.model');
        const captainModel = require('../models/captain.model');
        await Promise.all([
            userModel.updateMany({}, { $set: { socketId: null } }),
            captainModel.updateMany({}, { $set: { socketId: null } })
        ]).catch(err => logger.warn('Failed to clear socket IDs on boot', { error: err.message }));
    } catch (err) {
        logger.error('MongoDB connection failed', { error: err.message });
        process.exit(1);
    }

    mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
    });
}

async function disconnectFromDb() {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
}

module.exports = { connectToDb, disconnectFromDb };