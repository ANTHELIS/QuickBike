const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

async function connectToDb() {
    try {
        await mongoose.connect(config.db.uri, {
            // Connection pool tuning
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger.info('Connected to MongoDB');
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