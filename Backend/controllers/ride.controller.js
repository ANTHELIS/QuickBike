const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');
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
    // Any error here is non-critical — the ride was already created
    setImmediate(async () => {
        try {
            const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
            const captainsInRadius = await mapService.getCaptainsInTheRadius(
                pickupCoordinates.ltd,
                pickupCoordinates.lng,
                2
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
            // Log but don't crash — the ride already exists
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

    if (ride.user?.socketId) {
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride,
        });
    }

    res.status(200).json(ride);
};

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;
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

    if (ride.user?.socketId) {
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride,
        });
    }

    res.status(200).json(ride);
};

// ── Ride History (for Activity page) ──
module.exports.getRideHistory = async (req, res) => {
    const { userType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // optional filter: 'completed', 'cancelled', etc.

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

// ── User/Captain Stats (for Account page) ──
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

    const [totalRides, completedRides, totalSpent, cancelledRides] = await Promise.all([
        rideModel.countDocuments(filter),
        rideModel.countDocuments({ ...filter, status: 'completed' }),
        rideModel.aggregate([
            { $match: { ...filter, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$fare' } } },
        ]),
        rideModel.countDocuments({ ...filter, status: 'cancelled' }),
    ]);

    res.status(200).json({
        totalRides,
        completedRides,
        cancelledRides,
        totalSpent: totalSpent[0]?.total || 0,
        rating: 4.8, // TODO: implement proper rating system
    });
};