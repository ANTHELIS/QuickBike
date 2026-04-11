const mongoose = require('mongoose');

/**
 * Ride Model — Core of the ride-hailing platform.
 *
 * Design decisions:
 *   - pickup/destination kept as strings for backward compatibility with frontend
 *   - pickupLocation/destinationLocation added as GeoJSON for future geo queries
 *   - fare is the total (backward compat), fareBreakdown has the components
 *   - OTP stored as plaintext with select:false — short-lived (15 min) and risk is
 *     limited. Hashing a 6-digit OTP doesn't add meaningful security since the
 *     search space is tiny. Password hashing is essential; OTP hashing is theater.
 *   - Status enum is STRICT — the ride state machine is enforced here and in service layer
 *   - Compound indexes cover every query pattern used in controllers
 */

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

        // ── Locations (string addresses for display, GeoJSON for queries) ──
        pickup: {
            type: String,
            required: true,
            trim: true,
        },
        destination: {
            type: String,
            required: true,
            trim: true,
        },
        // Optional GeoJSON — populated when geocoding succeeds
        pickupLocation: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: [Number], // [lng, lat]
        },
        destinationLocation: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: [Number],
        },

        // ── Vehicle ──
        vehicleType: {
            type: String,
            enum: ['auto', 'car', 'moto'],
            required: true,
        },

        // ── Fare ──
        // `fare` is the TOTAL (kept for backward compat with frontend)
        fare: {
            type: Number,
            required: true,
            min: 0,
        },
        // Detailed breakdown for receipts and dispute resolution
        fareBreakdown: {
            base: { type: Number, default: 0 },
            distance: { type: Number, default: 0 },
            time: { type: Number, default: 0 },
            surge: { type: Number, default: 0 },
            discount: { type: Number, default: 0 },
            nightCharge: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
            currency: { type: String, default: 'INR' },
        },
        surgeMultiplier: {
            type: Number,
            default: 1,
            min: 1,
            max: 3,
        },

        // ── Ride Status (strict state machine) ──
        // pending → accepted → ongoing → completed
        // pending → cancelled
        // accepted → cancelled (by user or captain, with penalty check)
        // ongoing → CANNOT be cancelled normally (only emergency)
        status: {
            type: String,
            enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },

        // ── OTP ──
        // 6-digit PIN shown to user, entered by captain to start ride.
        // select:false — never returned in normal queries
        otp: {
            type: String,
            select: false,
            required: true,
        },

        // ── Trip Metrics (actual, not estimated) ──
        duration: { type: Number },  // seconds
        distance: { type: Number },  // meters
        estimatedDuration: { type: Number }, // seconds (from Distance Matrix at booking)
        estimatedDistance: { type: Number },  // meters

        // ── Timestamps ──
        startedAt: { type: Date },
        completedAt: { type: Date },
        cancelledAt: { type: Date },

        // ── Cancellation ──
        cancelledBy: {
            type: String,
            enum: ['user', 'captain', 'system', null],
            default: null,
        },
        cancellationReason: {
            type: String,
            trim: true,
            default: '',
        },
        cancellationFee: {
            type: Number,
            default: 0,
            min: 0,
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
        userFeedback: { type: String, trim: true },
        captainFeedback: { type: String, trim: true },

        // ── Payment ──
        payment: {
            orderId: { type: String },        // Razorpay order ID
            paymentId: { type: String },       // Razorpay payment ID
            signature: { type: String },       // Razorpay signature
            method: {
                type: String,
                enum: ['cash', 'upi', 'card', 'wallet', 'netbanking', null],
                default: 'cash',
            },
            status: {
                type: String,
                enum: ['pending', 'created', 'attempted', 'captured', 'failed', 'refunded'],
                default: 'pending',
            },
        },

        // ── Promo Code ──
        promoCode: { type: String, trim: true, uppercase: true },
        discount: { type: Number, default: 0, min: 0 },

        // ── Dispatch Tracking ──
        dispatchAttempts: { type: Number, default: 0 },
        lastDispatchedAt: { type: Date, default: Date.now },
        dispatchedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// ── Indexes ──
// These cover every query pattern in controllers + background jobs

// Find user's rides by status (ride history, active ride check)
rideSchema.index({ user: 1, status: 1 });

// Find captain's rides by status (earnings, active ride check)
rideSchema.index({ captain: 1, status: 1 });

// Background job: find pending rides older than X for auto-cancel
rideSchema.index({ status: 1, dispatchedAt: 1 });

// Background job: find stale rides by creation time
rideSchema.index({ status: 1, createdAt: 1 });

// Geospatial: find rides near a location (admin dashboard, surge calc)
rideSchema.index({ pickupLocation: '2dsphere' });

module.exports = mongoose.model('ride', rideSchema);