const jwt = require('jsonwebtoken');
const config = require('../config');
const adminModel = require('../models/admin.model');
const logger = require('../utils/logger');

/**
 * Admin Authentication Middleware
 *
 * Uses config.adminJwt.secret (separate from user/captain JWT).
 * Supports all admin roles: super_admin, admin, support, viewer.
 * Logs all admin actions for audit trail.
 */
module.exports.authAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : req.cookies?.admin_token;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Admin authentication required' });
        }

        // Use the SEPARATE admin JWT secret
        const decoded = jwt.verify(token, config.adminJwt.secret);

        const admin = await adminModel.findById(decoded._id);
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }

        if (!admin.isActive) {
            return res.status(403).json({ success: false, message: 'Admin account is disabled' });
        }

        req.admin = admin;

        // Audit log
        logger.info('Admin request', {
            requestId: req.requestId,
            adminId: admin._id,
            role: admin.role,
            method: req.method,
            url: req.originalUrl,
        });

        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
        }
        logger.error('Admin auth error', { error: err.message });
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};

/**
 * Role-based access control middleware.
 * Use after authAdmin to restrict specific routes to certain roles.
 *
 * Usage: router.delete('/users/:id', authAdmin, requireRole('super_admin'), handler)
 */
module.exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ success: false, message: 'Admin authentication required' });
        }
        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `This action requires one of these roles: ${roles.join(', ')}`,
            });
        }
        next();
    };
};
