const dotenv = require('dotenv');
dotenv.config();

const requiredEnvVars = ['DB_CONNECT', 'JWT_SECRET', 'GOOGLE_MAPS_API'];
const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

if (process.env.GOOGLE_MAPS_API === 'your-google-maps-api-key' || process.env.GOOGLE_MAPS_API.startsWith('your-')) {
    console.error('FATAL: GOOGLE_MAPS_API in .env is still a placeholder. Please use a real key.');
    process.exit(1);
}



const config = Object.freeze({
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    db: {
        uri: process.env.DB_CONNECT,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    cors: {
        // Comma-separated allowed origins, defaults to * for dev only
        origins: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
            : ['*'],
    },
    googleMapsApiKey: process.env.GOOGLE_MAPS_API,
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    },
});

module.exports = config;
