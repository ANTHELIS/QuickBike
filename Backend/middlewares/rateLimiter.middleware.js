const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General API rate limiter.
 */
const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many requests, please try again later' },
});

/**
 * Stricter limiter for auth endpoints (login/register).
 * 20 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many auth attempts, please try again later' },
});

module.exports = { apiLimiter, authLimiter };
