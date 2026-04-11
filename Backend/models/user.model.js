const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

const userSchema = new mongoose.Schema(
    {
        fullname: {
            firstname: {
                type: String,
                required: true,
                minlength: [3, 'First name must be at least 3 characters long'],
                trim: true,
            },
            lastname: {
                type: String,
                trim: true,
                default: '',
            },
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        socketId: {
            type: String,
            default: null,
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        savedPlaces: [
            {
                label: { type: String, trim: true },   // e.g. "Home", "Work"
                address: { type: String, trim: true },
                icon: { type: String, default: 'home' },
            },
        ],
    },
    { timestamps: true }
);


userSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = async function (password) {
    return bcrypt.hash(password, 10);
};

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;