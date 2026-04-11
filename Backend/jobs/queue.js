/**
 * Background Job Queue — BullMQ with Redis, or in-memory fallback.
 *
 * Production jobs:
 *   - rideAutoCancel: Cancel pending rides after 10 min
 *   - rideReDispatch: Expand search radius if no captain in 60s
 *   - otpTimeout: Auto-cancel accepted rides if OTP not entered in 15 min
 *   - surgeRecalc: Recalculate surge pricing every 2 min
 *   - dailySettlement: Transfer captain earnings to bank daily
 *   - promoCleanup: Expire outdated promo codes
 *   - kycReminder: Send email reminders at 24h and 48h
 *
 * In development without Redis, jobs run via setTimeout (no persistence,
 * no retries, no concurrency control — fine for local testing).
 */

const config = require('../config');
const logger = require('../utils/logger');

let Queue, Worker;
const queues = {};
const workers = {};

/**
 * Initialize the job queue system.
 * Call this AFTER Redis is connected.
 */
async function initJobQueue() {
    if (!config.redis.enabled) {
        logger.warn('BullMQ disabled — Redis not configured. Using in-memory job scheduling.');
        return;
    }

    try {
        const bullmq = require('bullmq');
        Queue = bullmq.Queue;
        Worker = bullmq.Worker;
        logger.info('BullMQ initialized with Redis');
    } catch (err) {
        logger.warn('bullmq not installed. Background jobs will use setTimeout fallback.', {
            error: err.message,
        });
    }
}

/**
 * Create or get a named queue.
 * @param {string} name - Queue name (e.g., 'ride-lifecycle', 'notifications')
 * @returns {object} Queue instance or in-memory stub
 */
function getQueue(name) {
    if (queues[name]) return queues[name];

    if (Queue && config.redis.enabled) {
        queues[name] = new Queue(name, {
            connection: { url: config.redis.url },
            defaultJobOptions: {
                removeOnComplete: { count: 100 }, // keep last 100 for debugging
                removeOnFail: { count: 500 },
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
            },
        });
        logger.info('Queue created', { queue: name });
    } else {
        // In-memory stub — jobs execute via setTimeout
        queues[name] = {
            name,
            add: async (jobName, data, opts = {}) => {
                const delay = opts.delay || 0;
                logger.debug('In-memory job scheduled', { queue: name, job: jobName, delay });
                if (delay > 0) {
                    setTimeout(() => {
                        const handler = queues[name]._handler;
                        if (handler) handler({ name: jobName, data });
                    }, delay);
                }
                return { id: `mem_${Date.now()}`, name: jobName };
            },
            _handler: null,
            close: async () => {},
        };
    }

    return queues[name];
}

/**
 * Register a worker for a named queue.
 * @param {string} name - Queue name to process
 * @param {function} handler - async (job) => {} processor
 * @param {object} [opts] - Worker options
 */
function registerWorker(name, handler, opts = {}) {
    if (Worker && config.redis.enabled) {
        workers[name] = new Worker(name, handler, {
            connection: { url: config.redis.url },
            concurrency: opts.concurrency || 5,
            ...opts,
        });

        workers[name].on('completed', (job) => {
            logger.debug('Job completed', { queue: name, job: job.name, id: job.id });
        });

        workers[name].on('failed', (job, err) => {
            logger.error('Job failed', {
                queue: name,
                job: job?.name,
                id: job?.id,
                error: err.message,
                attempt: job?.attemptsMade,
            });
        });

        logger.info('Worker registered', { queue: name, concurrency: opts.concurrency || 5 });
    } else {
        // In-memory: store handler so getQueue().add() can call it
        const q = getQueue(name);
        q._handler = handler;
        logger.debug('In-memory worker registered', { queue: name });
    }
}

/**
 * Gracefully shut down all queues and workers.
 */
async function shutdownQueues() {
    const closeOps = [];
    for (const [name, worker] of Object.entries(workers)) {
        logger.info('Closing worker', { queue: name });
        closeOps.push(worker.close());
    }
    for (const [name, queue] of Object.entries(queues)) {
        logger.info('Closing queue', { queue: name });
        closeOps.push(queue.close());
    }
    await Promise.allSettled(closeOps);
    logger.info('All job queues shut down');
}

module.exports = {
    initJobQueue,
    getQueue,
    registerWorker,
    shutdownQueues,
};
