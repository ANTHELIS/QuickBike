const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new AppError('Pickup and destination are required', 400);
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);

    const baseFare = { auto: 30, car: 50, moto: 20 };
    const perKmRate = { auto: 10, car: 15, moto: 8 };
    const perMinuteRate = { auto: 2, car: 3, moto: 1.5 };

    const distanceKm = distanceTime.distance.value / 1000;
    const durationMin = distanceTime.duration.value / 60;

    const fare = {
        auto: Math.round(baseFare.auto + distanceKm * perKmRate.auto + durationMin * perMinuteRate.auto),
        car: Math.round(baseFare.car + distanceKm * perKmRate.car + durationMin * perMinuteRate.car),
        moto: Math.round(baseFare.moto + distanceKm * perKmRate.moto + durationMin * perMinuteRate.moto),
    };

    return fare;
}

module.exports.getFare = getFare;

function generateOtp(digits) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits);
    return crypto.randomInt(min, max).toString();
}

module.exports.createRide = async ({ user, pickup, destination, vehicleType }) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new AppError('All fields are required', 400);
    }

    const fare = await getFare(pickup, destination);

    const ride = await rideModel.create({
        user,
        pickup,
        destination,
        otp: generateOtp(6),
        fare: fare[vehicleType],
    });

    return ride;
};

module.exports.confirmRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new AppError('Ride id is required', 400);
    }

    // Use findOneAndUpdate with returnDocument to avoid race conditions
    const ride = await rideModel
        .findOneAndUpdate(
            { _id: rideId, status: 'pending' }, // Only confirm if still pending
            { status: 'accepted', captain: captain._id },
            { new: true }
        )
        .populate('user')
        .populate('captain')
        .select('+otp');

    if (!ride) {
        throw new AppError('Ride not found or already accepted', 404);
    }

    return ride;
};

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new AppError('Ride id and OTP are required', 400);
    }

    const ride = await rideModel
        .findOne({ _id: rideId, captain: captain._id })
        .populate('user')
        .populate('captain')
        .select('+otp');

    if (!ride) {
        throw new AppError('Ride not found', 404);
    }

    if (ride.status !== 'accepted') {
        throw new AppError('Ride is not in accepted state', 400);
    }

    if (ride.otp !== otp) {
        throw new AppError('Invalid OTP', 400);
    }

    ride.status = 'ongoing';
    await ride.save();

    return ride;
};

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new AppError('Ride id is required', 400);
    }

    const ride = await rideModel
        .findOne({ _id: rideId, captain: captain._id })
        .populate('user')
        .populate('captain');

    if (!ride) {
        throw new AppError('Ride not found', 404);
    }

    if (ride.status !== 'ongoing') {
        throw new AppError('Ride is not ongoing', 400);
    }

    ride.status = 'completed';
    await ride.save();

    return ride;
};
