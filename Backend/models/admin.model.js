const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Admin Model — Separate JWT secret for security isolation.
 *
 * Even if a user/captain JWT secret is compromised, admin access
 * remains secure because it uses config.adminJwt.secret.
 *
 * Admins are created via CLI script, never via public API.
 */

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ['super_admin', 'admin', 'support', 'viewer'],
            default: 'admin',
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        // ── Audit ──
        lastLoginAt: { type: Date },
        lastLoginIp: { type: String },
        loginAttempts: { type: Number, default: 0, select: false },
        lockUntil: { type: Date, default: null, select: false },
    },
    { timestamps: true }
);

// ── Instance Methods ──

adminSchema.methods.generateAuthToken = function () {
    // Uses SEPARATE admin JWT secret
    return jwt.sign(
        { _id: this._id, role: this.role },
        config.adminJwt.secret,
        { expiresIn: config.adminJwt.expiresIn }
    );
};

adminSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

// ── Static Methods ──

adminSchema.statics.hashPassword = async function (password) {
    return bcrypt.hash(password, 14); // higher cost factor for admin
};

// ── JSON Serialization ──
adminSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.loginAttempts;
    delete obj.lockUntil;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('admin', adminSchema);
