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
        pickup: {
            type: String,
            required: true,
        },
        destination: {
            type: String,
            required: true,
        },
        fare: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        duration: {
            type: Number, // in seconds
        },
        distance: {
            type: Number, // in meters
        },
        paymentID: {
            type: String,
        },
        orderId: {
            type: String,
        },
        signature: {
            type: String,
        },
        otp: {
            type: String,
            select: false,
            required: true,
        },
    },
    { timestamps: true }
);

// Compound index for captain ride lookups
rideSchema.index({ captain: 1, status: 1 });

module.exports = mongoose.model('ride', rideSchema);