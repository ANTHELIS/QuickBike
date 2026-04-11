const mongoose = require('mongoose');

/**
 * Payment Model — Separated from ride for auditability and Razorpay integration.
 *
 * Why a separate collection?
 *   - Razorpay webhooks fire asynchronously — the payment record needs to be
 *     updated independently from the ride status
 *   - Idempotency key prevents duplicate processing of webhook retries
 *   - Webhook event log provides audit trail for disputes
 *   - Refund tracking needs its own lifecycle
 *   - Financial records should never be deleted (compliance)
 */

const paymentSchema = new mongoose.Schema(
    {
        ride: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ride',
            required: true,
            index: true,
        },
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

        // ── Razorpay Integration ──
        razorpayOrderId: {
            type: String,
            index: true,
            sparse: true,
        },
        razorpayPaymentId: {
            type: String,
            index: true,
            sparse: true,
        },
        razorpaySignature: {
            type: String,
            select: false, // sensitive
        },

        // ── Amount ──
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'INR',
        },

        // ── Payment Method ──
        method: {
            type: String,
            enum: ['cash', 'online', 'upi', 'card', 'wallet', 'netbanking'],
            default: 'cash',
        },

        // ── Payment Status ──
        status: {
            type: String,
            enum: ['created', 'attempted', 'captured', 'failed', 'refunded', 'partially_refunded'],
            default: 'created',
            index: true,
        },

        // ── Refund ──
        refund: {
            razorpayRefundId: { type: String },
            amount: { type: Number, default: 0 },
            reason: { type: String, trim: true },
            status: {
                type: String,
                enum: ['initiated', 'processed', 'failed'],
            },
            initiatedAt: { type: Date },
            processedAt: { type: Date },
        },

        // ── Lifecycle timestamps ──
        capturedAt: { type: Date },
        failureReason: { type: String },

        // ── Idempotency ──
        // Prevents duplicate processing of Razorpay webhook retries
        idempotencyKey: {
            type: String,
            unique: true,
            sparse: true,
        },

        // ── Webhook Audit Trail ──
        webhookLog: [
            {
                event: { type: String },         // e.g. 'payment.captured'
                payload: { type: String },       // raw JSON string (truncated)
                receivedAt: { type: Date, default: Date.now },
            },
        ],

        // ── Captain Settlement ──
        captainPayout: {
            amount: { type: Number, default: 0 },
            status: {
                type: String,
                enum: ['pending', 'processed', 'failed'],
                default: 'pending',
            },
            processedAt: { type: Date },
        },
    },
    { timestamps: true }
);

// ── Indexes ──
// razorpayOrderId already has index:true inline
paymentSchema.index({ status: 1, createdAt: 1 }); // settlement queries
paymentSchema.index({ captain: 1, 'captainPayout.status': 1 }); // earnings

module.exports = mongoose.model('payment', paymentSchema);
