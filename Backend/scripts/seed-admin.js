#!/usr/bin/env node

/**
 * Admin Seed Script — Create the first admin account.
 *
 * Usage:
 *   node scripts/seed-admin.js
 *
 * Or with custom values:
 *   ADMIN_NAME="John" ADMIN_EMAIL="john@quickbike.in" ADMIN_PASSWORD="superSecret123" node scripts/seed-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

async function main() {
    const name     = process.env.ADMIN_NAME     || 'Mithu Paul';
    const email    = process.env.ADMIN_EMAIL    || 'admin@admin.com';
    const password = process.env.ADMIN_PASSWORD || 'mithu@admin';
    const role     = process.env.ADMIN_ROLE     || 'super_admin';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  QuickBike — Admin Seed Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Name:  ${name}`);
    console.log(`  Email: ${email}`);
    console.log(`  Role:  ${role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        await mongoose.connect(config.db.uri);
        console.log('\n✓ Connected to MongoDB');

        const { seedAdmin } = require('../controllers/admin.controller');
        await seedAdmin({ name, email, password, role });

        console.log('\n✓ Done!\n');
    } catch (err) {
        console.error('\n✗ Error:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
