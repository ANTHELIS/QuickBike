const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { authAdmin } = require('../middlewares/auth.admin.middleware');
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/user.model');
const SupportTicket = require('../models/supportTicket.model');
const logger = require('../utils/logger');
const { success, paginated } = require('../utils/response');

/**
 * Generate a human-readable ticket ID: QBH-XXXXXXXX
 */
function generateTicketId() {
    return `QBH-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).toUpperCase().slice(2, 5)}`;
}

// ─────────────────────────────────────────────────────────────────
// USER-FACING ROUTES
// ─────────────────────────────────────────────────────────────────

// POST /support/message  — submit a help/complaint message
router.post('/message', authMiddleware.authUser, asyncHandler(async (req, res) => {
    const { subject, message, category } = req.body;
    if (!message || message.trim().length < 10) {
        return res.status(400).json({ message: 'Message must be at least 10 characters' });
    }

    const ticketId = generateTicketId();

    const ticket = await SupportTicket.create({
        ticketId,
        user: req.user._id,
        subject: (subject || category || 'General Inquiry').trim().slice(0, 200),
        category: category || 'Other',
        message: message.trim(),
        status: 'open',
        priority: category === 'Safety' ? 'urgent' : category === 'Payment' ? 'high' : 'normal',
    });

    logger.info('Support ticket created', {
        ticketId,
        userId: req.user._id,
        email: req.user.email,
        category,
        subject: ticket.subject,
    });

    res.status(201).json({
        success: true,
        ticketId,
        message: `Your request has been received! Ticket #${ticketId} created. We will respond to ${req.user.email} within 15 minutes.`,
    });
}));

// GET /support/my-tickets  — list logged-in user's own tickets
router.get('/my-tickets', authMiddleware.authUser, asyncHandler(async (req, res) => {
    const tickets = await SupportTicket.find({ user: req.user._id })
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    res.status(200).json({ tickets });
}));

// POST /support/my-tickets/:ticketId/reply  — user adds a reply to their own ticket
router.post('/my-tickets/:ticketId/reply', authMiddleware.authUser, asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message || message.trim().length < 2) return res.status(400).json({ message: 'Reply cannot be empty' });

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId, user: req.user._id });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'closed') return res.status(400).json({ message: 'This ticket is closed' });

    ticket.replies.push({
        message: message.trim(),
        sentBy: 'user',
        senderName: `${req.user.fullname?.firstname || ''} ${req.user.fullname?.lastname || ''}`.trim() || req.user.email,
    });
    await ticket.save();

    res.status(200).json({ success: true, replies: ticket.replies });
}));

// ─────────────────────────────────────────────────────────────────
// TRUSTED CONTACTS (Safety feature)
// ─────────────────────────────────────────────────────────────────

// GET /support/trusted-contacts
router.get('/trusted-contacts', authMiddleware.authUser, asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user._id).select('trustedContacts');
    res.status(200).json({ trustedContacts: user.trustedContacts || [] });
}));

// POST /support/trusted-contacts
router.post('/trusted-contacts', authMiddleware.authUser, asyncHandler(async (req, res) => {
    const { name, phone, relationship } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });

    const user = await userModel.findById(req.user._id).select('trustedContacts');
    if ((user.trustedContacts || []).length >= 5) {
        return res.status(400).json({ message: 'Maximum 5 trusted contacts allowed' });
    }

    const dup = (user.trustedContacts || []).some(c => c.phone === phone.trim());
    if (dup) return res.status(409).json({ message: 'This phone number is already saved' });

    user.trustedContacts = user.trustedContacts || [];
    user.trustedContacts.push({ name: name.trim(), phone: phone.trim(), relationship: relationship || 'Other' });
    await user.save();
    res.status(201).json({ trustedContacts: user.trustedContacts });
}));

// DELETE /support/trusted-contacts/:contactId
router.delete('/trusted-contacts/:contactId', authMiddleware.authUser, asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user._id).select('trustedContacts');
    user.trustedContacts = (user.trustedContacts || []).filter(c => c._id.toString() !== req.params.contactId);
    await user.save();
    res.status(200).json({ trustedContacts: user.trustedContacts });
}));

// ─────────────────────────────────────────────────────────────────
// ADMIN-FACING ROUTES (require admin token)
// ─────────────────────────────────────────────────────────────────

// GET /support/admin/tickets
router.get('/admin/tickets', authAdmin, asyncHandler(async (req, res) => {
    const { status, category, priority, page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const filter = {};
    if (status && status !== 'all')     filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;
    if (search) {
        filter.$or = [
            { ticketId: { $regex: search, $options: 'i' } },
            { subject:  { $regex: search, $options: 'i' } },
            { message:  { $regex: search, $options: 'i' } },
        ];
    }

    const [tickets, total] = await Promise.all([
        SupportTicket.find(filter)
            .populate('user', 'fullname email phone')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),
        SupportTicket.countDocuments(filter),
    ]);

    return paginated(res, { data: tickets, total, page: pageNum, limit: limitNum });
}));

// GET /support/admin/tickets/:ticketId
router.get('/admin/tickets/:ticketId', authAdmin, asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId })
        .populate('user', 'fullname email phone createdAt')
        .lean();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    return success(res, { data: ticket });
}));

// PATCH /support/admin/tickets/:ticketId/status
router.patch('/admin/tickets/:ticketId/status', authAdmin, asyncHandler(async (req, res) => {
    const { status, priority, adminNote } = req.body;
    const update = {};
    if (status)   update.status = status;
    if (priority) update.priority = priority;
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (status === 'resolved') { update.resolvedBy = req.admin._id; update.resolvedAt = new Date(); }

    const ticket = await SupportTicket.findOneAndUpdate(
        { ticketId: req.params.ticketId },
        { $set: update },
        { new: true }
    ).populate('user', 'fullname email');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    logger.info('Support ticket updated', { ticketId: ticket.ticketId, status, adminId: req.admin._id });
    return success(res, { message: 'Ticket updated', data: ticket });
}));

// POST /support/admin/tickets/:ticketId/reply
router.post('/admin/tickets/:ticketId/reply', authAdmin, asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message || message.trim().length < 2) return res.status(400).json({ message: 'Reply cannot be empty' });

    const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.replies.push({
        message: message.trim(),
        sentBy: 'admin',
        senderName: req.admin.name || 'Admin',
    });
    if (ticket.status === 'open') ticket.status = 'in_progress';
    await ticket.save();

    return success(res, { message: 'Reply sent', data: { replies: ticket.replies } });
}));

// GET /support/admin/stats
router.get('/admin/stats', authAdmin, asyncHandler(async (req, res) => {
    const [open, in_progress, resolved, urgent] = await Promise.all([
        SupportTicket.countDocuments({ status: 'open' }),
        SupportTicket.countDocuments({ status: 'in_progress' }),
        SupportTicket.countDocuments({ status: 'resolved' }),
        SupportTicket.countDocuments({ priority: 'urgent', status: { $in: ['open', 'in_progress'] } }),
    ]);
    return success(res, { data: { open, in_progress, resolved, urgent } });
}));

module.exports = router;
