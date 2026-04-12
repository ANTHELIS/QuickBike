const captainModel = require('../models/captain.model');
const logger = require('../utils/logger');

/**
 * Resets daily earnings and ride counts at midnight.
 */
async function resetDailyEarnings() {
    try {
        const result = await captainModel.updateMany(
            {},
            {
                $set: {
                    'performance.todayRides': 0,
                    'performance.cancellationCount': 0,
                    'performance.todayRidesResetAt': new Date(),
                    'performance.cancellationCountResetAt': new Date(),
                }
            }
        );
        logger.info(`Reset daily stats for ${result.modifiedCount} captains`);
    } catch (err) {
        logger.error('Failed to reset daily stats', { error: err.message });
    }
}

/**
 * Resets weekly earnings on Sunday at midnight.
 */
async function resetWeeklyEarnings() {
    try {
        const result = await captainModel.updateMany(
            {},
            {
                $set: {
                    'earnings.thisWeek': 0,
                }
            }
        );
        logger.info(`Reset weekly earnings for ${result.modifiedCount} captains`);
    } catch (err) {
        logger.error('Failed to reset weekly earnings', { error: err.message });
    }
}

/**
 * Resets monthly earnings on the 1st of every month at midnight.
 */
async function resetMonthlyEarnings() {
    try {
        const result = await captainModel.updateMany(
            {},
            {
                $set: {
                    'earnings.thisMonth': 0,
                }
            }
        );
        logger.info(`Reset monthly earnings for ${result.modifiedCount} captains`);
    } catch (err) {
        logger.error('Failed to reset monthly earnings', { error: err.message });
    }
}

/**
 * Start the simple interval-based cron processor.
 */
function startEarningsCron() {
    // Check every hour if it's time to reset
    setInterval(async () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Run at exactly midnight (00:xx)
        // Note: we can prevent double-runs by checking the last reset time at the DB level,
        // but for a simple interval we just run it once around midnight.
        // E.g., interval = 1 hour, so it runs exactly once when hours === 0.
        if (hours === 0) {
            await resetDailyEarnings();

            // Sunday midnight (0 is Sunday in JS Date)
            if (now.getDay() === 0) {
                await resetWeeklyEarnings();
            }

            // 1st of the month midnight
            if (now.getDate() === 1) {
                await resetMonthlyEarnings();
            }
        }
    }, 60 * 60 * 1000); // Check every hour
}

module.exports = {
    startEarningsCron,
    resetDailyEarnings,
    resetWeeklyEarnings,
    resetMonthlyEarnings
};
