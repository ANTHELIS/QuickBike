const adminModel   = require('../models/admin.model');
const captainModel = require('../models/captain.model');
const userModel    = require('../models/user.model');
const kycModel     = require('../models/kyc.model');
const rideModel    = require('../models/ride.model');
const paymentModel = require('../models/payment.model');
const surgeModel   = require('../models/surgeZone.model');
const logger       = require('../utils/logger');
const { success, paginated } = require('../utils/response');
const AppError     = require('../utils/AppError');

// ═════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════

// POST /admin/login
module.exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const admin = await adminModel
        .findOne({ email: email.toLowerCase() })
        .select('+password +loginAttempts +lockUntil');

    if (!admin) throw new AppError('Invalid credentials', 401);

    // Account lockout check (5 failed attempts → 15 min lock)
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
        const minsLeft = Math.ceil((admin.lockUntil - Date.now()) / 60000);
        throw new AppError(`Account locked. Try again in ${minsLeft} minutes.`, 423);
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
        // Increment failed attempts
        const attempts = (admin.loginAttempts || 0) + 1;
        const update = { loginAttempts: attempts };
        if (attempts >= 5) {
            update.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        }
        await adminModel.findByIdAndUpdate(admin._id, update);
        throw new AppError('Invalid credentials', 401);
    }

    // Reset login attempts on success
    await adminModel.findByIdAndUpdate(admin._id, {
        loginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
    });

    const token = admin.generateAuthToken();

    logger.info('Admin login', { adminId: admin._id, email, ip: req.ip });

    return success(res, {
        data: { token, admin },
    });
};

// ═════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════

// GET /admin/stats
module.exports.getDashboardStats = async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        totalUsers,
        totalCaptains,
        pendingKyc,
        approvedKyc,
        rejectedKyc,
        totalRides,
        activeRides,
        completedToday,
        todayRevenue,
    ] = await Promise.all([
        userModel.countDocuments(),
        captainModel.countDocuments(),
        kycModel.countDocuments({ status: 'pending' }),
        kycModel.countDocuments({ status: 'approved' }),
        kycModel.countDocuments({ status: 'rejected' }),
        rideModel.countDocuments(),
        rideModel.countDocuments({ status: { $in: ['accepted', 'ongoing'] } }),
        rideModel.countDocuments({ status: 'completed', updatedAt: { $gte: today } }),
        paymentModel.aggregate([
            {
                $match: {
                    status: 'captured',
                    capturedAt: { $gte: today },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
    ]);

    return success(res, {
        data: {
            users: { total: totalUsers },
            captains: { total: totalCaptains },
            kyc: { pending: pendingKyc, approved: approvedKyc, rejected: rejectedKyc },
            rides: {
                total: totalRides,
                active: activeRides,
                completedToday,
            },
            revenue: {
                today: todayRevenue[0]?.total || 0,
            },
        },
    });
};

// GET /admin/analytics — Revenue & ride trends (last 7/30 days)
module.exports.getAnalytics = async (req, res) => {
    const { days = 7 } = req.query;
    const daysNum = Math.min(Math.max(parseInt(days, 10) || 7, 1), 90);
    const since = new Date();
    since.setDate(since.getDate() - daysNum);
    since.setHours(0, 0, 0, 0);

    const [rideTrend, revenueTrend, topCaptains] = await Promise.all([
        // Rides per day
        rideModel.aggregate([
            { $match: { createdAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        // Revenue per day
        paymentModel.aggregate([
            { $match: { status: 'captured', capturedAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$capturedAt' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        // Top 5 captains by rides completed
        rideModel.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: since } } },
            { $group: { _id: '$captain', rides: { $sum: 1 }, earnings: { $sum: '$fare' } } },
            { $sort: { rides: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'captains',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'captain',
                },
            },
            { $unwind: '$captain' },
            {
                $project: {
                    _id: 0,
                    captainId: '$_id',
                    name: {
                        $concat: ['$captain.fullname.firstname', ' ', { $ifNull: ['$captain.fullname.lastname', ''] }],
                    },
                    rides: 1,
                    earnings: 1,
                },
            },
        ]),
    ]);

    return success(res, {
        data: {
            period: `${daysNum} days`,
            rideTrend,
            revenueTrend,
            topCaptains,
        },
    });
};

// ═════════════════════════════════════════════════
// KYC MANAGEMENT
// ═════════════════════════════════════════════════

// GET /admin/kyc
module.exports.listKyc = async (req, res) => {
    const { status, page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    // Build query
    let query = kycModel.find(filter)
        .populate('captain', 'fullname email phone vehicle kycStatus isVerified')
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

    let kycs = await query;

    // Optional search by captain name / email / phone
    if (search) {
        const lower = search.toLowerCase();
        kycs = kycs.filter(k =>
            k.captain?.fullname?.firstname?.toLowerCase().includes(lower) ||
            k.captain?.fullname?.lastname?.toLowerCase().includes(lower) ||
            k.captain?.email?.toLowerCase().includes(lower) ||
            k.captain?.phone?.includes(search)
        );
    }

    const total = await kycModel.countDocuments(filter);

    return paginated(res, {
        data: kycs,
        total,
        page: pageNum,
        limit: limitNum,
    });
};

// GET /admin/kyc/:id
module.exports.getKycDetail = async (req, res) => {
    const kyc = await kycModel.findById(req.params.id)
        .populate('captain', 'fullname email phone vehicle kycStatus isVerified createdAt')
        .populate('reviewedBy', 'name email');

    if (!kyc) throw new AppError('KYC not found', 404);

    return success(res, { data: kyc });
};

// PATCH /admin/kyc/:id/review
module.exports.reviewKyc = async (req, res) => {
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
        throw new AppError('Action must be "approve" or "reject"', 400);
    }

    const kyc = await kycModel.findById(req.params.id);
    if (!kyc) throw new AppError('KYC not found', 404);
    if (kyc.status !== 'pending') {
        throw new AppError('Only pending KYCs can be reviewed', 400);
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    kyc.status          = newStatus;
    kyc.reviewedBy      = req.admin._id;
    kyc.reviewedAt      = new Date();
    if (action === 'reject' && rejectionReason) {
        kyc.rejectionReasons.push({
            field: 'overall',
            reason: rejectionReason || 'Documents not clear',
            timestamp: new Date(),
        });
    }
    await kyc.save();

    // Update captain record
    await captainModel.findByIdAndUpdate(kyc.captain, {
        kycStatus:  newStatus,
        isVerified: action === 'approve',
    });

    logger.info('KYC reviewed', {
        kycId: kyc._id,
        action,
        adminId: req.admin._id,
        captainId: kyc.captain,
    });

    return success(res, { message: `KYC ${newStatus}`, data: kyc });
};

// ═════════════════════════════════════════════════
// CAPTAIN MANAGEMENT
// ═════════════════════════════════════════════════

// GET /admin/captains
module.exports.listCaptains = async (req, res) => {
    const { page = 1, limit = 20, status, kycStatus, search } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const filter = {};

    if (status) filter.status = status;
    if (kycStatus) filter.kycStatus = kycStatus;

    // Text search on name/email/phone
    if (search) {
        filter.$or = [
            { 'fullname.firstname': { $regex: search, $options: 'i' } },
            { 'fullname.lastname': { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
        ];
    }

    const [captains, total] = await Promise.all([
        captainModel.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        captainModel.countDocuments(filter),
    ]);

    return paginated(res, { data: captains, total, page: pageNum, limit: limitNum });
};

// PATCH /admin/captains/:id/suspend
module.exports.suspendCaptain = async (req, res) => {
    const { reason } = req.body;

    const captain = await captainModel.findByIdAndUpdate(
        req.params.id,
        {
            status: 'suspended',
            $push: {
                'adminActions': {
                    action: 'suspended',
                    reason: reason || 'Suspended by admin',
                    by: req.admin._id,
                    at: new Date(),
                },
            },
        },
        { new: true }
    );

    if (!captain) throw new AppError('Captain not found', 404);

    logger.info('Captain suspended', {
        captainId: captain._id,
        adminId: req.admin._id,
        reason,
    });

    return success(res, { message: 'Captain suspended', data: { _id: captain._id, status: captain.status } });
};

// PATCH /admin/captains/:id/unsuspend
module.exports.unsuspendCaptain = async (req, res) => {
    const captain = await captainModel.findByIdAndUpdate(
        req.params.id,
        {
            status: 'inactive',
            $push: {
                'adminActions': {
                    action: 'unsuspended',
                    reason: 'Reinstated by admin',
                    by: req.admin._id,
                    at: new Date(),
                },
            },
        },
        { new: true }
    );

    if (!captain) throw new AppError('Captain not found', 404);

    logger.info('Captain unsuspended', {
        captainId: captain._id,
        adminId: req.admin._id,
    });

    return success(res, { message: 'Captain reinstated', data: { _id: captain._id, status: captain.status } });
};

// ═════════════════════════════════════════════════
// USER MANAGEMENT
// ═════════════════════════════════════════════════

// GET /admin/users
module.exports.listUsers = async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const filter = {};

    if (status) filter.status = status;

    if (search) {
        filter.$or = [
            { 'fullname.firstname': { $regex: search, $options: 'i' } },
            { 'fullname.lastname': { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
        ];
    }

    const [users, total] = await Promise.all([
        userModel.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        userModel.countDocuments(filter),
    ]);

    return paginated(res, { data: users, total, page: pageNum, limit: limitNum });
};

// PATCH /admin/users/:id/suspend
module.exports.suspendUser = async (req, res) => {
    const { reason } = req.body;
    const user = await userModel.findByIdAndUpdate(
        req.params.id,
        { status: 'suspended' },
        { new: true }
    );
    if (!user) throw new AppError('User not found', 404);

    logger.info('User suspended', { userId: user._id, adminId: req.admin._id, reason });
    return success(res, { message: 'User suspended', data: { _id: user._id, status: user.status } });
};

// PATCH /admin/users/:id/unsuspend
module.exports.unsuspendUser = async (req, res) => {
    const user = await userModel.findByIdAndUpdate(
        req.params.id,
        { status: 'active' },
        { new: true }
    );
    if (!user) throw new AppError('User not found', 404);

    logger.info('User unsuspended', { userId: user._id, adminId: req.admin._id });
    return success(res, { message: 'User reinstated', data: { _id: user._id, status: user.status } });
};

// ═════════════════════════════════════════════════
// RIDE MONITORING
// ═════════════════════════════════════════════════

// GET /admin/rides — List all rides with filters
module.exports.listRides = async (req, res) => {
    const { page = 1, limit = 20, status, from, to } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    // Date range filter
    if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
    }

    const [rides, total] = await Promise.all([
        rideModel.find(filter)
            .populate('user', 'fullname email phone')
            .populate('captain', 'fullname email phone vehicle')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),
        rideModel.countDocuments(filter),
    ]);

    return paginated(res, { data: rides, total, page: pageNum, limit: limitNum });
};

// GET /admin/rides/:id — Detailed ride view
module.exports.getRideDetail = async (req, res) => {
    const ride = await rideModel.findById(req.params.id)
        .populate('user', 'fullname email phone')
        .populate('captain', 'fullname email phone vehicle ratings')
        .lean();

    if (!ride) throw new AppError('Ride not found', 404);

    // Attach payment info
    const payment = await paymentModel.findOne({ ride: ride._id }).lean();

    return success(res, { data: { ...ride, payment } });
};

// ═════════════════════════════════════════════════
// SURGE ZONE MANAGEMENT
// ═════════════════════════════════════════════════

// GET /admin/surge-zones
module.exports.listSurgeZones = async (req, res) => {
    const zones = await surgeModel.find({ isActive: true }).sort({ multiplier: -1 });
    return success(res, { data: zones });
};

// POST /admin/surge-zones — Create a new surge zone
module.exports.createSurgeZone = async (req, res) => {
    const { name, city, center, radiusKm, multiplier, reason } = req.body;

    if (!name || !city || !center?.lat || !center?.lng || !radiusKm || !multiplier) {
        throw new AppError('name, city, center {lat, lng}, radiusKm, and multiplier are required', 400);
    }
    if (multiplier < 1 || multiplier > 3) {
        throw new AppError('Multiplier must be between 1 and 3', 400);
    }

    // Generate a circular polygon (32 vertices) from center + radius
    const polygon = generateCirclePolygon(center.lng, center.lat, radiusKm);

    const zone = await surgeModel.create({
        name,
        city,
        polygon: {
            type: 'Polygon',
            coordinates: [polygon],
        },
        currentMultiplier: multiplier,
        maxMultiplier: multiplier,
        isActive: true,
    });

    logger.info('Surge zone created', { zoneId: zone._id, name, multiplier, adminId: req.admin._id });

    return success(res, { statusCode: 201, message: 'Surge zone created', data: zone });
};

/**
 * Generate a circle polygon approximation (32 vertices).
 * Returns array of [lng, lat] coordinate pairs.
 */
function generateCirclePolygon(centerLng, centerLat, radiusKm, points = 32) {
    const coords = [];
    const earthRadiusKm = 6371;
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const lat = centerLat + (radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.sin(angle);
        const lng = centerLng + (radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(angle) / Math.cos(centerLat * Math.PI / 180);
        coords.push([lng, lat]);
    }
    return coords;
}

// DELETE /admin/surge-zones/:id
module.exports.deleteSurgeZone = async (req, res) => {
    const zone = await surgeModel.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    );
    if (!zone) throw new AppError('Surge zone not found', 404);

    logger.info('Surge zone deactivated', { zoneId: zone._id, adminId: req.admin._id });

    return success(res, { message: 'Surge zone deactivated' });
};

// ═════════════════════════════════════════════════
// ADMIN SEED (CLI helper — not exposed via routes)
// ═════════════════════════════════════════════════

module.exports.seedAdmin = async ({ name, email, password, role = 'super_admin' }) => {
    const existing = await adminModel.findOne({ email: email.toLowerCase() });
    if (existing) {
        console.log(`Admin already exists: ${email}`);
        return existing;
    }

    const hashedPassword = await adminModel.hashPassword(password);
    const admin = await adminModel.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
    });

    console.log(`Admin created: ${email} (role: ${role})`);
    return admin;
};

// POST /admin/wallet/topup
module.exports.topupWallet = async (req, res) => {
    const { userId, userType, amount } = req.body;
    if (!userId || !userType || !amount) {
        throw new AppError('userId, userType, and amount are required', 400);
    }
    const model = userType === 'captain' ? require('../models/captain.model') : require('../models/user.model');
    const user = await model.findByIdAndUpdate(
        userId,
        { $inc: { 'wallet.balance': Number(amount) } },
        { new: true }
    );
    if (!user) throw new AppError(`${userType} not found`, 404);
    logger.info('Admin topped up wallet', { userId, userType, amount, adminId: req.admin._id });
    return success(res, { message: 'Wallet topped up', data: { balance: user.wallet.balance } });
};

// POST /admin/wallet/adjust — credit or debit any amount
module.exports.adjustWallet = async (req, res) => {
    const { userId, userType, amount, note } = req.body;
    if (!userId || !userType || amount === undefined) {
        throw new AppError('userId, userType, and amount are required', 400);
    }
    const delta = Number(amount); // positive = credit, negative = debit
    if (isNaN(delta)) throw new AppError('amount must be a number', 400);

    const model = userType === 'captain' ? require('../models/captain.model') : require('../models/user.model');
    const doc = await model.findById(userId);
    if (!doc) throw new AppError(`${userType} not found`, 404);

    const newBalance = (doc.wallet?.balance || 0) + delta;
    if (newBalance < 0) throw new AppError('Adjustment would result in negative balance', 400);

    doc.wallet = doc.wallet || {};
    doc.wallet.balance = newBalance;
    await doc.save();

    logger.info('Admin wallet adjusted', { userId, userType, delta, note, adminId: req.admin._id });
    return success(res, {
        message: `Wallet ${delta >= 0 ? 'credited' : 'debited'} successfully`,
        data: { userId, userType, balance: newBalance, change: delta },
    });
};

// GET /admin/wallet/balances — paginated list of users + captains with wallet info
module.exports.listWalletBalances = async (req, res) => {
    const { type = 'all', page = 1, limit = 30, search } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 30, 100);
    const skip = (pageNum - 1) * limitNum;

    const searchFilter = search ? {
        $or: [
            { 'fullname.firstname': { $regex: search, $options: 'i' } },
            { 'fullname.lastname':  { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
        ],
    } : {};

    const [usersRaw, captainsRaw] = await Promise.all([
        type !== 'captain' ? userModel.find(searchFilter).select('fullname email phone wallet createdAt').lean() : [],
        type !== 'user'    ? captainModel.find(searchFilter).select('fullname email phone wallet createdAt').lean() : [],
    ]);

    const combined = [
        ...usersRaw.map(u => ({ ...u, userType: 'user' })),
        ...captainsRaw.map(c => ({ ...c, userType: 'captain' })),
    ].sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0));

    const total = combined.length;
    const data  = combined.slice(skip, skip + limitNum);

    return paginated(res, { data, total, page: pageNum, limit: limitNum });
};

// ═════════════════════════════════════════════════
// PROMO / OFFERS MANAGEMENT
// ═════════════════════════════════════════════════
const promoModel = require('../models/promo.model');

// GET /admin/promos
module.exports.listPromos = async (req, res) => {
    const { active, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
    const filter = {};
    if (active === 'true')  filter.isActive = true;
    if (active === 'false') filter.isActive = false;

    const [promos, total] = await Promise.all([
        promoModel.find(filter).select('-usedBy').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
        promoModel.countDocuments(filter),
    ]);

    // Attach usage count per promo
    const rideModel2 = require('../models/ride.model');
    const usageCounts = await rideModel2.aggregate([
        { $match: { promoCode: { $exists: true, $ne: null }, status: 'completed' } },
        { $group: { _id: '$promoCode', count: { $sum: 1 }, totalDiscount: { $sum: '$discount' } } },
    ]);
    const usageMap = {};
    usageCounts.forEach(u => { usageMap[u._id] = { count: u.count, totalDiscount: u.totalDiscount }; });
    const enriched = promos.map(p => ({ ...p, usage: usageMap[p.code] || { count: 0, totalDiscount: 0 } }));

    return paginated(res, { data: enriched, total, page: pageNum, limit: limitNum });
};

// POST /admin/promos
module.exports.createPromo = async (req, res) => {
    const { code, type, value, maxDiscount, minFare, maxUsage, perUserLimit, validFrom, validUntil, applicableVehicles, description } = req.body;
    if (!code || !type || value === undefined || !validUntil) {
        throw new AppError('code, type, value, and validUntil are required', 400);
    }
    const promo = await promoModel.create({
        code: code.toUpperCase().trim(),
        type,
        value: Number(value),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        minFare: minFare ? Number(minFare) : 0,
        maxUsage: maxUsage ? Number(maxUsage) : null,
        perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: new Date(validUntil),
        applicableVehicles: applicableVehicles || ['moto', 'auto', 'car'],
        description: description || '',
        isActive: true,
    });
    logger.info('Promo created', { code: promo.code, adminId: req.admin._id });
    return success(res, { statusCode: 201, message: 'Promo created', data: promo });
};

// PATCH /admin/promos/:id
module.exports.updatePromo = async (req, res) => {
    const allowed = ['value', 'maxDiscount', 'minFare', 'maxUsage', 'perUserLimit', 'validFrom', 'validUntil', 'applicableVehicles', 'description', 'isActive'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const promo = await promoModel.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!promo) throw new AppError('Promo not found', 404);

    logger.info('Promo updated', { promoId: promo._id, update, adminId: req.admin._id });
    return success(res, { message: 'Promo updated', data: promo });
};

// PATCH /admin/promos/:id/toggle
module.exports.togglePromo = async (req, res) => {
    const promo = await promoModel.findById(req.params.id);
    if (!promo) throw new AppError('Promo not found', 404);
    promo.isActive = !promo.isActive;
    await promo.save();
    logger.info('Promo toggled', { promoId: promo._id, isActive: promo.isActive, adminId: req.admin._id });
    return success(res, { message: `Promo ${promo.isActive ? 'activated' : 'deactivated'}`, data: { _id: promo._id, isActive: promo.isActive } });
};

// DELETE /admin/promos/:id
module.exports.deletePromo = async (req, res) => {
    const promo = await promoModel.findByIdAndDelete(req.params.id);
    if (!promo) throw new AppError('Promo not found', 404);
    logger.info('Promo deleted', { promoId: req.params.id, adminId: req.admin._id });
    return success(res, { message: 'Promo deleted' });
};

