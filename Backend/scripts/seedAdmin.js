/**
 * Admin seeder — run once to create the admin account.
 * Usage: node scripts/seedAdmin.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose   = require('mongoose');
const adminModel = require('../models/admin.model');

async function seed() {
    await mongoose.connect(process.env.DB_CONNECT);
    console.log('Connected to MongoDB');

    const existing = await adminModel.findOne({ email: 'admin@admin.com' });
    if (existing) {
        console.log('Admin already exists:', existing.email);
        process.exit(0);
    }

    const hashed = await adminModel.hashPassword('mithu@admin');
    const admin  = await adminModel.create({
        name:     'QuickBike Admin',
        email:    'admin@admin.com',
        password: hashed,
    });

    console.log('✅ Admin created:', admin.email);
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
