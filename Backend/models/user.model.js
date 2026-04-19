const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

const userSchema = new mongoose.Schema(
    {
        fullname: {
            firstname: {
                type: String,
                required: true,
                minlength: [3, 'First name must be at least 3 characters long'],
                trim: true,
            },
            lastname: {
                type: String,
                trim: true,
                default: '',
            },
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        phone: {
            type: String,
            trim: true,
            default: '',
            match: [/^$|^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        socketId: {
            type: String,
            default: null,
        },

        // ── Profile Picture ──
        profilePicture: {
            url: { type: String, default: '' },
            publicId: { type: String, default: '' },
        },

        // ── Push Notifications ──
        fcmToken: {
            type: String,
            default: null,
            select: false, // don't leak to other users
        },

        // ── Saved Places (max 10) ──
        savedPlaces: {
            type: [
                {
                    label: { type: String, trim: true },   // e.g. "Home", "Work"
                    address: { type: String, trim: true },
                    icon: { type: String, default: 'home' },
                },
            ],
            validate: [
                (val) => val.length <= 10,
                'Maximum 10 saved places allowed',
            ],
        },

        // ── Wallet ──
        wallet: {
            balance: { type: Number, default: 0, min: 0 },
            currency: { type: String, default: 'INR' },
        },

        // ── Saved Payment Methods ──
        paymentMethods: {
            type: [
                {
                    type: { type: String, enum: ['upi', 'card'], required: true },
                    label: { type: String, trim: true },     // e.g. 'Personal UPI', 'HDFC Debit'
                    value: { type: String, trim: true },     // UPI ID or masked card number
                    isDefault: { type: Boolean, default: false },
                    addedAt: { type: Date, default: Date.now },
                },
            ],
            default: [],
        },

        // ── Trusted Contacts (Safety SOS) ──
        trustedContacts: {
            type: [
                {
                    name: { type: String, trim: true },
                    phone: { type: String, trim: true },
                    relationship: { type: String, trim: true, default: 'Other' },
                    addedAt: { type: Date, default: Date.now },
                },
            ],
            default: [],
        },

        // ── Preferences ──
        preferences: {
            language: { type: String, enum: ['en', 'hi'], default: 'en' },
            notifications: {
                push: { type: Boolean, default: true },
                sms: { type: Boolean, default: true },
                email: { type: Boolean, default: true },
            },
        },

        // ── Account Status ──
        status: {
            type: String,
            enum: ['active', 'suspended', 'deleted'],
            default: 'active',
            index: true,
        },

        // ── Login Security ──
        loginAttempts: {
            type: Number,
            default: 0,
            select: false,
        },
        lockUntil: {
            type: Date,
            default: null,
            select: false,
        },
    },
    { timestamps: true }
);

// ── Indexes ──
// email already has unique:true inline
userSchema.index({ phone: 1 }, { sparse: true });
// status already has index:true inline

// ── Instance Methods ──

userSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

/**
 * Check if account is locked due to too many login attempts.
 * Returns true if locked, false if OK to proceed.
 */
userSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Increment login attempts. Lock account after 5 failed attempts for 30 min.
 */
userSchema.methods.incrementLoginAttempts = async function () {
    // If previous lock has expired, reset counter
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 },
        });
    }
    const updates = { $inc: { loginAttempts: 1 } };
    // Lock after 5 attempts
    if (this.loginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 min
    }
    return this.updateOne(updates);
};

/**
 * Reset login attempts on successful login.
 */
userSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 },
    });
};

// ── Static Methods ──

userSchema.statics.hashPassword = async function (password) {
    return bcrypt.hash(password, 12); // cost factor 12 for production
};

// ── JSON Serialization — strip sensitive fields ──
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.loginAttempts;
    delete obj.lockUntil;
    delete obj.fcmToken;
    delete obj.__v;
    return obj;
};

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;