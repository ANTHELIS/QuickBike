/**
 * Socket.io Server — Orchestrator.
 *
 * Architecture:
 *   ┌─────────────┐      ┌───────────────────┐
 *   │  socket.js   │─────▶│  socket/handlers.js │
 *   │ (orchestrator)│      │  (event handlers)   │
 *   └──────┬───────┘      └───────────────────┘
 *          │
 *    ┌─────┴──────┐
 *    │  JWT Auth   │  ← verifies token on connect
 *    │  middleware  │
 *    └─────┬──────┘
 *          │
 *    ┌─────┴──────┐
 *    │  Rate Limit │  ← prevents event spam (100 events/min per socket)
 *    │  middleware  │
 *    └────────────┘
 *
 * Key improvements over previous version:
 *   1. Modular handlers (testable, isolated)
 *   2. Event rate limiting (prevents abuse via rapid-fire events)
 *   3. Connection rate limiting (max 5 connections per IP per minute)
 *   4. Ride state sync on reconnect (no blank screen after refresh)
 *   5. Redis-first captain locations (not hammering MongoDB)
 *   6. Heartbeat-based presence detection
 *   7. Re-dispatch via BullMQ jobs (not setInterval)
 */

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const logger = require('./utils/logger');
const {
    handleJoin,
    handleCaptainLocation,
    handleCaptainStatus,
    handleHeartbeat,
    handleDisconnect,
} = require('./socket/handlers');

let io;

// ── Connection rate limiting (per IP) ──
const connectionAttempts = new Map();
const MAX_CONNECTIONS_PER_IP = 10; // per minute
const CONNECTION_WINDOW_MS = 60000;

function checkConnectionRate(address) {
    const now = Date.now();
    if (!connectionAttempts.has(address)) {
        connectionAttempts.set(address, []);
    }

    const attempts = connectionAttempts.get(address);
    // Remove old attempts outside window
    while (attempts.length > 0 && attempts[0] < now - CONNECTION_WINDOW_MS) {
        attempts.shift();
    }

    if (attempts.length >= MAX_CONNECTIONS_PER_IP) {
        return false; // rate limited
    }

    attempts.push(now);
    return true;
}

// Clean up connection attempts periodically (every 5 min)
setInterval(() => {
    const now = Date.now();
    for (const [address, attempts] of connectionAttempts) {
        while (attempts.length > 0 && attempts[0] < now - CONNECTION_WINDOW_MS) {
            attempts.shift();
        }
        if (attempts.length === 0) {
            connectionAttempts.delete(address);
        }
    }
}, 300000);

// ── Event rate limiting (per socket) ──
function createEventRateLimiter(maxEvents = 100, windowMs = 60000) {
    const events = [];

    return function isRateLimited() {
        const now = Date.now();
        // Remove events outside window
        while (events.length > 0 && events[0] < now - windowMs) {
            events.shift();
        }
        if (events.length >= maxEvents) {
            return true;
        }
        events.push(now);
        return false;
    };
}

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: config.cors.origins.includes('*') ? true : config.cors.origins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,   // Time to wait for pong before considering disconnected
        pingInterval: 25000,  // How often to send ping to client
        maxHttpBufferSize: 1e6, // 1MB max payload (prevents memory bomb)
        // Compression for production
        perMessageDeflate: config.isProduction ? {
            threshold: 1024, // Only compress messages > 1KB
        } : false,
    });

    // ── Auth Middleware — JWT verification on connect ──
    io.use(async (socket, next) => {
        try {
            // Connection rate limiting
            const clientIP = socket.handshake.headers['x-forwarded-for']
                || socket.handshake.address;
            if (!checkConnectionRate(clientIP)) {
                logger.warn('Socket connection rate limited', { ip: clientIP });
                return next(new Error('Too many connection attempts'));
            }

            const token =
                socket.handshake.auth?.token || socket.handshake.query?.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, config.jwt.secret);
            socket.userId = decoded._id;

            // Attach rate limiter to this socket
            socket._rateLimiter = createEventRateLimiter(100, 60000); // 100 events/min

            next();
        } catch (err) {
            logger.warn('Socket auth failed', { error: err.message });
            next(new Error('Authentication failed'));
        }
    });

    // ── Event Rate Limiting Middleware ──
    io.use((socket, next) => {
        const originalOnevent = socket.onevent;
        socket.onevent = function (packet) {
            if (socket._rateLimiter && socket._rateLimiter()) {
                logger.warn('Socket event rate limited', {
                    socketId: socket.id,
                    userId: socket.userId,
                    event: packet.data?.[0],
                });
                socket.emit('error', { message: 'Too many events. Slow down.' });
                return;
            }
            originalOnevent.call(this, packet);
        };
        next();
    });

    // ── Connection Handler ──
    io.on('connection', (socket) => {
        logger.debug('Client connected', {
            socketId: socket.id,
            userId: socket.userId,
        });

        // Register all modular event handlers
        handleJoin(socket, io);
        handleCaptainLocation(socket, io);
        handleCaptainStatus(socket, io);
        handleHeartbeat(socket);
        handleDisconnect(socket);
    });

    logger.info('Socket.io initialized');
}

// ── Public API ──

/**
 * Send a message to a specific socket ID.
 * This is the primary way controllers send real-time updates to clients.
 */
function sendMessageToSocketId(socketId, messageObject) {
    if (!io) {
        logger.warn('Socket.io not initialized');
        return;
    }
    if (!socketId) return;
    io.to(socketId).emit(messageObject.event, messageObject.data);
}

/**
 * Send a message to all sockets in a room.
 * Rooms are created automatically: `user:{userId}`, `captain:{userId}`
 */
function sendToRoom(room, event, data) {
    if (!io) return;
    io.to(room).emit(event, data);
}

/**
 * Broadcast to all connected sockets.
 */
function broadcast(event, data) {
    if (!io) return;
    io.emit(event, data);
}

/**
 * Get the raw Socket.io server instance.
 */
function getIO() {
    return io;
}

/**
 * Get count of connected sockets (for health check / admin dashboard).
 */
function getConnectionCount() {
    if (!io) return 0;
    return io.engine.clientsCount;
}

module.exports = {
    initializeSocket,
    sendMessageToSocketId,
    sendToRoom,
    broadcast,
    getIO,
    getConnectionCount,
};