const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

const captainSchema = new mongoose.Schema(
    {
        fullname: {
            firstname: {
                type: String,
                required: true,
                minlength: [3, 'Firstname must be at least 3 characters long'],
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
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'inactive',
        },
        vehicle: {
            color: {
                type: String,
                required: true,
                minlength: [3, 'Color must be at least 3 characters long'],
                trim: true,
            },
            plate: {
                type: String,
                required: true,
                minlength: [3, 'Plate must be at least 3 characters long'],
                trim: true,
            },
            capacity: {
                type: Number,
                required: true,
                min: [1, 'Capacity must be at least 1'],
            },
            vehicleType: {
                type: String,
                required: true,
                enum: ['car', 'motorcycle', 'auto'],
            },
        },
        location: {
            // GeoJSON format for 2dsphere queries
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0],
            },
        },
    },
    { timestamps: true }
);

// 2dsphere index for geospatial queries — CRITICAL for production performance
captainSchema.index({ 'location': '2dsphere' });
captainSchema.index({ email: 1 });

captainSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

captainSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

captainSchema.statics.hashPassword = async function (password) {
    return bcrypt.hash(password, 10);
};

captainSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

const captainModel = mongoose.model('captain', captainSchema);

module.exports = captainModel;