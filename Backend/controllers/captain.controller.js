const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const blackListTokenModel = require('../models/blacklistToken.model');
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

module.exports.registerCaptain = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, phone, password, vehicle } = req.body;

    // Check duplicate phone
    const phoneExists = await captainModel.findOne({ phone });
    if (phoneExists) throw new AppError('Phone number already registered', 409);

    // Check duplicate email only if provided
    if (email) {
        const emailExists = await captainModel.findOne({ email });
        if (emailExists) throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await captainModel.hashPassword(password);

    let captain;
    try {
        captain = await captainService.createCaptain({
            firstname: fullname.firstname,
            lastname:  fullname.lastname,
            email:     email || undefined,
            phone,
            password:  hashedPassword,
            color:     vehicle.color,
            plate:     vehicle.plate,
            capacity:  vehicle.capacity,
            vehicleType: vehicle.vehicleType,
        });
    } catch (dbErr) {
        // Handle MongoDB unique constraint violation (E11000)
        if (dbErr.code === 11000) {
            const field = Object.keys(dbErr.keyPattern || {})[0] || 'field';
            const label = field === 'phone' ? 'Phone number' : field === 'email' ? 'Email' : 'Number plate';
            return res.status(409).json({ message: `${label} is already registered` });
        }
        throw dbErr; // re-throw unexpected errors
    }

    const token = captain.generateAuthToken();
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ token, captain });
};

module.exports.loginCaptain = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, password } = req.body;

    if (!email && !phone) {
        throw new AppError('Email or phone number is required', 400);
    }

    // Login by phone (preferred) or email
    const query = phone ? { phone } : { email };
    const captain = await captainModel.findOne(query).select('+password');
    if (!captain) {
        throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await captain.comparePassword(password);
    if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
    }

    const token = captain.generateAuthToken();

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ token, captain });
};

module.exports.getCaptainProfile = async (req, res) => {
    res.status(200).json({ captain: req.captain });
};

module.exports.logoutCaptain = async (req, res) => {
    const token = req.token;

    if (token) {
        await blackListTokenModel.create({ token });
    }

    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successfully' });
};

module.exports.updateStatus = async (req, res) => {
    const { status } = req.body;
    
    await captainModel.findByIdAndUpdate(req.captain._id, { $set: { status } });

    res.status(200).json({ message: `Status updated to ${status}`, status });
};

module.exports.updateProfile = async (req, res) => {
    const { firstname, lastname, phone, vehicleModel, vehicleColor, vehiclePlate } = req.body;
    
    const updateData = {};
    if (firstname) updateData['fullname.firstname'] = firstname;
    if (lastname !== undefined) updateData['fullname.lastname'] = lastname;
    if (phone) updateData.phone = phone;
    if (vehicleModel) updateData['vehicle.model'] = vehicleModel;
    if (vehicleColor) updateData['vehicle.color'] = vehicleColor;
    if (vehiclePlate) updateData['vehicle.plate'] = vehiclePlate.toUpperCase();

    const updatedCaptain = await captainModel.findByIdAndUpdate(
        req.captain._id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    res.status(200).json(updatedCaptain);
};

// ─────────────────────────────────────────────────
// POST /captains/profile/picture  — upload profile picture to Cloudinary
// ─────────────────────────────────────────────────
module.exports.uploadProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
    }

    const { path: url, filename: publicId } = req.file;

    const captain = await captainModel.findByIdAndUpdate(
        req.captain._id,
        { $set: { 'profilePicture.url': url, 'profilePicture.publicId': publicId } },
        { new: true }
    );

    res.status(200).json({ captain, profilePictureUrl: url });
};

// ─────────────────────────────────────────────────
// POST /captains/vehicle/image  — upload vehicle image to Cloudinary
// ─────────────────────────────────────────────────
module.exports.uploadVehicleImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
    }

    const { path: url, filename: publicId } = req.file;

    const captain = await captainModel.findByIdAndUpdate(
        req.captain._id,
        { $set: { 'vehicle.image.url': url, 'vehicle.image.publicId': publicId } },
        { new: true }
    );

    res.status(200).json({ captain, vehicleImageUrl: url });
};

// ─────────────────────────────────────────────────
// GET /captains/notifications  — get captain notifications
// ─────────────────────────────────────────────────
module.exports.getNotifications = async (req, res) => {
    const notificationModel = require('../models/notification.model');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const notifications = await notificationModel
        .find({ recipient: req.captain._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    res.status(200).json({ data: notifications });
};

// ─────────────────────────────────────────────────
// PATCH /captains/notifications/read-all
// ─────────────────────────────────────────────────
module.exports.markAllNotificationsRead = async (req, res) => {
    const notificationModel = require('../models/notification.model');
    await notificationModel.updateMany(
        { recipient: req.captain._id, status: { $ne: 'read' } },
        { $set: { status: 'read', readAt: new Date() } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
};