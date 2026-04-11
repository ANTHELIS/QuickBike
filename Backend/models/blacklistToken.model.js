const mongoose = require('mongoose');

/**
 * Blacklisted Token Model — Stores revoked JWT tokens.
 *
 * In production, this should be replaced by Redis for O(1) lookup.
 * Currently used as a MongoDB fallback. The TTL index auto-deletes
 * expired tokens so the collection stays small.
 *
 * Migration path: When Redis is available, the auth middleware should
 * check Redis first (getRedisClient().get(`blacklist:${token}`)),
 * and only fall back to this collection if Redis is unavailable.
 */

const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        index: true,
    },
    // Auto-delete after token would have expired anyway
    // This prevents the collection from growing unbounded
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400, // 24 hours (matches max token lifetime)
    },
});

module.exports = mongoose.model('blacklistToken', blacklistTokenSchema);