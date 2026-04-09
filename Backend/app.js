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
const logger = require('./utils/logger');

const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');

const app = express();

// ──────────────────────────────────────────────
// 1. Connect to database
// ──────────────────────────────────────────────
connectToDb();

// ──────────────────────────────────────────────
// 2. Security middleware
// ──────────────────────────────────────────────
app.use(helmet()); // Sets security HTTP headers
app.use(hpp()); // Protects against HTTP parameter pollution

app.use(
    cors({
        origin: config.cors.origins.includes('*') ? true : config.cors.origins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ──────────────────────────────────────────────
// 3. Body parsing with size limits
// ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Prevents large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ──────────────────────────────────────────────
// 4. Compression & logging
// ──────────────────────────────────────────────
app.use(compression());

if (config.isProduction) {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// ──────────────────────────────────────────────
// 5. Rate limiting (global)
// ──────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ──────────────────────────────────────────────
// 6. Health check (before auth)
// ──────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ──────────────────────────────────────────────
// 7. API routes
// ──────────────────────────────────────────────
app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);

// ──────────────────────────────────────────────
// 8. 404 handler
// ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ──────────────────────────────────────────────
// 9. Global error handler (MUST be last)
// ──────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
