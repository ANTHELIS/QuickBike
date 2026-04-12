#!/usr/bin/env node

/**
 * Fix stale email indexes and null email values.
 *
 * Problem:
 *   1. MongoDB sparse indexes only skip ABSENT fields, not fields set to null.
 *   2. Mongoose schema had `default: null`, injecting email: null into every doc.
 *   3. The unique index then blocks multiple captains without email.
 *
 * Solution:
 *   1. Drop stale non-sparse indexes
 *   2. Remove email: null from existing documents ($unset)
 *   3. Rebuild indexes via Mongoose syncIndexes
 *
 * Usage:
 *   node scripts/fix-email-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

async function fixCollection(db, collectionName) {
    const collection = db.collection(collectionName);
    let changed = false;

    // Step 1: Drop stale non-sparse unique email index
    const indexes = await collection.indexes();
    const emailIdx = indexes.find(i => i.key?.email && i.unique && !i.sparse);
    if (emailIdx) {
        await collection.dropIndex(emailIdx.name);
        console.log(`  ✓ ${collectionName}: dropped stale index "${emailIdx.name}"`);
        changed = true;
    } else {
        console.log(`  ✓ ${collectionName}: email index already correct`);
    }

    // Step 2: Remove email: null from existing documents
    const nullResult = await collection.updateMany(
        { email: null },
        { $unset: { email: '' } }
    );
    if (nullResult.modifiedCount > 0) {
        console.log(`  ✓ ${collectionName}: removed email:null from ${nullResult.modifiedCount} documents`);
        changed = true;
    }

    return changed;
}

async function main() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  QuickBike — Fix Email Index Migration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        await mongoose.connect(config.db.uri);
        console.log('\n✓ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        const fixed1 = await fixCollection(db, 'captains');
        const fixed2 = await fixCollection(db, 'users');

        if (fixed1 || fixed2) {
            console.log('\n  Rebuilding indexes via syncIndexes...');
            require('../models/captain.model');
            require('../models/user.model');

            for (const modelName of mongoose.modelNames()) {
                const model = mongoose.model(modelName);
                try {
                    await model.syncIndexes();
                    console.log(`  ✓ ${modelName}: indexes synced`);
                } catch (err) {
                    console.error(`  ✗ ${modelName}: sync failed — ${err.message}`);
                }
            }
        }

        // Verify
        console.log('\n  Verifying...');
        for (const coll of ['captains', 'users']) {
            const indexes = await db.collection(coll).indexes();
            const emailIdx = indexes.find(i => i.key?.email);
            if (emailIdx) {
                const isSparse = emailIdx.sparse ? '✓ SPARSE' : '○ NOT SPARSE (expected if email is required)';
                console.log(`  ${coll}.email: unique=${emailIdx.unique}, ${isSparse}`);
            } else {
                console.log(`  ${coll}.email: no index`);
            }
        }

        console.log('\n✓ Migration complete!\n');
    } catch (err) {
        console.error('\n✗ Error:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

main();
