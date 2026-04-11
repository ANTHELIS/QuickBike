const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');

const adminSchema = new mongoose.Schema(
    {
        name:     { type: String, required: true, trim: true },
        email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        role:     { type: String, default: 'admin' },
    },
    { timestamps: true }
);

adminSchema.methods.generateAuthToken = function () {
    return jwt.sign({ _id: this._id, role: 'admin' }, process.env.ADMIN_JWT_SECRET, {
        expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
    });
};

adminSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

adminSchema.statics.hashPassword = async function (password) {
    return bcrypt.hash(password, 10);
};

adminSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('admin', adminSchema);
