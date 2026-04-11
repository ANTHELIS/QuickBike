const captainModel = require('../models/captain.model');
const AppError = require('../utils/AppError');

module.exports.createCaptain = async ({
    firstname,
    lastname,
    email,
    phone,
    password,
    color,
    plate,
    capacity,
    vehicleType,
}) => {
    if (!firstname || !phone || !password || !color || !plate || !capacity || !vehicleType) {
        throw new AppError('All required fields must be provided', 400);
    }

    const captain = await captainModel.create({
        fullname: { firstname, lastname },
        email: email || null,
        phone,
        password,
        vehicle: { color, plate, capacity, vehicleType },
    });

    return captain;
};