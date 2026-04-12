const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');
const promoModel = require('../models/promo.model');
const mapService = require('./maps.service');
const { calculateFare, calculateAllFares, calculateCancellationFee } = require('../utils/fareCalculator');
const { getRedisClient } = require('../utils/redis');
const { scheduleAutoCancel, scheduleReDispatch } = require('../jobs/rideLifecycle');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────
// Surge Multiplier — demand/supply ratio
// ─────────────────────────────────────────────────
async function computeSurgeMultiplier(pickup) {
    try {
        const redis = getRedisClient();

        // Try Redis cache first (updated every 2 min by surge job)
        const cachedSurge = await redis.get(`surge:global`);
        if (cachedSurge) return parseFloat(cachedSurge);

        // Compute from DB as fallback
        const [activeCaptains, pendingRides] = await Promise.all([
            captainModel.countDocuments({ status: 'active', kycStatus: 'approved' }),
            rideModel.countDocuments({ status: 'pending' }),
        ]);

        if (activeCaptains === 0) return 1.5;

        const ratio = pendingRides / activeCaptains;
        let multiplier = 1;
        if (ratio >= 3) multiplier = 2.0;
        else if (ratio >= 2) multiplier = 1.5;
        else if (ratio >= 1.5) multiplier = 1.2;

        // Cache for 2 minutes
        await redis.setex('surge:global', 120, String(multiplier));
        return multiplier;
    } catch (err) {
        logger.warn('Surge computation failed, defaulting to 1x', { error: err.message });
        return 1;
    }
}

// ─────────────────────────────────────────────────
// Get Fare — returns fares for all vehicle types
// ─────────────────────────────────────────────────
async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new AppError('Pickup and destination are required', 400);
    }

    const [distanceTime, surgeMultiplier] = await Promise.all([
        mapService.getDistanceTime(pickup, destination),
        computeSurgeMultiplier(pickup),
    ]);

    return calculateAllFares({
        distanceMeters: distanceTime.distance.value,
        durationSeconds: distanceTime.duration.value,
        surgeMultiplier,
        distanceText: distanceTime.distance.text,
        durationText: distanceTime.duration.text,
    });
}

module.exports.getFare = getFare;

// ─────────────────────────────────────────────────
// OTP Generation — cryptographically random 6-digit
// ─────────────────────────────────────────────────
function generateOtp(digits) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits);
    return crypto.randomInt(min, max).toString();
}

// ─────────────────────────────────────────────────
// Create Ride — with fare breakdown and job scheduling
// ─────────────────────────────────────────────────
module.exports.createRide = async ({ user, pickup, destination, vehicleType, promoCode }) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new AppError('All fields are required', 400);
    }

    const fareData = await getFare(pickup, destination);
    let finalFare = fareData[vehicleType];
    let appliedPromo = null;
    let appliedDiscount = 0;

    // Apply promo code if provided
    if (promoCode) {
        try {
            const promoResult = await module.exports.validatePromoCode(promoCode, finalFare, user, vehicleType);
            finalFare = promoResult.finalFare;
            appliedDiscount = promoResult.discount;
            appliedPromo = promoResult.code;
        } catch (err) {
            // Log but don't fail the ride creation if promo is invalid
            logger.warn('Failed to apply promo code during ride creation', { promoCode, user, error: err.message });
        }
    }

    // Calculate fare breakdown for the selected vehicle type
    const distanceTime = await mapService.getDistanceTime(pickup, destination);
    const fareBreakdown = calculateFare({
        vehicleType,
        distanceMeters: distanceTime.distance.value,
        durationSeconds: distanceTime.duration.value,
        surgeMultiplier: fareData.surgeMultiplier,
    });

    const ride = await rideModel.create({
        user,
        pickup,
        destination,
        vehicleType,
        otp: generateOtp(6),
        fare: finalFare,
        promoCode: appliedPromo,
        discount: appliedDiscount,
        fareBreakdown,
        surgeMultiplier: fareData.surgeMultiplier,
        estimatedDistance: distanceTime.distance.value,
        estimatedDuration: distanceTime.duration.value,
        dispatchedAt: new Date(),
    });

    // Schedule background jobs
    try {
        await scheduleAutoCancel(ride._id.toString());
        await scheduleReDispatch(ride._id.toString());
    } catch (err) {
        // Non-blocking — ride creation succeeds even if job scheduling fails
        logger.warn('Failed to schedule ride jobs', { rideId: ride._id, error: err.message });
    }

    return ride;
};

// ─────────────────────────────────────────────────
// Confirm Ride — ATOMIC (race condition proof)
// ─────────────────────────────────────────────────
module.exports.confirmRide = async ({ rideId, captain }) => {
    if (!rideId) throw new AppError('Ride id is required', 400);

    // ── THE FIX: Atomic findOneAndUpdate ──
    // Only ONE captain can change status from 'pending' to 'accepted'.
    // If another captain tries simultaneously, the query condition
    // { status: 'pending' } won't match → returns null → 409 Conflict.
    const ride = await rideModel
        .findOneAndUpdate(
            { _id: rideId, status: 'pending' },
            {
                $set: {
                    status: 'accepted',
                    captain: captain._id,
                },
            },
            { new: true }
        )
        .select('+otp')
        .populate('user')
        .populate('captain');

    if (!ride) {
        throw new AppError('Ride is no longer available', 409);
    }

    return ride;
};

// ─────────────────────────────────────────────────
// Start Ride — OTP verification + atomic status update
// ─────────────────────────────────────────────────
module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) throw new AppError('Ride id and OTP are required', 400);

    // Fetch with OTP for verification
    const ride = await rideModel
        .findOne({ _id: rideId, captain: captain._id }, '+otp')
        .populate('user')
        .populate('captain');

    if (!ride) throw new AppError('Ride not found', 404);
    if (ride.status !== 'accepted') throw new AppError('Ride is not in accepted state', 400);

    // Compare OTP (trimmed string comparison)
    if (ride.otp?.toString().trim() !== otp?.toString().trim()) {
        throw new AppError('Invalid OTP', 400);
    }

    // Atomic update to prevent double-start
    const updated = await rideModel.findOneAndUpdate(
        { _id: rideId, status: 'accepted' },
        { $set: { status: 'ongoing', startedAt: new Date() } },
        { new: true }
    ).populate('user').populate('captain');

    if (!updated) throw new AppError('Ride could not be started', 409);

    return updated;
};

// ─────────────────────────────────────────────────
// End Ride — Complete with timestamps
// ─────────────────────────────────────────────────
module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) throw new AppError('Ride id is required', 400);

    const ride = await rideModel
        .findOne({ _id: rideId, captain: captain._id })
        .populate('user')
        .populate('captain');

    if (!ride) throw new AppError('Ride not found', 404);
    if (ride.status !== 'ongoing') throw new AppError('Ride is not ongoing', 400);

    // Atomic update
    const updated = await rideModel.findOneAndUpdate(
        { _id: rideId, status: 'ongoing' },
        {
            $set: {
                status: 'completed',
                completedAt: new Date(),
                'payment.status': ride.payment?.method === 'cash' ? 'captured' : ride.payment?.status,
            },
        },
        { new: true }
    ).populate('user').populate('captain');

    if (!updated) throw new AppError('Ride could not be completed', 409);

    // Update captain earnings
    try {
        await captainModel.findByIdAndUpdate(captain._id, {
            $inc: {
                'earnings.total': updated.fare,
                'earnings.pending': updated.fare,
                'earnings.thisWeek': updated.fare,
                'earnings.thisMonth': updated.fare,
                'performance.totalRides': 1,
                'performance.todayRides': 1,
            },
        });
    } catch (err) {
        logger.error('Failed to update captain earnings', {
            captainId: captain._id,
            rideId,
            error: err.message,
        });
    }

    return updated;
};

// ─────────────────────────────────────────────────
// Cancel Ride — with penalty calculation
// ─────────────────────────────────────────────────
module.exports.cancelRide = async ({ rideId, cancelledBy, userId, captainId, reason }) => {
    if (!rideId) throw new AppError('Ride id is required', 400);

    // Build query based on who is cancelling
    const query = { _id: rideId };
    if (cancelledBy === 'user') query.user = userId;
    else if (cancelledBy === 'captain') query.captain = captainId;

    const ride = await rideModel.findOne(query).populate('user').populate('captain');

    if (!ride) throw new AppError('Ride not found', 404);

    if (!['pending', 'accepted'].includes(ride.status)) {
        throw new AppError('Ride cannot be cancelled at this stage', 400);
    }

    // Calculate cancellation fee
    const fee = calculateCancellationFee(cancelledBy, ride.status, ride.updatedAt);

    // Atomic update
    const updated = await rideModel.findOneAndUpdate(
        { _id: rideId, status: { $in: ['pending', 'accepted'] } },
        {
            $set: {
                status: 'cancelled',
                cancelledBy,
                cancellationReason: reason || '',
                cancellationFee: fee,
                cancelledAt: new Date(),
            },
        },
        { new: true }
    ).populate('user').populate('captain');

    if (!updated) throw new AppError('Ride could not be cancelled', 409);

    // Track captain cancellations (for suspension logic)
    if (cancelledBy === 'captain' && captainId) {
        try {
            await captainModel.findByIdAndUpdate(captainId, {
                $inc: { 'performance.cancellationCount': 1 },
            });
        } catch (err) {
            logger.error('Failed to update captain cancellation count', { captainId, error: err.message });
        }
    }

    return updated;
};

// ─────────────────────────────────────────────────
// Validate Promo Code — database-backed
// ─────────────────────────────────────────────────
module.exports.validatePromoCode = async (code, fare, userId, vehicleType) => {
    if (!code) throw new AppError('Promo code is required', 400);

    const promo = await promoModel.findOne({
        code: code.toUpperCase(),
        isActive: true,
    });

    if (!promo) throw new AppError('Invalid promo code', 400);

    const result = promo.validateForUser(userId, fare, vehicleType);

    if (!result.valid) {
        throw new AppError(result.reason, 400);
    }

    return {
        code: promo.code,
        discount: result.discount,
        finalFare: result.finalFare,
        type: promo.type,
    };
};
