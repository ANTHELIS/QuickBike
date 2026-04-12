const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

const captainSchema = new mongoose.Schema(
    {
        fullname: {
            firstname: {
                type: String,
                required: true,
                minlength: [3, 'Firstname must be at least 3 characters long'],
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
            required: false,
            unique: true,
            sparse: true,   // allows multiple documents without email
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
            // NOTE: No default — field must be ABSENT (not null) for sparse index to work
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
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

        // ── Push Notifications ──
        fcmToken: {
            type: String,
            default: null,
            select: false,
        },

        // ── Status ──
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'inactive',
            index: true,
        },

        // ── Vehicle Details ──
        vehicle: {
            color: {
                type: String,
                required: true,
                minlength: [3, 'Color must be at least 3 characters long'],
                trim: true,
            },
            plate: {
                type: String,
                required: true,
                minlength: [3, 'Plate must be at least 3 characters long'],
                trim: true,
                uppercase: true,
            },
            capacity: {
                type: Number,
                required: true,
                min: [1, 'Capacity must be at least 1'],
            },
            vehicleType: {
                type: String,
                required: true,
                enum: ['car', 'moto', 'auto'],
            },
            model: {
                type: String,
                trim: true,
                default: '',
            },
            year: {
                type: Number,
                min: 2000,
                max: new Date().getFullYear() + 1,
            },
        },

        // ── Location (GeoJSON Point for 2dsphere queries) ──
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0],
            },
        },

        // ── KYC ──
        kycStatus: {
            type: String,
            enum: ['none', 'draft', 'pending', 'approved', 'rejected'],
            default: 'none',
            index: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },

        // ── Ratings ──
        ratings: {
            average: { type: Number, default: 0, min: 0, max: 5 },
            count: { type: Number, default: 0, min: 0 },
            // Breakdown: how many 1-star, 2-star, etc.
            breakdown: {
                1: { type: Number, default: 0 },
                2: { type: Number, default: 0 },
                3: { type: Number, default: 0 },
                4: { type: Number, default: 0 },
                5: { type: Number, default: 0 },
            },
        },

        // ── Earnings ──
        earnings: {
            total: { type: Number, default: 0, min: 0 },       // lifetime
            pending: { type: Number, default: 0, min: 0 },      // not yet settled
            thisWeek: { type: Number, default: 0, min: 0 },
            thisMonth: { type: Number, default: 0, min: 0 },
            lastSettledAt: { type: Date, default: null },
        },

        // ── Bank Account (for settlements) ──
        bankAccount: {
            accountNumber: { type: String, default: '', select: false },
            ifsc: { type: String, default: '', select: false },
            name: { type: String, default: '' },
            verified: { type: Boolean, default: false },
        },

        // ── Performance ──
        performance: {
            acceptanceRate: { type: Number, default: 100, min: 0, max: 100 },
            cancellationCount: { type: Number, default: 0 },     // today
            cancellationCountResetAt: { type: Date, default: Date.now },
            totalRides: { type: Number, default: 0 },
            todayRides: { type: Number, default: 0 },
            todayRidesResetAt: { type: Date, default: Date.now },
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
// 2dsphere for geospatial queries — CRITICAL for dispatch performance
captainSchema.index({ location: '2dsphere' });
// Compound: find active+approved captains near a location
captainSchema.index({ status: 1, kycStatus: 1 });
// phone already has unique:true inline

// ── Instance Methods ──

captainSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

captainSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

captainSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

captainSchema.methods.incrementLoginAttempts = async function () {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 },
        });
    }
    const updates = { $inc: { loginAttempts: 1 } };
    if (this.loginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 };
    }
    return this.updateOne(updates);
};

captainSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 },
    });
};

/**
 * Update captain's average rating after a new review.
 * Uses incremental formula: newAvg = ((oldAvg * oldCount) + newScore) / (oldCount + 1)
 */
captainSchema.methods.addRating = async function (score) {
    const roundedScore = Math.round(score); // 1-5
    const oldCount = this.ratings.count;
    const oldAvg = this.ratings.average;
    const newCount = oldCount + 1;
    const newAvg = ((oldAvg * oldCount) + score) / newCount;

    return this.updateOne({
        $set: {
            'ratings.average': Math.round(newAvg * 10) / 10, // 1 decimal place
            'ratings.count': newCount,
        },
        $inc: {
            [`ratings.breakdown.${roundedScore}`]: 1,
        },
    });
};

// ── Static Methods ──

captainSchema.statics.hashPassword = async function (password) {
    return bcrypt.hash(password, 12);
};

// ── JSON Serialization ──
captainSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.loginAttempts;
    delete obj.lockUntil;
    delete obj.fcmToken;
    delete obj.bankAccount?.accountNumber;
    delete obj.bankAccount?.ifsc;
    delete obj.__v;
    return obj;
};

const captainModel = mongoose.model('captain', captainSchema);

module.exports = captainModel;