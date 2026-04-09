const jwt = require('jsonwebtoken');
const config = require('../config');
const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');
const blackListTokenModel = require('../models/blacklistToken.model');
const AppError = require('../utils/AppError');

function extractToken(req) {
    return req.cookies.token || (req.headers.authorization?.split(' ')[1]) || null;
}

module.exports.authUser = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        const isBlacklisted = await blackListTokenModel.findOne({ token });
        if (isBlacklisted) {
            return next(new AppError('Token has been revoked', 401));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await userModel.findById(decoded._id);
        if (!user) {
            return next(new AppError('User not found', 401));
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

module.exports.authCaptain = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        const isBlacklisted = await blackListTokenModel.findOne({ token });
        if (isBlacklisted) {
            return next(new AppError('Token has been revoked', 401));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const captain = await captainModel.findById(decoded._id);
        if (!captain) {
            return next(new AppError('Captain not found', 401));
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

/**
 * authAny — accepts either a user or a captain token.
 * Attaches req.user OR req.captain depending on which was found.
 * Used for shared endpoints like ride history that both roles can access.
 */
module.exports.authAny = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return next(new AppError('Authentication required', 401));
        }

        const isBlacklisted = await blackListTokenModel.findOne({ token });
        if (isBlacklisted) {
            return next(new AppError('Token has been revoked', 401));
        }

        const decoded = jwt.verify(token, config.jwt.secret);

        // Try user first, then captain
        const user = await userModel.findById(decoded._id);
        if (user) {
            req.user = user;
            req.token = token;
            return next();
        }

        const captain = await captainModel.findById(decoded._id);
        if (captain) {
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