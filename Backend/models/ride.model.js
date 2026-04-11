const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
            index: true,
        },
        captain: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'captain',
            index: true,
        },
        pickup: { type: String, required: true },
        destination: { type: String, required: true },
        vehicleType: {
            type: String,
            enum: ['auto', 'car', 'moto'],
            required: true,
        },
        fare: { type: Number, required: true },
        surgeMultiplier: { type: Number, default: 1 },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        duration: { type: Number }, // seconds
        distance: { type: Number }, // meters
        paymentID: { type: String },
        orderId: { type: String },
        signature: { type: String },
        otp: {
            type: String,
            select: false,
            required: true,
        },
        // ── Ratings (post-ride) ──
        userRating: {
            type: Number,
            min: 1,
            max: 5,
        },
        captainRating: {
            type: Number,
            min: 1,
            max: 5,
        },
        userFeedback: { type: String },
        captainFeedback: { type: String },
        // Promo code applied
        promoCode: { type: String },
        discount: { type: Number, default: 0 },
        // When was the ride dispatched (for re-dispatch timeout)
        dispatchedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound indexes
rideSchema.index({ captain: 1, status: 1 });
rideSchema.index({ status: 1, dispatchedAt: 1 }); // for re-dispatch cron

module.exports = mongoose.model('ride', rideSchema);