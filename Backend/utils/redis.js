/**
 * Redis Client — with in-memory fallback for development.
 *
 * In production, Redis is REQUIRED for:
 *   - Token blacklisting (O(1) lookup vs O(n) MongoDB scan)
 *   - Captain location caching (thousands of writes/sec)
 *   - Rate limiting backing store
 *   - BullMQ job queue
 *   - Socket.io adapter for horizontal scaling
 *
 * In development, if REDIS_URL is not set, we fall back to an
 * in-memory Map that mimics the basic Redis get/set/del API.
 * This lets developers run the app without installing Redis locally.
 */

const config = require('../config');
const logger = require('./logger');

let client = null;
let isRedisConnected = false;

// ── In-Memory Fallback ──
// Mimics basic Redis API for dev environments without Redis.
class InMemoryStore {
    constructor() {
        this._store = new Map();
        this._timers = new Map();
        logger.warn('Using in-memory store instead of Redis. Do NOT use this in production.');
    }

    async get(key) {
        const entry = this._store.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this._store.delete(key);
            return null;
        }
        return entry.value;
    }

    async set(key, value, ...args) {
        let ttlMs = null;
        // Support: set(key, val, 'EX', seconds) and set(key, val, 'PX', ms)
        if (args.length >= 2) {
            const mode = String(args[0]).toUpperCase();
            const num = parseInt(args[1], 10);
            if (mode === 'EX') ttlMs = num * 1000;
            else if (mode === 'PX') ttlMs = num;
        }
        const expiresAt = ttlMs ? Date.now() + ttlMs : null;
        this._store.set(key, { value: String(value), expiresAt });

        // Clear old timer and set new one for auto-cleanup
        if (this._timers.has(key)) clearTimeout(this._timers.get(key));
        if (ttlMs) {
            this._timers.set(key, setTimeout(() => {
                this._store.delete(key);
                this._timers.delete(key);
            }, ttlMs));
        }
        return 'OK';
    }

    async del(key) {
        if (this._timers.has(key)) clearTimeout(this._timers.get(key));
        this._timers.delete(key);
        return this._store.delete(key) ? 1 : 0;
    }

    async exists(key) {
        const val = await this.get(key); // checks expiry
        return val !== null ? 1 : 0;
    }

    async incr(key) {
        const current = await this.get(key);
        const next = (parseInt(current, 10) || 0) + 1;
        await this.set(key, String(next));
        return next;
    }

    async expire(key, seconds) {
        const entry = this._store.get(key);
        if (!entry) return 0;
        entry.expiresAt = Date.now() + seconds * 1000;
        if (this._timers.has(key)) clearTimeout(this._timers.get(key));
        this._timers.set(key, setTimeout(() => {
            this._store.delete(key);
            this._timers.delete(key);
        }, seconds * 1000));
        return 1;
    }

    async ttl(key) {
        const entry = this._store.get(key);
        if (!entry) return -2;
        if (!entry.expiresAt) return -1;
        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }

    async setex(key, seconds, value) {
        return this.set(key, value, 'EX', seconds);
    }

    async keys(pattern) {
        // Basic glob support: only handles 'prefix*' pattern
        const prefix = pattern.replace('*', '');
        const result = [];
        for (const [key, entry] of this._store) {
            if (key.startsWith(prefix)) {
                if (!entry.expiresAt || Date.now() < entry.expiresAt) {
                    result.push(key);
                }
            }
        }
        return result;
    }

    async flushall() {
        for (const timer of this._timers.values()) clearTimeout(timer);
        this._timers.clear();
        this._store.clear();
        return 'OK';
    }

    // GeoJSON operations are not supported in memory — fail gracefully
    async geoadd() { return 0; }
    async georadius() { return []; }
    async geopos() { return [null]; }

    get status() { return 'ready'; }
}

// ── Initialize Client ──
async function initRedis() {
    if (!config.redis.enabled) {
        client = new InMemoryStore();
        return client;
    }

    try {
        // Dynamic import so the app doesn't crash if ioredis isn't installed
        const Redis = require('ioredis');
        client = new Redis(config.redis.url, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 200, 5000);
                return delay;
            },
            enableReadyCheck: true,
            lazyConnect: false,
        });

        client.on('connect', () => {
            isRedisConnected = true;
            logger.info('Redis connected', { url: config.redis.url.replace(/\/\/.*@/, '//<credentials>@') });
        });

        client.on('error', (err) => {
            isRedisConnected = false;
            logger.error('Redis connection error', { error: err.message });
        });

        client.on('close', () => {
            isRedisConnected = false;
            logger.warn('Redis connection closed');
        });

        return client;
    } catch (err) {
        logger.warn('ioredis not installed, falling back to in-memory store', { error: err.message });
        client = new InMemoryStore();
        return client;
    }
}

// ── Getters ──
function getRedisClient() {
    if (!client) {
        // Lazy init with in-memory if initRedis() hasn't been called yet
        client = new InMemoryStore();
    }
    return client;
}

function isConnected() {
    return isRedisConnected || client instanceof InMemoryStore;
}

async function disconnect() {
    if (client && typeof client.quit === 'function') {
        await client.quit();
        logger.info('Redis disconnected gracefully');
    }
}

module.exports = {
    initRedis,
    getRedisClient,
    isConnected,
    disconnect,
};
