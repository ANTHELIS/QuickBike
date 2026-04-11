const mongoose = require('mongoose');

/**
 * Surge Zone Model — Dynamic pricing based on demand/supply ratio.
 *
 * A surge zone is a geographic polygon. Every 2 minutes, a background job:
 *   1. Counts pending rides inside the polygon (demand)
 *   2. Counts active captains inside the polygon (supply)
 *   3. Calculates demand/supply ratio → multiplier
 *   4. Updates currentMultiplier in this model
 *   5. Emits surge:updated to all users in the zone
 *
 * The fare calculation service reads currentMultiplier for the pickup location.
 */

const surgeZoneSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        // ── Geographic Boundary (GeoJSON Polygon) ──
        polygon: {
            type: {
                type: String,
                enum: ['Polygon'],
                required: true,
            },
            coordinates: {
                type: [[[Number]]], // array of array of [lng, lat] pairs
                required: true,
            },
        },

        // ── Surge Config ──
        currentMultiplier: {
            type: Number,
            default: 1.0,
            min: 1.0,
            max: 3.0,
        },
        baseThreshold: {
            type: Number,
            default: 1.5,  // demand/supply ratio below this = no surge
        },
        maxMultiplier: {
            type: Number,
            default: 2.0,
        },

        // ── Status ──
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// ── Indexes ──
surgeZoneSchema.index({ polygon: '2dsphere' });
surgeZoneSchema.index({ isActive: 1, city: 1 });

module.exports = mongoose.model('surgeZone', surgeZoneSchema);
