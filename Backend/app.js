const config = require('./config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const morgan = require('morgan');

const { connectToDb } = require('./db/db');
const errorHandler = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const requestIdMiddleware = require('./middlewares/requestId.middleware');
const sanitizeMiddleware = require('./middlewares/sanitize.middleware');
const logger = require('./utils/logger');

const userRoutes    = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes    = require('./routes/maps.routes');
const rideRoutes    = require('./routes/ride.routes');
const kycRoutes     = require('./routes/kyc.routes');
const adminRoutes   = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const promoRoutes   = require('./routes/promo.routes');
const supportRoutes = require('./routes/support.routes');

const app = express();

// ──────────────────────────────────────────────
// 1. Connect to database
// ──────────────────────────────────────────────
connectToDb();

// ──────────────────────────────────────────────
// 2. Request ID — FIRST middleware (traces everything downstream)
// ──────────────────────────────────────────────
app.use(requestIdMiddleware);

// ──────────────────────────────────────────────
// 3. Security middleware stack (order matters)
// ──────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: config.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false, // needed for Google Maps tiles
}));
app.use(hpp()); // HTTP Parameter Pollution protection

app.use(
    cors({
        origin: config.cors.origins.includes('*') ? true : config.cors.origins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    })
);

// ──────────────────────────────────────────────
// 4. Body parsing with safe size limits
// ──────────────────────────────────────────────
// 100KB for JSON API payloads — file uploads use multer with separate limits
// verify callback preserves rawBody for Razorpay webhook signature verification
app.use(express.json({
    limit: '100kb',
    verify: (req, res, buf) => {
        // Only preserve rawBody for webhook routes (to minimize memory overhead)
        if (req.originalUrl.includes('/webhook')) {
            req.rawBody = buf.toString();
        }
    },
}));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// ──────────────────────────────────────────────
// 5. Input sanitization (NoSQL injection + XSS)
// ──────────────────────────────────────────────
app.use(sanitizeMiddleware);

// ──────────────────────────────────────────────
// 6. Compression & logging
// ──────────────────────────────────────────────
app.use(compression());

// Morgan logs HTTP requests through Winston
app.use(morgan(
    config.isProduction ? 'combined' : 'dev',
    { stream: logger.stream }
));

// ──────────────────────────────────────────────
// 7. Rate limiting (global)
// ──────────────────────────────────────────────
app.use('/api/', apiLimiter);
// Legacy routes also get rate limiting
app.use('/users', apiLimiter);
app.use('/captains', apiLimiter);
app.use('/maps', apiLimiter);
app.use('/rides', apiLimiter);
app.use('/kyc', apiLimiter);

// ──────────────────────────────────────────────
// 8. Response time header
// ──────────────────────────────────────────────
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        // Log slow requests (>1s) as warnings
        if (durationMs > 1000) {
            logger.warn('Slow request detected', {
                requestId: req.requestId,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                durationMs: durationMs.toFixed(2),
            });
        }
    });
    next();
});

// ──────────────────────────────────────────────
// 9. Health check (before auth, no rate limit)
// ──────────────────────────────────────────────
app.get('/health', (req, res) => {
    const { isConnected } = require('./utils/redis');
    const { getConnectionCount } = require('./socket');
    const mem = process.memoryUsage();
    res.status(200).json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        redis: isConnected() ? 'connected' : 'disconnected',
        sockets: getConnectionCount(),
        memory: {
            rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
            heap: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
        },
        environment: config.nodeEnv,
    });
});

// ──────────────────────────────────────────────
// 10. API routes — both legacy (/) and versioned (/api/v1/)
// ──────────────────────────────────────────────

// Legacy routes (keeping for backward compatibility with frontend)
app.use('/users',     userRoutes);
app.use('/captains',  captainRoutes);
app.use('/maps',      mapsRoutes);
app.use('/rides',     rideRoutes);
app.use('/kyc',       kycRoutes);
app.use('/api/admin', adminRoutes);
app.use('/payments',  paymentRoutes);
app.use('/promos',    apiLimiter, promoRoutes);
app.use('/support',   apiLimiter, supportRoutes);

// Versioned routes (new endpoints go here)
app.use('/api/v1/users',     userRoutes);
app.use('/api/v1/captains',  captainRoutes);
app.use('/api/v1/maps',      mapsRoutes);
app.use('/api/v1/rides',     rideRoutes);
app.use('/api/v1/kyc',       kycRoutes);
app.use('/api/v1/admin',     adminRoutes);
app.use('/api/v1/payments',  paymentRoutes);
app.use('/api/v1/promos',    promoRoutes);
app.use('/api/v1/support',   supportRoutes);

// ──────────────────────────────────────────────
// 11. 404 handler
// ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        meta: { requestId: req.requestId },
    });
});

// ──────────────────────────────────────────────
// 12. Global error handler (MUST be last)
// ──────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
