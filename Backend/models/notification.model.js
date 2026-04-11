const mongoose = require('mongoose');

/**
 * Notification Model — Persistent notification storage.
 *
 * Why persist notifications?
 *   - Socket events are fire-and-forget. If the client is offline, the message is lost.
 *   - Users expect a notification history they can scroll through.
 *   - Push/SMS/email delivery needs retry tracking.
 *   - Analytics on notification engagement (delivered vs read rate).
 */

const notificationSchema = new mongoose.Schema(
    {
        // ── Recipient ──
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'recipientModel',
            index: true,
        },
        recipientModel: {
            type: String,
            required: true,
            enum: ['user', 'captain'],
        },

        // ── Content ──
        type: {
            type: String,
            enum: ['ride_update', 'payment', 'kyc', 'promo', 'system', 'safety'],
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        body: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        // Structured data for deep-linking (e.g., { rideId: '...', screen: 'riding' })
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        // ── Delivery Channel ──
        channel: {
            type: String,
            enum: ['push', 'sms', 'email', 'in_app'],
            default: 'in_app',
        },

        // ── Status ──
        status: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
            default: 'pending',
            index: true,
        },

        // ── Delivery Tracking ──
        sentAt: { type: Date },
        deliveredAt: { type: Date },
        readAt: { type: Date },

        // ── Retry ──
        retryCount: { type: Number, default: 0 },
        nextRetryAt: { type: Date },
        lastError: { type: String },
    },
    { timestamps: true }
);

// ── Indexes ──
// Fetch user's notifications sorted by time
notificationSchema.index({ recipient: 1, createdAt: -1 });
// Fetch unread notifications
notificationSchema.index({ recipient: 1, status: 1 });
// Clean up old notifications (90 days TTL)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('notification', notificationSchema);
