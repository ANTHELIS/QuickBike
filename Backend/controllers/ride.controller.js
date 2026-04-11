const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');
const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination, vehicleType } = req.body;

    const ride = await rideService.createRide({
        user: req.user._id,
        pickup,
        destination,
        vehicleType,
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
                5 // Increased radius to 5km for better captain discovery
            );

            const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

            for (const captain of captainsInRadius) {
                if (captain.socketId) {
                    sendMessageToSocketId(captain.socketId, {
                        event: 'new-ride',
                        data: rideWithUser,
                    });
                }
            }

            logger.debug('Notified captains about new ride', {
                rideId: ride._id,
                captainsNotified: captainsInRadius.length,
            });
        } catch (err) {
            logger.error('Failed to notify captains', {
                rideId: ride._id,
                error: err.message,
            });
        }
    });
};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;
    const fare = await rideService.getFare(pickup, destination);
    res.status(200).json(fare);
};

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;
    const ride = await rideService.confirmRide({ rideId, captain: req.captain });

    // Fetch ride WITH OTP so we can send it to the user via socket
    const rideWithOtp = await rideModel
        .findById(ride._id)
        .select('+otp')
        .populate('user')
        .populate('captain');

    if (rideWithOtp?.user?.socketId) {
        logger.info('Emitting ride-confirmed to user', { socketId: rideWithOtp.user.socketId, rideId: ride._id })
        // Include OTP in the socket event so the user can see it to share with captain
        sendMessageToSocketId(rideWithOtp.user.socketId, {
            event: 'ride-confirmed',
            data: {
                ...rideWithOtp.toObject(),
                // OTP is explicitly included here for the user's OTP display
            },
        });
    } else {
        logger.warn('User has no socketId to receive ride-confirmed', { rideId: ride._id, user: rideWithOtp?.user?._id })
    }

    // Return ride WITHOUT OTP to captain (captain must get OTP from user)
    const rideResponse = ride.toObject();
    delete rideResponse.otp;
    res.status(200).json(rideResponse);
};

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;
    logger.debug('startRide attempt', { rideId, otpReceived: otp });

    const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

    if (ride.user?.socketId) {
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride,
        });
    }

    res.status(200).json(ride);
};

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    // Notify user that ride has ended so they can navigate to home
    if (ride.user?.socketId) {
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride,
        });
    }

    res.status(200).json(ride);
};

// POST /rides/:rideId/cancel — user or captain cancels an ongoing/accepted/pending ride
module.exports.cancelRide = async (req, res) => {
    const { rideId } = req.params;

    let ride;
    let cancelledBy = '';

    if (req.captain) {
        ride = await rideModel.findOne({ _id: rideId, captain: req.captain._id });
        cancelledBy = 'captain';
    } else if (req.user) {
        ride = await rideModel.findOne({ _id: rideId, user: req.user._id });
        cancelledBy = 'user';
    } else {
        throw new AppError('Authentication required', 401);
    }

    if (!ride) {
        throw new AppError('Ride not found', 404);
    }

    if (!['pending', 'accepted', 'ongoing'].includes(ride.status)) {
        throw new AppError('Ride cannot be cancelled at this stage', 400);
    }

    ride.status = 'cancelled';
    await ride.save();

    // Notify the other party
    if (cancelledBy === 'user' && ride.captain) {
        const captainDoc = await captainModel.findById(ride.captain);
        if (captainDoc?.socketId) {
            sendMessageToSocketId(captainDoc.socketId, {
                event: 'ride-cancelled',
                data: { rideId: ride._id, cancelledBy: 'user' },
            });
        }
    } else if (cancelledBy === 'captain' && ride.user) {
        const userDoc = await userModel.findById(ride.user);
        if (userDoc?.socketId) {
            sendMessageToSocketId(userDoc.socketId, {
                event: 'ride-cancelled',
                data: { rideId: ride._id, cancelledBy: 'captain' },
            });
        }
    }

    res.status(200).json({ message: 'Ride cancelled', ride });
};

// ── Ride History (for Activity page) ──
module.exports.getRideHistory = async (req, res) => {
    const { userType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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
            .populate('captain', 'fullname vehicle')
            .populate('user', 'fullname email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        rideModel.countDocuments(filter),
    ]);

    res.status(200).json({
        rides,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
};

// ── User/Captain Stats ──
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
            // Average rating from completed, rated rides
            rideModel.aggregate([
                { $match: { ...filter, status: 'completed', [ratingField.slice(1)]: { $exists: true } } },
                { $group: { _id: null, avg: { $avg: ratingField } } },
            ]),
        ]);

    res.status(200).json({
        totalRides,
        completedRides,
        cancelledRides,
        totalSpent: totalSpentAgg[0]?.total || 0,
        todayRides,
        todayEarnings: todayEarningsAgg[0]?.total || 0,
        rating: ratingAgg[0]?.avg ? parseFloat(ratingAgg[0].avg.toFixed(1)) : null,
    });
};

// ── POST /rides/:rideId/rate ──
// Either the rider (userRating) or the captain (captainRating) can call this once.
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
        if (ride.captainRating) throw new AppError('User has already rated this ride', 400);
        ride.captainRating = rating; // user rates the captain
        if (feedback) ride.captainFeedback = feedback;
    } else {
        if (ride.userRating) throw new AppError('Captain has already rated this ride', 400);
        ride.userRating = rating; // captain rates the user
        if (feedback) ride.userFeedback = feedback;
    }

    await ride.save();
    res.status(200).json({ message: 'Rating submitted', ride });
};

// ── GET /rides/promo/:code?fare=X ──
module.exports.validatePromo = async (req, res) => {
    const { code } = req.params;
    const fare = parseFloat(req.query.fare);
    if (!fare || isNaN(fare)) throw new AppError('Invalid fare amount', 400);

    const result = rideService.validatePromoCode(code, fare);
    res.status(200).json(result);
};