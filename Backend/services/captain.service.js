const captainModel = require('../models/captain.model');
const AppError = require('../utils/AppError');

module.exports.createCaptain = async ({
    firstname,
    lastname,
    email,
    password,
    color,
    plate,
    capacity,
    vehicleType,
}) => {
    if (!firstname || !email || !password || !color || !plate || !capacity || !vehicleType) {
        throw new AppError('All fields are required', 400);
    }

    const captain = await captainModel.create({
        fullname: { firstname, lastname },
        email,
        password,
        vehicle: { color, plate, capacity, vehicleType },
    });

    return captain;
};