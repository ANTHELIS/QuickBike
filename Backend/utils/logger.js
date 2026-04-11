/**
 * Structured Logger — Winston-based with request ID correlation.
 *
 * Design decisions:
 *   - JSON format in production (machine-parseable for log aggregation)
 *   - Colorized simple format in development (human-readable)
 *   - Request ID attached to every log line for tracing
 *   - No console.log anywhere — all output goes through this logger
 *   - Log levels: error, warn, info, http, debug
 *   - File transport in production (rotating daily)
 */

const { createLogger, format, transports } = require('winston');
const config = require('../config');

const { combine, timestamp, errors, json, colorize, printf } = format;

// ── Dev-friendly format: timestamp level: message {meta} ──
const devFormat = printf(({ level, message, timestamp: ts, requestId, ...meta }) => {
    const reqIdStr = requestId ? ` [${requestId}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} ${level}:${reqIdStr} ${message}${metaStr}`;
});

// ── Build transports ──
const logTransports = [
    new transports.Console({
        level: config.isProduction ? 'info' : 'debug',
    }),
];

// In production, add a file transport for error-level logs
if (config.isProduction) {
    logTransports.push(
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
        new transports.File({
            filename: 'logs/combined.log',
            level: 'info',
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
        })
    );
}

// ── Create logger ──
const logger = createLogger({
    level: config.isProduction ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        errors({ stack: true }), // capture stack traces
        config.isProduction
            ? json()
            : combine(colorize(), devFormat)
    ),
    transports: logTransports,
    // Don't exit on uncaught exceptions — let the process handler deal with it
    exitOnError: false,
});

// ── Morgan stream — pipe HTTP request logs through Winston ──
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

module.exports = logger;
