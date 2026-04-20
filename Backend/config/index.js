const dotenv = require('dotenv');
dotenv.config();

// ── Validate critical env vars ──
// These are ALWAYS required, regardless of environment.
const requiredEnvVars = ['DB_CONNECT', 'JWT_SECRET', 'GOOGLE_MAPS_API'];
const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    console.error('See .env.example for the full list of required variables.');
    process.exit(1);
}

// Reject placeholder Google Maps key
if (
    process.env.GOOGLE_MAPS_API === 'your-google-maps-api-key' ||
    process.env.GOOGLE_MAPS_API.startsWith('your-')
) {
    console.error('FATAL: GOOGLE_MAPS_API in .env is still a placeholder. Please use a real key.');
    process.exit(1);
}

// ── Production-only requirements ──
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    const prodRequired = [
        'REDIS_URL',
        'JWT_REFRESH_SECRET',
        'ADMIN_JWT_SECRET',
        // Razorpay keys are only needed when payments are enabled.
        // Uncomment these when you're ready to accept payments:
        // 'RAZORPAY_KEY_ID',
        // 'RAZORPAY_KEY_SECRET',
        // 'RAZORPAY_WEBHOOK_SECRET',
    ];
    const prodMissing = prodRequired.filter((key) => !process.env[key]);
    if (prodMissing.length > 0) {
        console.error(`FATAL (production): Missing required env vars: ${prodMissing.join(', ')}`);
        process.exit(1);
    }
}

// ── Build frozen config object ──
const config = Object.freeze({
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction,
    isDevelopment: !isProduction,

    // ── Database ──
    db: {
        uri: process.env.DB_CONNECT,
        maxPoolSize: parseInt(process.env.DB_MAX_POOL, 10) || 10,
        minPoolSize: parseInt(process.env.DB_MIN_POOL, 10) || 2,
    },

    // ── Redis ──
    redis: {
        url: process.env.REDIS_URL || null,
        // If no REDIS_URL in dev, we use in-memory fallback
        enabled: !!process.env.REDIS_URL,
    },

    // ── JWT — Users & Captains ──
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // ── JWT — Admin (separate secret for isolation) ──
    adminJwt: {
        secret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
        expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
    },

    // ── CORS ──
    cors: {
        origins: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
            : ['*'],
    },

    // ── Google Maps ──
    googleMapsApiKey: process.env.GOOGLE_MAPS_API,

    // ── Razorpay ──
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID || '',
        keySecret: process.env.RAZORPAY_KEY_SECRET || '',
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    },

    // ── Cloudinary ──
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },

    // ── SMS ──
    sms: {
        authKey: process.env.MSG91_AUTH_KEY || '',
        templateId: process.env.MSG91_TEMPLATE_ID || '',
    },

    // ── Email ──
    email: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@quickbike.in',
    },

    // ── Push Notifications ──
    fcm: {
        serverKey: process.env.FCM_SERVER_KEY || '',
    },

    // ── Rate Limiting ──
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    },

    // ── Error Tracking ──
    sentry: {
        dsn: process.env.SENTRY_DSN || '',
    },
});

module.exports = config;
