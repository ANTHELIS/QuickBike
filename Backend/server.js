/**
 * Server Entry Point — HTTP server with graceful shutdown.
 *
 * Startup order:
 *   1. Initialize Redis client
 *   2. Initialize job queue
 *   3. Start ride lifecycle workers
 *   4. Create HTTP server
 *   5. Initialize Socket.io
 *   6. Listen on PORT
 *
 * Shutdown order (on SIGTERM/SIGINT):
 *   1. Stop accepting new connections
 *   2. Close job queue workers (let running jobs finish)
 *   3. Close socket connections
 *   4. Close Redis
 *   5. Close MongoDB
 *   6. Exit process
 */

const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { initializeSocket } = require('./socket');
const { initRedis, disconnect: disconnectRedis } = require('./utils/redis');
const { initJobQueue, shutdownQueues } = require('./jobs/queue');
const { initRideLifecycleWorker } = require('./jobs/rideLifecycle');
const mongoose = require('mongoose');

const server = http.createServer(app);

// ── Startup Sequence ──
async function startServer() {
    try {
        // 1. Initialize Redis (or in-memory fallback)
        await initRedis();
        logger.info('Redis layer initialized');

        // 2. Initialize job queue system
        await initJobQueue();
        logger.info('Job queue system initialized');

        // 3. Start background workers
        initRideLifecycleWorker();
        const { startEarningsCron } = require('./jobs/earningsReset');
        startEarningsCron();
        logger.info('Background workers started');

        // 4. Initialize Socket.io on the HTTP server
        initializeSocket(server);
        logger.info('Socket.io initialized');

        // 5. Start listening
        server.listen(config.port, () => {
            logger.info(`QuickBike server running`, {
                port: config.port,
                environment: config.nodeEnv,
                pid: process.pid,
            });
        });
    } catch (err) {
        logger.error('Failed to start server', { error: err.message, stack: err.stack });
        process.exit(1);
    }
}

// ── Graceful Shutdown ──
let isShuttingDown = false;

async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // 1. Stop accepting new connections — give existing requests 10s to finish
    server.close(() => {
        logger.info('HTTP server closed — no new connections');
    });

    // Set a hard deadline — force exit after 15 seconds
    const forceExitTimer = setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 15000);

    try {
        // 2. Drain job queues (let running jobs finish, stop accepting new ones)
        await shutdownQueues();

        // 3. Disconnect Redis
        await disconnectRedis();

        // 4. Close MongoDB connections
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');

        clearTimeout(forceExitTimer);
        logger.info('Graceful shutdown complete. Goodbye.');
        process.exit(0);
    } catch (err) {
        logger.error('Error during graceful shutdown', { error: err.message });
        clearTimeout(forceExitTimer);
        process.exit(1);
    }
}

// ── Process Signal Handlers ──
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Unhandled Rejection / Exception ──
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
    });
    // In production, this is a programming error — shut down
    if (config.isProduction) {
        gracefulShutdown('unhandledRejection');
    }
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
        error: err.message,
        stack: err.stack,
    });
    // Always shut down on uncaught exceptions — state may be corrupted
    gracefulShutdown('uncaughtException');
});

// ── Start ──
startServer();