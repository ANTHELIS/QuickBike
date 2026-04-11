const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');
const mapService = require('./maps.service');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

// ── Surge multiplier based on demand/supply ratio ──
async function computeSurgeMultiplier(pickup) {
    try {
        const coords = await mapService.getAddressCoordinate(pickup);
        const [activeCaptains, pendingRides] = await Promise.all([
            captainModel.countDocuments({ status: 'active' }),
            rideModel.countDocuments({ status: 'pending' }),
        ]);
        if (activeCaptains === 0) return 1.5; // no supply → always surge
        const ratio = pendingRides / activeCaptains;
        if (ratio >= 3) return 1.5;
        if (ratio >= 2) return 1.3;
        if (ratio >= 1.5) return 1.2;
        return 1;
    } catch {
        return 1; // fail silent
    }
}

async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new AppError('Pickup and destination are required', 400);
    }

    const [distanceTime, surgeMultiplier] = await Promise.all([
        mapService.getDistanceTime(pickup, destination),
        computeSurgeMultiplier(pickup),
    ]);

    const baseFare = { auto: 30, car: 50, moto: 20 };
    const perKmRate = { auto: 10, car: 15, moto: 8 };
    const perMinuteRate = { auto: 2, car: 3, moto: 1.5 };

    const distanceKm = distanceTime.distance.value / 1000;
    const durationMin = distanceTime.duration.value / 60;

    const rawFare = (type) =>
        Math.round((baseFare[type] + distanceKm * perKmRate[type] + durationMin * perMinuteRate[type]) * surgeMultiplier);

    const fare = {
        auto: rawFare('auto'),
        car: rawFare('car'),
        moto: rawFare('moto'),
        surgeMultiplier,
        isSurge: surgeMultiplier > 1,
        distanceText: distanceTime.distance.text,
        durationText: distanceTime.duration.text,
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
        vehicleType,
        otp: generateOtp(6),
        fare: fare[vehicleType],
        surgeMultiplier: fare.surgeMultiplier,
        dispatchedAt: new Date(),
    });

    return ride;
};

module.exports.confirmRide = async ({ rideId, captain }) => {
    if (!rideId) throw new AppError('Ride id is required', 400);

    const ride = await rideModel
        .findOneAndUpdate(
            { _id: rideId, status: 'pending' },
            { status: 'accepted', captain: captain._id },
            { new: true }
        )
        .select('+otp')
        .populate('user')
        .populate('captain');

    if (!ride) throw new AppError('Ride not found or already accepted', 404);
    return ride;
};

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) throw new AppError('Ride id and OTP are required', 400);

    // Use projection as the 2nd arg — most reliable for select:false fields like otp
    const ride = await rideModel
        .findOne({ _id: rideId, captain: captain._id }, '+otp')
        .populate('user')
        .populate('captain');

    if (!ride) throw new AppError('Ride not found', 404);
    if (ride.status !== 'accepted') throw new AppError('Ride is not in accepted state', 400);

    // Compare as trimmed strings to avoid whitespace issues
    if (ride.otp?.toString().trim() !== otp?.toString().trim()) {
        throw new AppError('Invalid OTP', 400);
    }

    ride.status = 'ongoing';
    await ride.save();
    return ride;
};

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) throw new AppError('Ride id is required', 400);

    const ride = await rideModel
        .findOne({ _id: rideId, captain: captain._id })
        .populate('user')
        .populate('captain');

    if (!ride) throw new AppError('Ride not found', 404);
    if (ride.status !== 'ongoing') throw new AppError('Ride is not ongoing', 400);

    ride.status = 'completed';
    await ride.save();
    return ride;
};

// ── Promo code validation ──
const PROMO_CODES = {
    FIRST50: { discount: 50, type: 'flat', minFare: 60 },
    QUICK20: { discount: 20, type: 'percent', minFare: 40 },
    RAPIDO30: { discount: 30, type: 'flat', minFare: 50 },
};

module.exports.validatePromoCode = (code, fare) => {
    const promo = PROMO_CODES[code?.toUpperCase()];
    if (!promo) throw new AppError('Invalid promo code', 400);
    if (fare < promo.minFare) throw new AppError(`Minimum fare ₹${promo.minFare} required for this promo`, 400);

    const discount =
        promo.type === 'flat'
            ? Math.min(promo.discount, fare)
            : Math.round((fare * promo.discount) / 100);

    return { discount, finalFare: fare - discount, code: code.toUpperCase() };
};
