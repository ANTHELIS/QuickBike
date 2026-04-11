const jwt        = require('jsonwebtoken');
const adminModel = require('../models/admin.model');

module.exports.authAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : req.cookies?.admin_token;

        if (!token) return res.status(401).json({ message: 'Admin authentication required' });

        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access only' });
        }

        const admin = await adminModel.findById(decoded._id);
        if (!admin) return res.status(401).json({ message: 'Admin not found' });

        req.admin = admin;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired admin token' });
    }
};
