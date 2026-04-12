const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');
const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');
const { success, paginated } = require('../utils/response');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// ─────────────────────────────────────────────────
// POST /rides/create
// ─────────────────────────────────────────────────
module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { pickup, destination, vehicleType, promoCode } = req.body;

    const ride = await rideService.createRide({
        user: req.user._id,
        pickup,
        destination,
        vehicleType,
        promoCode,
    });

    // Send response immediately without OTP
    const rideResponse = ride.toObject();
    delete rideResponse.otp;
    res.status(201).json(rideResponse);

    // Fire-and-forget: notify nearby captains asynchronously
    setImmediate(async () => {
        try {
            const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
            const captainsInRadius = await mapService.getCaptainsInTheRadius(
                pickupCoordinates.ltd,
                pickupCoordinates.lng,
                5 // 5km initial radius
            );

            const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

            let notifiedCount = 0;
            for (const captain of captainsInRadius) {
                // Only notify KYC-approved captains
                if (captain.socketId && captain.kycStatus === 'approved') {
                    sendMessageToSocketId(captain.socketId, {
                        event: 'new-ride',
                        data: rideWithUser,
                    });
                    notifiedCount++;
                }
            }

            logger.info('Notified captains about new ride', {
                requestId: req.requestId,
                rideId: ride._id,
                captainsFound: captainsInRadius.length,
                captainsNotified: notifiedCount,
            });
        } catch (err) {
            logger.error('Failed to notify captains', {
                requestId: req.requestId,
                rideId: ride._id,
                error: err.message,
            });
        }
    });
};

// ─────────────────────────────────────────────────
// GET /rides/get-fare
// ─────────────────────────────────────────────────
module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { pickup, destination } = req.query;
    const fare = await rideService.getFare(pickup, destination);

    // Return in the same format the frontend expects
    res.status(200).json(fare);
};

// ─────────────────────────────────────────────────
// POST /rides/confirm — Captain confirms a ride
// ─────────────────────────────────────────────────
module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { rideId } = req.body;
    const ride = await rideService.confirmRide({ rideId, captain: req.captain });

    // Emit to user via socket — includes OTP for display
    if (ride?.user?.socketId) {
        logger.info('Emitting ride-confirmed to user', {
            requestId: req.requestId,
            socketId: ride.user.socketId,
            rideId: ride._id,
        });
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride.toObject(), // OTP is included (select +otp was in service)
        });
    } else {
        logger.warn('User has no socketId to receive ride-confirmed', {
            requestId: req.requestId,
            rideId: ride._id,
            userId: ride?.user?._id,
        });
    }

    // Return ride WITHOUT OTP to captain
    const rideResponse = ride.toObject();
    delete rideResponse.otp;
    res.status(200).json(rideResponse);
};

// ─────────────────────────────────────────────────
// GET /rides/start-ride — Captain starts ride with OTP
// ─────────────────────────────────────────────────
module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { rideId, otp } = req.query;
    logger.debug('startRide attempt', { requestId: req.requestId, rideId, otpReceived: otp });

    const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

    // Notify user that ride has started
    if (ride.user?.socketId) {
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride,
        });
    }

    res.status(200).json(ride);
};

// ─────────────────────────────────────────────────
// POST /rides/end-ride — Captain ends ride
// ─────────────────────────────────────────────────
module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { rideId } = req.body;
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    // Notify user that ride has ended
    if (ride.user?.socketId) {
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride,
        });
    }

    res.status(200).json(ride);
};

// ─────────────────────────────────────────────────
// POST /rides/:rideId/cancel
// ─────────────────────────────────────────────────
module.exports.cancelRide = async (req, res) => {
    const { rideId } = req.params;
    const { reason } = req.body;

    let cancelledBy, userId, captainId;

    if (req.captain) {
        cancelledBy = 'captain';
        captainId = req.captain._id;
    } else if (req.user) {
        cancelledBy = 'user';
        userId = req.user._id;
    } else {
        throw new AppError('Authentication required', 401);
    }

    const ride = await rideService.cancelRide({
        rideId,
        cancelledBy,
        userId,
        captainId,
        reason,
    });

    // Notify the OTHER party via socket
    if (cancelledBy === 'user' && ride.captain?.socketId) {
        sendMessageToSocketId(ride.captain.socketId, {
            event: 'ride-cancelled',
            data: {
                rideId: ride._id,
                cancelledBy: 'user',
                reason: reason || 'User cancelled the ride',
            },
        });
    } else if (cancelledBy === 'captain' && ride.user?.socketId) {
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-cancelled',
            data: {
                rideId: ride._id,
                cancelledBy: 'captain',
                reason: reason || 'Captain cancelled the ride',
            },
        });
    }

    res.status(200).json({
        message: 'Ride cancelled',
        ride,
        cancellationFee: ride.cancellationFee || 0,
    });
};

// ─────────────────────────────────────────────────
// GET /rides/history — Paginated ride history
// ─────────────────────────────────────────────────
module.exports.getRideHistory = async (req, res) => {
    const { userType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50); // cap at 50
    const status = req.query.status;

    let filter = {};

    if (userType === 'captain') {
        if (!req.captain) throw new AppError('Captain authentication required', 401);
        filter.captain = req.captain._id;
    } else {
        if (!req.user) throw new AppError('User authentication required', 401);
        filter.user = req.user._id;
    }

    if (status && status !== 'all') {
        filter.status = status;
    }

    const [rides, total] = await Promise.all([
        rideModel
            .find(filter)
            .populate('captain', 'fullname vehicle ratings')
            .populate('user', 'fullname email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        rideModel.countDocuments(filter),
    ]);

    return paginated(res, { data: rides, total, page, limit });
};

// ─────────────────────────────────────────────────
// GET /rides/stats
// ─────────────────────────────────────────────────
module.exports.getUserStats = async (req, res) => {
    const { userType } = req.query;

    let filter = {};

    if (userType === 'captain') {
        if (!req.captain) throw new AppError('Captain authentication required', 401);
        filter.captain = req.captain._id;
    } else {
        if (!req.user) throw new AppError('User authentication required', 401);
        filter.user = req.user._id;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFilter = { ...filter, createdAt: { $gte: todayStart } };

    const ratingField = userType === 'captain' ? '$captainRating' : '$userRating';

    const [totalRides, completedRides, totalSpentAgg, cancelledRides, todayRides, todayEarningsAgg, ratingAgg] =
        await Promise.all([
            rideModel.countDocuments(filter),
            rideModel.countDocuments({ ...filter, status: 'completed' }),
            rideModel.aggregate([
                { $match: { ...filter, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$fare' } } },
            ]),
            rideModel.countDocuments({ ...filter, status: 'cancelled' }),
            rideModel.countDocuments({ ...todayFilter, status: 'completed' }),
            rideModel.aggregate([
                { $match: { ...todayFilter, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$fare' } } },
            ]),
            rideModel.aggregate([
                { $match: { ...filter, status: 'completed', [ratingField.slice(1)]: { $exists: true } } },
                { $group: { _id: null, avg: { $avg: ratingField } } },
            ]),
        ]);

    return success(res, {
        data: {
            totalRides,
            completedRides,
            cancelledRides,
            totalSpent: totalSpentAgg[0]?.total || 0,
            todayRides,
            todayEarnings: todayEarningsAgg[0]?.total || 0,
            rating: ratingAgg[0]?.avg ? parseFloat(ratingAgg[0].avg.toFixed(1)) : null,
        },
    });
};

// ─────────────────────────────────────────────────
// POST /rides/:rideId/rate
// ─────────────────────────────────────────────────
module.exports.rateRide = async (req, res) => {
    const { rideId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
    }

    const ride = await rideModel.findById(rideId);
    if (!ride) throw new AppError('Ride not found', 404);
    if (ride.status !== 'completed') throw new AppError('Ride is not completed', 400);

    const isUser = req.user && ride.user.toString() === req.user._id.toString();
    const isCaptain = req.captain && ride.captain?.toString() === req.captain._id.toString();

    if (!isUser && !isCaptain) {
        throw new AppError('Not authorized to rate this ride', 403);
    }

    if (isUser) {
        if (ride.captainRating !== undefined && ride.captainRating !== null) {
            throw new AppError('Already rated', 400);
        }
        ride.captainRating = rating;
        if (feedback) ride.captainFeedback = feedback;

        // Update captain's aggregate rating
        try {
            const captain = await captainModel.findById(ride.captain);
            if (captain) await captain.addRating(rating);
        } catch (err) {
            logger.error('Failed to update captain rating', {
                captainId: ride.captain,
                error: err.message,
            });
        }
    } else {
        if (ride.userRating !== undefined && ride.userRating !== null) {
            throw new AppError('Already rated', 400);
        }
        ride.userRating = rating;
        if (feedback) ride.userFeedback = feedback;
    }

    await ride.save();
    return success(res, { message: 'Rating submitted', data: ride });
};

// ─────────────────────────────────────────────────
// GET /rides/promo/:code?fare=X
// ─────────────────────────────────────────────────
module.exports.validatePromo = async (req, res) => {
    const { code } = req.params;
    const fare = parseFloat(req.query.fare);
    const vehicleType = req.query.vehicleType || 'moto';

    if (!fare || isNaN(fare)) throw new AppError('Invalid fare amount', 400);

    const result = await rideService.validatePromoCode(
        code,
        fare,
        req.user._id,
        vehicleType
    );

    return success(res, { data: result });
};