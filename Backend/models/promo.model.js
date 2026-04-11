const mongoose = require('mongoose');

/**
 * Promo Code Model — Database-backed promo management.
 *
 * Replaces the old hardcoded promo validation in ride.service.js.
 * Supports: flat discount, percentage discount, free rides.
 * Per-user usage tracking prevents abuse.
 */

const promoSchema = new mongoose.Schema(
    {
        // ── Code ──
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            minlength: 3,
            maxlength: 20,
        },

        // ── Type & Value ──
        type: {
            type: String,
            enum: ['flat', 'percent', 'free_ride'],
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: 0,
        },
        maxDiscount: {
            type: Number,
            default: null, // null = no cap (for flat discounts)
        },
        minFare: {
            type: Number,
            default: 0,    // minimum fare required to apply promo
        },

        // ── Usage Limits ──
        usageLimit: {
            type: Number,
            default: null, // null = unlimited total usage
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        userUsageLimit: {
            type: Number,
            default: 1,    // how many times a single user can use it
        },

        // ── Per-user usage tracking ──
        usedBy: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
                ride: { type: mongoose.Schema.Types.ObjectId, ref: 'ride' },
                usedAt: { type: Date, default: Date.now },
            },
        ],

        // ── Validity Period ──
        validFrom: {
            type: Date,
            default: Date.now,
        },
        validUntil: {
            type: Date,
            required: true,
        },

        // ── Applicability Filters ──
        vehicleTypes: {
            type: [String],
            enum: ['auto', 'car', 'moto'],
            default: ['auto', 'car', 'moto'], // all by default
        },
        cities: {
            type: [String],
            default: [],  // empty = all cities
        },

        // ── Status ──
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        // ── Admin ──
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'admin',
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { timestamps: true }
);

// ── Indexes ──
// code already has unique:true inline
promoSchema.index({ isActive: 1, validUntil: 1 }); // find active, non-expired promos
promoSchema.index({ 'usedBy.user': 1 }); // check per-user usage

// ── Instance Method: Validate promo for a specific user and fare ──
promoSchema.methods.validateForUser = function (userId, fare, vehicleType) {
    const now = new Date();

    if (!this.isActive) {
        return { valid: false, reason: 'Promo code is no longer active' };
    }
    if (now < this.validFrom) {
        return { valid: false, reason: 'Promo code is not yet valid' };
    }
    if (now > this.validUntil) {
        return { valid: false, reason: 'Promo code has expired' };
    }
    if (fare < this.minFare) {
        return { valid: false, reason: `Minimum fare of ₹${this.minFare} required` };
    }
    if (this.vehicleTypes.length > 0 && !this.vehicleTypes.includes(vehicleType)) {
        return { valid: false, reason: 'Not applicable for this vehicle type' };
    }
    if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
        return { valid: false, reason: 'Promo code usage limit reached' };
    }

    // Check per-user usage
    const userUsageCount = this.usedBy.filter(
        (u) => u.user.toString() === userId.toString()
    ).length;
    if (userUsageCount >= this.userUsageLimit) {
        return { valid: false, reason: 'You have already used this promo code' };
    }

    // Calculate discount
    let discount = 0;
    if (this.type === 'flat') {
        discount = this.value;
    } else if (this.type === 'percent') {
        discount = (fare * this.value) / 100;
        if (this.maxDiscount !== null) {
            discount = Math.min(discount, this.maxDiscount);
        }
    } else if (this.type === 'free_ride') {
        discount = fare;
    }

    // Round to nearest rupee
    discount = Math.round(discount);

    return {
        valid: true,
        discount,
        finalFare: Math.max(fare - discount, 0),
    };
};

module.exports = mongoose.model('promo', promoSchema);
