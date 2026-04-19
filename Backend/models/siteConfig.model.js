const mongoose = require('mongoose');

/**
 * SiteConfig — Singleton document that stores dynamic website configuration.
 *
 * Design decisions:
 * - Single document (slug = 'default') — avoids complex multi-record management.
 * - Admin updates it via PATCH; frontend reads it via a public GET.
 * - Images stored as URLs (Cloudinary/Unsplash/any CDN). No binary blobs in DB.
 * - Colors stored as hex strings so CSS-in-JS can directly consume them.
 * - Broadcast notifications stored in a separate `Notification` collection 
 *   (already exists); this model just has the send-notification trigger.
 */

const bannerSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },   // e.g. 'hero', 'login', 'signup'
        label: { type: String, required: true },  // Human-readable label for admin UI
        imageUrl: { type: String, default: '' },
        altText: { type: String, default: '' },
        enabled: { type: Boolean, default: true },
    },
    { _id: false }
);

const colorTokenSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },    // e.g. 'primary', 'secondary', 'background'
        label: { type: String, required: true },
        value: { type: String, default: '#F5820D' }, // hex
    },
    { _id: false }
);

const siteConfigSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            default: 'default',
            unique: true,
        },

        // ── Banners / Hero Images ──
        banners: {
            type: [bannerSchema],
            default: [
                { key: 'hero',   label: 'Landing Page Hero',  imageUrl: '', altText: 'Hero image', enabled: true },
                { key: 'login',  label: 'Login Page Image',   imageUrl: '', altText: 'Login image', enabled: true },
                { key: 'signup', label: 'Sign Up Page Image', imageUrl: '', altText: 'Sign up image', enabled: true },
            ],
        },

        // ── Brand Colors ──
        colors: {
            type: [colorTokenSchema],
            default: [
                { key: 'primary',    label: 'Primary / CTA',       value: '#F5820D' },
                { key: 'secondary',  label: 'Secondary Accent',     value: '#FF9B31' },
                { key: 'background', label: 'Page Background',      value: '#FAFAFA' },
                { key: 'surface',    label: 'Card / Surface',       value: '#FFFFFF' },
                { key: 'text',       label: 'Primary Text',         value: '#1A1A1A' },
                { key: 'muted',      label: 'Muted / Secondary Text', value: '#6B7280' },
            ],
        },

        // ── Meta ──
        lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
