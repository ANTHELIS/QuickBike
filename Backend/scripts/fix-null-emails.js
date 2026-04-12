require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

async function main() {
    await mongoose.connect(config.db.uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Fix existing captains that have email: null (need to UNSET the field)
    const result = await db.collection('captains').updateMany(
        { email: null },
        { $unset: { email: '' } }
    );
    console.log(`Fixed ${result.modifiedCount} captains with email:null → field removed`);

    // Also clean up the test captain we may have created
    const deleted = await db.collection('captains').deleteOne(
        { phone: '8888888888', 'fullname.firstname': 'DirectTest' }
    );
    if (deleted.deletedCount) console.log('Cleaned up test captain');

    await mongoose.disconnect();
    console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
