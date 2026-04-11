const userModel = require('../models/user.model');
const AppError = require('../utils/AppError');

module.exports.createUser = async ({ firstname, lastname, email, password, phone }) => {
    if (!firstname || !email || !password) {
        throw new AppError('First name, email, and password are required', 400);
    }

    const user = await userModel.create({
        fullname: { firstname, lastname },
        email,
        password,
        ...(phone ? { phone } : {}),
    });

    return user;
};