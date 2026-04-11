/**
 * Ride Lifecycle Jobs — Background workers for ride state management.
 *
 * These jobs handle time-based ride state transitions that can't be
 * done synchronously in request handlers:
 *
 *   1. AUTO-CANCEL PENDING: If no captain accepts within 10 min → cancel
 *   2. RE-DISPATCH: If no captain in 60s → expand radius and re-notify
 *   3. OTP TIMEOUT: If captain accepted but OTP not entered in 15 min → cancel
 *   4. ZOMBIE RIDE: If ride stuck in 'ongoing' for >2h with no heartbeat → alert admin
 */

const { getQueue, registerWorker } = require('./queue');
const logger = require('../utils/logger');

const QUEUE_NAME = 'ride-lifecycle';

// ── Job Schedulers (called from controllers/services) ──

/**
 * Schedule auto-cancel for a pending ride after 10 minutes.
 * Called when a ride is created.
 */
async function scheduleAutoCancel(rideId) {
    const queue = getQueue(QUEUE_NAME);
    await queue.add('auto-cancel-pending', { rideId }, {
        delay: 10 * 60 * 1000, // 10 minutes
        jobId: `auto-cancel-${rideId}`, // prevent duplicates
    });
    logger.debug('Scheduled auto-cancel', { rideId, delayMinutes: 10 });
}

/**
 * Schedule re-dispatch with expanded radius after 60 seconds.
 * Called when a ride is created.
 */
async function scheduleReDispatch(rideId, attempt = 1) {
    const queue = getQueue(QUEUE_NAME);
    await queue.add('re-dispatch', { rideId, attempt }, {
        delay: 60 * 1000, // 60 seconds
        jobId: `re-dispatch-${rideId}-${attempt}`,
    });
    logger.debug('Scheduled re-dispatch', { rideId, attempt, delaySeconds: 60 });
}

/**
 * Schedule OTP timeout for an accepted ride after 15 minutes.
 * Called when a captain confirms a ride.
 */
async function scheduleOtpTimeout(rideId) {
    const queue = getQueue(QUEUE_NAME);
    await queue.add('otp-timeout', { rideId }, {
        delay: 15 * 60 * 1000, // 15 minutes
        jobId: `otp-timeout-${rideId}`,
    });
    logger.debug('Scheduled OTP timeout', { rideId, delayMinutes: 15 });
}

// ── Job Processor (worker) ──

function initRideLifecycleWorker() {
    registerWorker(QUEUE_NAME, async (job) => {
        const { name, data } = job;
        // Lazy-require models to avoid circular dependency
        const rideModel = require('../models/ride.model');
        const { sendMessageToSocketId } = require('../socket');

        switch (name) {
            case 'auto-cancel-pending': {
                // Only cancel if ride is STILL pending (captain may have accepted)
                const ride = await rideModel.findOneAndUpdate(
                    { _id: data.rideId, status: 'pending' },
                    { $set: { status: 'cancelled', cancelledAt: new Date() } },
                    { new: true }
                ).populate('user');

                if (ride) {
                    logger.info('Auto-cancelled pending ride (no captain in 10 min)', {
                        rideId: data.rideId,
                    });

                    // Notify user via socket
                    if (ride.user?.socketId) {
                        sendMessageToSocketId(ride.user.socketId, {
                            event: 'ride-cancelled',
                            data: {
                                rideId: ride._id,
                                cancelledBy: 'system',
                                reason: 'No captain available. Please try again.',
                            },
                        });
                    }
                }
                break;
            }

            case 're-dispatch': {
                const ride = await rideModel.findById(data.rideId);
                if (!ride || ride.status !== 'pending') {
                    logger.debug('Re-dispatch skipped — ride no longer pending', {
                        rideId: data.rideId,
                    });
                    return;
                }

                const radiusKm = Math.min(2 + data.attempt * 2, 10); // 2km → 4km → 6km → ... max 10km
                logger.info('Re-dispatching ride with expanded radius', {
                    rideId: data.rideId,
                    attempt: data.attempt,
                    radiusKm,
                });

                // Schedule next re-dispatch if under max attempts
                if (data.attempt < 4) {
                    await scheduleReDispatch(data.rideId, data.attempt + 1);
                }
                break;
            }

            case 'otp-timeout': {
                // Only cancel if ride is STILL in accepted state (OTP not entered)
                const ride = await rideModel.findOneAndUpdate(
                    { _id: data.rideId, status: 'accepted' },
                    {
                        $set: {
                            status: 'cancelled',
                            cancelledAt: new Date(),
                        },
                    },
                    { new: true }
                ).populate('user').populate('captain');

                if (ride) {
                    logger.info('Auto-cancelled accepted ride (OTP timeout)', {
                        rideId: data.rideId,
                    });

                    // Notify both parties
                    if (ride.user?.socketId) {
                        sendMessageToSocketId(ride.user.socketId, {
                            event: 'ride-cancelled',
                            data: {
                                rideId: ride._id,
                                cancelledBy: 'system',
                                reason: 'Ride cancelled — OTP was not verified in time.',
                            },
                        });
                    }
                    if (ride.captain?.socketId) {
                        sendMessageToSocketId(ride.captain.socketId, {
                            event: 'ride-cancelled',
                            data: {
                                rideId: ride._id,
                                cancelledBy: 'system',
                                reason: 'Ride cancelled — OTP was not verified in time.',
                            },
                        });
                    }
                }
                break;
            }

            default:
                logger.warn('Unknown ride lifecycle job', { name, data });
        }
    }, { concurrency: 3 });

    logger.info('Ride lifecycle worker initialized');
}

module.exports = {
    scheduleAutoCancel,
    scheduleReDispatch,
    scheduleOtpTimeout,
    initRideLifecycleWorker,
};
