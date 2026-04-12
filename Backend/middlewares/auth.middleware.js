const jwt = require('jsonwebtoken');
const config = require('../config');
const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');
const adminModel = require('../models/admin.model');
const blackListTokenModel = require('../models/blacklistToken.model');
const { getRedisClient } = require('../utils/redis');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Extract token from cookie or Authorization header.
 */
function extractToken(req) {
    return (req.headers.authorization?.split(' ')[1]) || req.cookies.token || null;
}

/**
 * Check if a token is blacklisted.
 * Checks Redis first (O(1)), falls back to MongoDB.
 */
async function isTokenBlacklisted(token) {
    try {
        const redis = getRedisClient();
        const redisResult = await redis.get(`blacklist:${token}`);
        if (redisResult) return true;
    } catch {
        // Redis unavailable — fall through to MongoDB
    }

    const mongoResult = await blackListTokenModel.findOne({ token });
    return !!mongoResult;
}

// ─────────────────────────────────────────────────
// User Authentication
// ─────────────────────────────────────────────────
module.exports.authUser = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        if (await isTokenBlacklisted(token)) {
            return next(new AppError('Token has been revoked', 401));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await userModel.findById(decoded._id);
        if (!user) {
            return next(new AppError('User not found', 401));
        }

        // Check account status
        if (user.status === 'suspended') {
            return next(new AppError('Account has been suspended', 403));
        }
        if (user.status === 'deleted') {
            return next(new AppError('Account has been deleted', 401));
        }

        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new AppError('Invalid or expired token', 401));
        }
        next(err);
    }
};

// ─────────────────────────────────────────────────
// Captain Authentication
// ─────────────────────────────────────────────────
module.exports.authCaptain = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        if (await isTokenBlacklisted(token)) {
            return next(new AppError('Token has been revoked', 401));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const captain = await captainModel.findById(decoded._id);
        if (!captain) {
            return next(new AppError('Captain not found', 401));
        }

        // Check account status
        if (captain.status === 'suspended') {
            return next(new AppError('Account has been suspended. Contact support.', 403));
        }

        req.captain = captain;
        req.token = token;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new AppError('Invalid or expired token', 401));
        }
        next(err);
    }
};

// ─────────────────────────────────────────────────
// Captain + KYC Approved Check
// Blocks captains with non-approved KYC from ride operations
// ─────────────────────────────────────────────────
module.exports.authCaptainApproved = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        if (await isTokenBlacklisted(token)) {
            return next(new AppError('Token has been revoked', 401));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const captain = await captainModel.findById(decoded._id);
        if (!captain) {
            return next(new AppError('Captain not found', 401));
        }

        if (captain.status === 'suspended') {
            return next(new AppError('Account has been suspended', 403));
        }

        if (captain.kycStatus !== 'approved') {
            return next(new AppError('KYC approval required to perform this action', 403));
        }

        req.captain = captain;
        req.token = token;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new AppError('Invalid or expired token', 401));
        }
        next(err);
    }
};

// ─────────────────────────────────────────────────
// Admin Authentication — SEPARATE JWT SECRET
// ─────────────────────────────────────────────────
module.exports.authAdmin = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return next(new AppError('Admin authentication required', 401));
        }

        // Admin tokens use a different secret
        const decoded = jwt.verify(token, config.adminJwt.secret);
        const admin = await adminModel.findById(decoded._id);
        if (!admin) {
            return next(new AppError('Admin not found', 401));
        }

        if (!admin.isActive) {
            return next(new AppError('Admin account is disabled', 403));
        }

        req.admin = admin;
        req.token = token;

        // Log admin activity
        logger.info('Admin action', {
            requestId: req.requestId,
            adminId: admin._id,
            adminEmail: admin.email,
            method: req.method,
            url: req.originalUrl,
        });

        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new AppError('Invalid or expired admin token', 401));
        }
        next(err);
    }
};

// ─────────────────────────────────────────────────
// Any Auth — User OR Captain (for shared endpoints)
// ─────────────────────────────────────────────────
module.exports.authAny = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        if (await isTokenBlacklisted(token)) {
            return next(new AppError('Token has been revoked', 401));
        }

        const decoded = jwt.verify(token, config.jwt.secret);

        // Try user first, then captain
        const user = await userModel.findById(decoded._id);
        if (user) {
            if (user.status === 'suspended') return next(new AppError('Account suspended', 403));
            if (user.status === 'deleted') return next(new AppError('Account deleted', 401));
            req.user = user;
            req.token = token;
            return next();
        }

        const captain = await captainModel.findById(decoded._id);
        if (captain) {
            if (captain.status === 'suspended') return next(new AppError('Account suspended', 403));
            req.captain = captain;
            req.token = token;
            return next();
        }

        return next(new AppError('User not found', 401));
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new AppError('Invalid or expired token', 401));
        }
        next(err);
    }
};