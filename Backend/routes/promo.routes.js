const express = require('express');
const router = express.Router();
const promoModel = require('../models/promo.model');
const authMiddleware = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

// GET /promos  — list all active, non-expired promos (public but auth required so we can check per-user usage)
router.get('/', authMiddleware.authUser, asyncHandler(async (req, res) => {
    const now = new Date();
    const promos = await promoModel.find({
        isActive: true,
        // validFrom is optional — if not set or null, promo is immediately active
        $or: [
            { validFrom: { $lte: now } },
            { validFrom: null },
            { validFrom: { $exists: false } },
        ],
        validUntil: { $gte: now },
    }).select('-usedBy -__v').sort({ createdAt: -1 }).lean();

    // Attach per-user savings (total discount used)
    const rideModel = require('../models/ride.model');
    const savingsAgg = await rideModel.aggregate([
        { $match: { user: req.user._id, status: 'completed', promoCode: { $exists: true, $ne: null } } },
        { $group: { _id: null, totalSaved: { $sum: '$discount' } } }
    ]);
    const totalSaved = savingsAgg[0]?.totalSaved || 0;

    res.status(200).json({ promos, totalSaved });
}));

// POST /promos/validate  — check if a promo is valid for a given fare
router.post('/validate', authMiddleware.authUser, asyncHandler(async (req, res) => {
    const { code, fare, vehicleType } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Promo code required' });

    const promo = await promoModel.findOne({ code: code.toUpperCase().trim() });
    if (!promo) return res.status(404).json({ valid: false, message: 'Promo code not found' });

    const result = promo.validateForUser(req.user._id, fare || 0, vehicleType || 'moto');
    res.status(result.valid ? 200 : 400).json(result);
}));

module.exports = router;
