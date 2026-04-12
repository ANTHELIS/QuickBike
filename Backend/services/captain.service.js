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

    // Build the document — omit email entirely if not provided
    // so the sparse unique index can allow multiple captains without email
    const doc = {
        fullname: { firstname, lastname },
        phone,
        password,
        vehicle: { color, plate, capacity, vehicleType },
    };

    // Only include email if actually provided (non-empty string)
    if (email && email.trim()) {
        doc.email = email.trim();
    }

    const captain = await captainModel.create(doc);
    return captain;
};