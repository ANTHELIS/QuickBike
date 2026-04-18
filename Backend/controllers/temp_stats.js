const mongoose = require('mongoose');
const rideModel = require('../models/ride.model');
const captainDailyStatModel = require('../models/captainDailyStat.model');
const { success } = require('../utils/response');

module.exports.getUserStats = async (req, res) => {
    const { userType } = req.query; // 'user' or 'captain'

    if (userType === 'captain') {
        const captainId = req.captain._id;

        // Fetch total rides stats
        const allRides = await rideModel.find({ captain: captainId });
        
        let totalEarnings = 0;
        let completedRides = 0;
        allRides.forEach(r => {
            if (r.status === 'completed') {
                totalEarnings += (r.fare || 0);
                completedRides += 1;
            }
        });

        // Aggregating Daily Stats Tracker!
        const dailyStats = await captainDailyStatModel.find({ captain: captainId });
        let totalOnlineSeconds = 0;
        let totalBonusesEarned = 0;

        dailyStats.forEach(stat => {
            totalOnlineSeconds += stat.onlineSeconds;
            totalBonusesEarned += stat.bonusesEarned;
        });

        return success(res, {
            data: {
                totalEarnings,
                completedRides,
                totalOnlineSeconds,
                totalOnlineHours: (totalOnlineSeconds / 3600).toFixed(1),
                totalBonusesEarned
            }
        });
    }

    // Default for user
    return success(res, { data: { rides: 0 } });
};
