const logger = require('../utils/logger');
const config = require('../config');

/**
 * Global Error Handler — classifies errors and produces safe responses.
 *
 * Error types:
 *   - Operational (AppError): Expected errors — bad input, auth failures, not found.
 *     These have err.isOperational = true and a specific statusCode.
 *
 *   - Programming: Unexpected errors — null pointer, type error, DB connection failure.
 *     These get logged with full stack trace and return generic 500 to client.
 *
 *   - Third-party: Timeouts/failures from Google Maps, Razorpay, etc.
 *     These get logged and return 502/503 to client.
 *
 *   - Mongoose Validation: Schema validation failures → 422 Unprocessable Entity.
 *
 *   - Mongoose Duplicate Key: Unique constraint violation → 409 Conflict.
 *
 *   - JWT errors: Invalid/expired token → 401 Unauthorized.
 *
 * NEVER leaks stack traces in production.
 * ALWAYS includes requestId for support ticket correlation.
 *
 * Must have 4 parameters for Express to recognize it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    // Start with defaults
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    const isOperational = err.isOperational || false;

    // ── Mongoose Validation Error → 422 ──
    if (err.name === 'ValidationError' && err.errors) {
        statusCode = 422;
        const fields = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return res.status(statusCode).json({
            success: false,
            message: 'Validation failed',
            errors: fields,
            meta: { requestId: req.requestId },
        });
    }

    // ── Mongoose Duplicate Key → 409 ──
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'unknown';
        message = `Duplicate value for field: ${field}`;
    }

    // ── Mongoose CastError (invalid ObjectId) → 400 ──
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // ── JWT Errors → 401 ──
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired';
    }

    // ── Log with appropriate level ──
    const logContext = {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        error: err.message,
        ip: req.ip,
    };

    if (statusCode >= 500) {
        // Programming/unexpected errors — log full stack
        logger.error('Server error', { ...logContext, stack: err.stack });
    } else if (statusCode >= 400) {
        // Operational errors — log without stack
        logger.warn('Client error', logContext);
    }

    // ── Build response ──
    const responseBody = {
        success: false,
        message: statusCode >= 500 && config.isProduction
            ? 'Internal server error' // NEVER leak error details in prod
            : message,
        meta: {
            requestId: req.requestId,
        },
    };

    // Only include stack trace in development
    if (!config.isProduction && err.stack) {
        responseBody.stack = err.stack;
    }

    res.status(statusCode).json(responseBody);
}

module.exports = errorHandler;
