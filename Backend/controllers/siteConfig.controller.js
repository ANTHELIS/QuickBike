const SiteConfig   = require('../models/siteConfig.model');
const Notification = require('../models/notification.model');
const User         = require('../models/user.model');
const Captain      = require('../models/captain.model');
const { broadcast } = require('../socket');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/site-config  (admin only)
// GET /api/site-config        (public — frontend reads this to render images/colors)
// ─────────────────────────────────────────────────────────────────────────────
exports.getSiteConfig = async (req, res) => {
    let config = await SiteConfig.findOne({ slug: 'default' });
    if (!config) {
        // Auto-create on first access
        config = await SiteConfig.create({ slug: 'default' });
    }
    res.json({ success: true, data: config });
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/site-config/banners
// Body: { banners: [{ key, imageUrl, altText, enabled }] }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateBanners = async (req, res) => {
    const { banners } = req.body;
    if (!Array.isArray(banners) || banners.length === 0) {
        return res.status(400).json({ success: false, message: 'banners array required' });
    }

    let config = await SiteConfig.findOne({ slug: 'default' });
    if (!config) config = await SiteConfig.create({ slug: 'default' });

    // Merge incoming changes — update matching keys, leave others intact
    for (const incoming of banners) {
        const existing = config.banners.find(b => b.key === incoming.key);
        if (existing) {
            if (incoming.imageUrl  !== undefined) existing.imageUrl  = incoming.imageUrl;
            if (incoming.altText   !== undefined) existing.altText   = incoming.altText;
            if (incoming.enabled   !== undefined) existing.enabled   = incoming.enabled;
        }
    }

    config.lastUpdatedBy = req.admin?._id;
    await config.save();

    res.json({ success: true, message: 'Banners updated', data: config });
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/site-config/colors
// Body: { colors: [{ key, value }] }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateColors = async (req, res) => {
    const { colors } = req.body;
    if (!Array.isArray(colors) || colors.length === 0) {
        return res.status(400).json({ success: false, message: 'colors array required' });
    }

    let config = await SiteConfig.findOne({ slug: 'default' });
    if (!config) config = await SiteConfig.create({ slug: 'default' });

    for (const incoming of colors) {
        const existing = config.colors.find(c => c.key === incoming.key);
        if (existing && incoming.value) {
            existing.value = incoming.value;
        }
    }

    config.lastUpdatedBy = req.admin?._id;
    await config.save();

    res.json({ success: true, message: 'Colors updated', data: config });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/notifications/broadcast
// Body: { title, body, type, audience }
//   audience: 'all' | 'users' | 'captains'
// ─────────────────────────────────────────────────────────────────────────────
exports.broadcastNotification = async (req, res) => {
    const { title, body, type = 'system', audience = 'all' } = req.body;

    if (!title || !body) {
        return res.status(400).json({ success: false, message: 'title and body are required' });
    }

    const validTypes = ['ride_update', 'payment', 'kyc', 'promo', 'system', 'safety'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: `type must be one of: ${validTypes.join(', ')}` });
    }

    // Collect recipient IDs
    let userIds = [];
    let captainIds = [];

    if (audience === 'all' || audience === 'users') {
        const users = await User.find({ isActive: { $ne: false } }).select('_id');
        userIds = users.map(u => u._id);
    }
    if (audience === 'all' || audience === 'captains') {
        const captains = await Captain.find({ isActive: { $ne: false } }).select('_id');
        captainIds = captains.map(c => c._id);
    }

    // Bulk insert notifications
    const userNotifs = userIds.map(id => ({
        recipient: id,
        recipientModel: 'user',
        type,
        title,
        body,
        channel: 'in_app',
        status: 'sent',
        sentAt: new Date(),
    }));

    const captainNotifs = captainIds.map(id => ({
        recipient: id,
        recipientModel: 'captain',
        type,
        title,
        body,
        channel: 'in_app',
        status: 'sent',
        sentAt: new Date(),
    }));

    const all = [...userNotifs, ...captainNotifs];
    if (all.length === 0) {
        return res.status(400).json({ success: false, message: 'No recipients found for this audience' });
    }

    await Notification.insertMany(all, { ordered: false });

    // Emit real-time socket event to all clients.
    // The client-side GlobalNotification component will filter based on audience.
    broadcast('new-notification', { title, body, type, audience });

    res.json({
        success: true,
        message: `Notification broadcast to ${all.length} recipients`,
        counts: { users: userNotifs.length, captains: captainNotifs.length },
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/notifications/history
// Returns last 50 system broadcast notifications (distinct title/body combos)
// ─────────────────────────────────────────────────────────────────────────────
exports.getNotificationHistory = async (req, res) => {
    const history = await Notification.aggregate([
        { $match: { type: 'system', recipientModel: 'user' } },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: { title: '$title', body: '$body' },
                sentAt: { $first: '$sentAt' },
                count: { $sum: 1 },
                type: { $first: '$type' },
            },
        },
        { $sort: { sentAt: -1 } },
        { $limit: 50 },
        {
            $project: {
                _id: 0,
                title: '$_id.title',
                body: '$_id.body',
                type: 1,
                sentAt: 1,
                recipientCount: '$count',
            },
        },
    ]);

    res.json({ success: true, data: history });
};
