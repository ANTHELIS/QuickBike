const logger = require('../utils/logger');
const config = require('../config');

/**
 * Global error-handling middleware.
 * Must have 4 parameters for Express to recognize it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    // Default to 500 if no statusCode on the error
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;

    // Log full stack for unexpected (programming) errors
    if (!isOperational) {
        logger.error('Unexpected error', {
            method: req.method,
            url: req.originalUrl,
            error: err.message,
            stack: err.stack,
        });
    } else {
        logger.warn('Operational error', {
            method: req.method,
            url: req.originalUrl,
            error: err.message,
            statusCode,
        });
    }

    // Never leak stack traces in production
    res.status(statusCode).json({
        status: 'error',
        message: isOperational ? err.message : 'Internal server error',
        ...(config.isProduction ? {} : { stack: err.stack }),
    });
}

module.exports = errorHandler;
