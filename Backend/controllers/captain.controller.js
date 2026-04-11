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
            email:     email || null,
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
    const captain = req.captain;

    captain.status = status;
    await captain.save();

    res.status(200).json({ message: `Status updated to ${status}`, status });
};