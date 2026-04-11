const adminModel   = require('../models/admin.model');
const captainModel = require('../models/captain.model');
const userModel    = require('../models/user.model');
const kycModel     = require('../models/kyc.model');
const rideModel    = require('../models/ride.model');
const logger       = require('../utils/logger');

// ── POST /admin/login ────────────────────────────────
module.exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const admin = await adminModel.findOne({ email: email.toLowerCase() }).select('+password');
        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = admin.generateAuthToken();
        res.json({ token, admin });
    } catch (err) {
        logger.error('adminLogin error', { error: err.message });
        res.status(500).json({ message: 'Login failed' });
    }
};

// ── GET /admin/stats ─────────────────────────────────
module.exports.getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalCaptains, pendingKyc, approvedKyc, rejectedKyc, totalRides, activeRides] =
            await Promise.all([
                userModel.countDocuments(),
                captainModel.countDocuments(),
                kycModel.countDocuments({ status: 'pending' }),
                kycModel.countDocuments({ status: 'approved' }),
                kycModel.countDocuments({ status: 'rejected' }),
                rideModel.countDocuments(),
                rideModel.countDocuments({ status: { $in: ['accepted', 'ongoing'] } }),
            ]);

        res.json({ totalUsers, totalCaptains, pendingKyc, approvedKyc, rejectedKyc, totalRides, activeRides });
    } catch (err) {
        logger.error('getDashboardStats error', { error: err.message });
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};

// ── GET /admin/kyc ───────────────────────────────────
module.exports.listKyc = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;
        const filter = {};
        if (status && status !== 'all') filter.status = status;

        let query = kycModel.find(filter)
            .populate('captain', 'fullname email phone vehicle kycStatus isVerified')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        let kycs = await query;

        // Optional search by captain name
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
        res.json({ kycs, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        logger.error('listKyc error', { error: err.message });
        res.status(500).json({ message: 'Failed to fetch KYC list' });
    }
};

// ── GET /admin/kyc/:id ───────────────────────────────
module.exports.getKycDetail = async (req, res) => {
    try {
        const kyc = await kycModel.findById(req.params.id)
            .populate('captain', 'fullname email phone vehicle kycStatus isVerified createdAt')
            .populate('reviewedBy', 'name email');
        if (!kyc) return res.status(404).json({ message: 'KYC not found' });
        res.json({ kyc });
    } catch (err) {
        logger.error('getKycDetail error', { error: err.message });
        res.status(500).json({ message: 'Failed to fetch KYC detail' });
    }
};

// ── PATCH /admin/kyc/:id/review ──────────────────────
module.exports.reviewKyc = async (req, res) => {
    try {
        const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Action must be "approve" or "reject"' });
        }

        const kyc = await kycModel.findById(req.params.id);
        if (!kyc) return res.status(404).json({ message: 'KYC not found' });
        if (kyc.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending KYCs can be reviewed' });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        kyc.status          = newStatus;
        kyc.reviewedBy      = req.admin._id;
        kyc.reviewedAt      = new Date();
        kyc.rejectionReason = action === 'reject' ? (rejectionReason || 'Documents not clear') : '';
        await kyc.save();

        // Update captain record
        await captainModel.findByIdAndUpdate(kyc.captain, {
            kycStatus:  newStatus,
            isVerified: action === 'approve',
        });

        logger.debug('KYC reviewed', { kycId: kyc._id, action, adminId: req.admin._id });
        res.json({ message: `KYC ${newStatus}`, kyc });
    } catch (err) {
        logger.error('reviewKyc error', { error: err.message });
        res.status(500).json({ message: 'Failed to review KYC' });
    }
};

// ── GET /admin/captains ──────────────────────────────
module.exports.listCaptains = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const captains = await captainModel.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await captainModel.countDocuments();
        res.json({ captains, total });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch captains' });
    }
};

// ── GET /admin/users ─────────────────────────────────
module.exports.listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const users = await userModel.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await userModel.countDocuments();
        res.json({ users, total });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};
