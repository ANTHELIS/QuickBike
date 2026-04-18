const mongoose = require('mongoose');

const captainDailyStatSchema = new mongoose.Schema({
    captain: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Captain', 
        required: true, 
        index: true 
    },
    // YYYY-MM-DD local format
    dateString: { 
        type: String, 
        required: true, 
        index: true 
    },
    onlineSeconds: { 
        type: Number, 
        default: 0 
    },
    bonusesEarned: { 
        type: Number, 
        default: 0 
    },
    completedRides: { 
        type: Number, 
        default: 0 
    }
}, { timestamps: true });

// Compound index to ensure 1 document per captain per day
captainDailyStatSchema.index({ captain: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('CaptainDailyStat', captainDailyStatSchema);
