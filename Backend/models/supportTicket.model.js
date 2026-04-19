const mongoose = require('mongoose');

/**
 * SupportTicket Model
 *
 * Persists every message a user sends from /user/help.
 * Admin can view and reply from /admin/support.
 */

const replySchema = new mongoose.Schema({
    message:   { type: String, required: true, trim: true },
    sentBy:    { type: String, enum: ['user', 'admin'], required: true },
    senderName:{ type: String },
    createdAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema(
    {
        // ── Identification ──
        ticketId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // ── Linked user ──
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
            index: true,
        },

        // ── Content ──
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        category: {
            type: String,
            enum: ['Ride Issue', 'Payment', 'Account', 'Safety', 'Other'],
            default: 'Other',
        },
        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 2000,
        },

        // ── Thread (replies) ──
        replies: [replySchema],

        // ── Status ──
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: 'open',
            index: true,
        },
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal',
        },

        // ── Resolution ──
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        resolvedAt: Date,
        adminNote:  String,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
