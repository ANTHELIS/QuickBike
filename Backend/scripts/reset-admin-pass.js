require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

async function main() {
    await mongoose.connect(config.db.uri);
    const adminModel = require('../models/admin.model');

    const email = 'admin@admin.com';
    const newPassword = 'mithu@admin';

    const admin = await adminModel.findOne({ email });
    if (!admin) {
        // Create new
        const hashed = await adminModel.hashPassword(newPassword);
        await adminModel.create({ name: 'Admin', email, password: hashed, role: 'super_admin' });
        console.log('Admin created:', email);
    } else {
        // Reset password
        admin.password = await adminModel.hashPassword(newPassword);
        admin.loginAttempts = 0;
        admin.lockUntil = null;
        await admin.save();
        console.log('Password reset for:', email);
    }

    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
