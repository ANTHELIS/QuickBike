const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');
const blackListTokenModel = require('../models/blacklistToken.model');
const AppError = require('../utils/AppError');

module.exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, phone } = req.body;

    const existingPhone = await userModel.findOne({ phone });
    if (existingPhone) {
        throw new AppError('User with this phone number already exists', 409);
    }

    if (email) {
        const existingEmail = await userModel.findOne({ email });
        if (existingEmail) {
            throw new AppError('User with this email already exists', 409);
        }
    }

    const hashedPassword = await userModel.hashPassword(password);

    const user = await userService.createUser({
        firstname: fullname.firstname,
        lastname: fullname.lastname,
        email,
        phone,
        password: hashedPassword,
    });

    const token = user.generateAuthToken();

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ token, user });
};

module.exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    const user = await userModel.findOne({
        $or: [{ email: identifier }, { phone: identifier }]
    }).select('+password +loginAttempts +lockUntil');
    if (!user) {
        throw new AppError('Invalid email/phone or password', 401);
    }

    if (user.isLocked()) {
        const minsLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
        throw new AppError(`Account locked. Try again in ${minsLeft} minutes.`, 423);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        await user.incrementLoginAttempts();
        throw new AppError('Invalid email or password', 401);
    }

    await user.resetLoginAttempts();
    const token = user.generateAuthToken();

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(200).json({ token, user });
};

module.exports.getUserProfile = async (req, res) => {
    res.status(200).json({ user: req.user });
};

module.exports.logoutUser = async (req, res) => {
    const token = req.token;

    if (token) {
        await blackListTokenModel.create({ token });
    }

    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out' });
};

// PATCH /users/profile  — update name, phone
module.exports.updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { firstname, lastname, phone } = req.body;

    const updateData = {};
    if (firstname) updateData['fullname.firstname'] = firstname.trim();
    if (lastname !== undefined) updateData['fullname.lastname'] = lastname.trim();
    if (phone !== undefined) updateData.phone = phone.trim();

    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    res.status(200).json({ user });
};

// GET /users/saved-places
module.exports.getSavedPlaces = async (req, res) => {
    const user = await userModel.findById(req.user._id).select('savedPlaces');
    res.status(200).json({ savedPlaces: user.savedPlaces });
};

// POST /users/saved-places  — add or update a place
module.exports.upsertSavedPlace = async (req, res) => {
    const { label, address, icon } = req.body;
    if (!label || !address) {
        return res.status(400).json({ message: 'label and address are required' });
    }

    const user = await userModel.findById(req.user._id);
    const existing = user.savedPlaces.find(p => p.label.toLowerCase() === label.toLowerCase());
    if (existing) {
        existing.address = address;
        if (icon) existing.icon = icon;
    } else {
        user.savedPlaces.push({ label, address, icon: icon || 'home' });
    }

    await user.save();
    res.status(200).json({ savedPlaces: user.savedPlaces });
};

// DELETE /users/saved-places/:label
module.exports.deleteSavedPlace = async (req, res) => {
    const { label } = req.params;
    const user = await userModel.findById(req.user._id);
    user.savedPlaces = user.savedPlaces.filter(
        p => p.label.toLowerCase() !== label.toLowerCase()
    );
    await user.save();
    res.status(200).json({ savedPlaces: user.savedPlaces });
};

// ─────────────────────────────────────────────────
// GET /users/wallet  — wallet balance + payment methods
// ─────────────────────────────────────────────────
module.exports.getWallet = async (req, res) => {
    const user = await userModel.findById(req.user._id).select('wallet paymentMethods');
    res.status(200).json({
        wallet: user.wallet,
        paymentMethods: user.paymentMethods || [],
    });
};

// ─────────────────────────────────────────────────
// POST /users/wallet/topup  — top up wallet balance
// ─────────────────────────────────────────────────
module.exports.topUpWallet = async (req, res) => {
    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0 || parsedAmount > 50000) {
        return res.status(400).json({ message: 'Amount must be between ₹1 and ₹50,000' });
    }

    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        { $inc: { 'wallet.balance': parsedAmount } },
        { new: true }
    ).select('wallet');

    res.status(200).json({ wallet: user.wallet, message: `₹${parsedAmount} added to wallet` });
};

// ─────────────────────────────────────────────────
// GET /users/payment-history  — paginated ride payment history
// ─────────────────────────────────────────────────
module.exports.getPaymentHistory = async (req, res) => {
    const paymentModel = require('../models/payment.model');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 15, 50);

    const [payments, total] = await Promise.all([
        paymentModel
            .find({ user: req.user._id })
            .populate('ride', 'pickup destination fare vehicleType createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        paymentModel.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({ data: payments, total, page, limit });
};

// ─────────────────────────────────────────────────
// POST /users/payment-methods  — add UPI or virtual card ID
// ─────────────────────────────────────────────────
module.exports.addPaymentMethod = async (req, res) => {
    const { type, label, value } = req.body;

    if (!type || !['upi', 'card'].includes(type)) {
        return res.status(400).json({ message: 'type must be "upi" or "card"' });
    }
    if (!value || !value.trim()) {
        return res.status(400).json({ message: 'value is required' });
    }

    // UPI format validation
    if (type === 'upi' && !/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim())) {
        return res.status(400).json({ message: 'Invalid UPI ID format (e.g. name@upi)' });
    }

    const user = await userModel.findById(req.user._id).select('paymentMethods');

    // Prevent duplicates
    const exists = user.paymentMethods.some(m => m.value === value.trim());
    if (exists) {
        return res.status(409).json({ message: 'This payment method is already saved' });
    }

    if (user.paymentMethods.length >= 10) {
        return res.status(400).json({ message: 'Maximum 10 payment methods allowed' });
    }

    // First method becomes default automatically
    const isDefault = user.paymentMethods.length === 0;
    user.paymentMethods.push({ type, label: label || value, value: value.trim(), isDefault });
    await user.save();

    res.status(201).json({ paymentMethods: user.paymentMethods });
};

// ─────────────────────────────────────────────────
// DELETE /users/payment-methods/:methodId  — remove payment method
// ─────────────────────────────────────────────────
module.exports.deletePaymentMethod = async (req, res) => {
    const { methodId } = req.params;
    const user = await userModel.findById(req.user._id).select('paymentMethods');
    const before = user.paymentMethods.length;
    user.paymentMethods = user.paymentMethods.filter(m => m._id.toString() !== methodId);
    if (user.paymentMethods.length === before) {
        return res.status(404).json({ message: 'Payment method not found' });
    }
    // Re-assign default if deleted method was default
    if (user.paymentMethods.length > 0 && !user.paymentMethods.some(m => m.isDefault)) {
        user.paymentMethods[0].isDefault = true;
    }
    await user.save();
    res.status(200).json({ paymentMethods: user.paymentMethods });
};

// ─────────────────────────────────────────────────
// PATCH /users/payment-methods/:methodId/default  — set as default
// ─────────────────────────────────────────────────
module.exports.setDefaultPaymentMethod = async (req, res) => {
    const { methodId } = req.params;
    const user = await userModel.findById(req.user._id).select('paymentMethods');
    let found = false;
    user.paymentMethods.forEach(m => {
        m.isDefault = m._id.toString() === methodId;
        if (m.isDefault) found = true;
    });
    if (!found) return res.status(404).json({ message: 'Payment method not found' });
    await user.save();
    res.status(200).json({ paymentMethods: user.paymentMethods });
};

// ─────────────────────────────────────────────────
// POST /users/profile/picture  — upload profile picture to Cloudinary
// ─────────────────────────────────────────────────
module.exports.uploadProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
    }

    const { path: url, filename: publicId } = req.file;

    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        { $set: { 'profilePicture.url': url, 'profilePicture.publicId': publicId } },
        { new: true }
    );

    res.status(200).json({ user, profilePictureUrl: url });
};

// ─────────────────────────────────────────────────
// GET /users/notifications  — get user notifications
// ─────────────────────────────────────────────────
module.exports.getNotifications = async (req, res) => {
    const notificationModel = require('../models/notification.model');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const notifications = await notificationModel
        .find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    res.status(200).json({ data: notifications });
};

// ─────────────────────────────────────────────────
// PATCH /users/notifications/read-all
// ─────────────────────────────────────────────────
module.exports.markAllNotificationsRead = async (req, res) => {
    const notificationModel = require('../models/notification.model');
    await notificationModel.updateMany(
        { recipient: req.user._id, status: { $ne: 'read' } },
        { $set: { status: 'read', readAt: new Date() } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
};