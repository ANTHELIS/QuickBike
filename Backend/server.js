const http = require('http');
const app = require('./app');
const config = require('./config');
const { initializeSocket } = require('./socket');
const { disconnectFromDb } = require('./db/db');
const logger = require('./utils/logger');

const server = http.createServer(app);

initializeSocket(server);

server.listen(config.port, () => {
    logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
});

// ──────────────────────────────────────────────
// Graceful shutdown
// ──────────────────────────────────────────────
const SHUTDOWN_TIMEOUT_MS = 10000;

async function gracefulShutdown(signal) {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            await disconnectFromDb();
        } catch (err) {
            logger.error('Error during DB disconnect', { error: err.message });
        }

        logger.info('Graceful shutdown complete');
        process.exit(0);
    });

    // Force shutdown if graceful takes too long
    setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled rejections and uncaught exceptions
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', {
        error: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
    });
    // Don't exit — let the error handler deal with per-request failures
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception — shutting down', {
        error: err.message,
        stack: err.stack,
    });
    // Exit — the process is in an unreliable state
    process.exit(1);
});