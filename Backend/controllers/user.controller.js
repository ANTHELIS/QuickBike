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

    const { fullname, email, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await userModel.hashPassword(password);

    const user = await userService.createUser({
        firstname: fullname.firstname,
        lastname: fullname.lastname,
        email,
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

    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

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