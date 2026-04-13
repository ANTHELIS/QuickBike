const axios = require('axios');
const captainModel = require('../models/captain.model');
const config = require('../config');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { getRedisClient } = require('../utils/redis');

// ── Cache TTLs ──
const GEOCODE_TTL = 86400;      // 24 hours
const DISTANCE_TTL = 21600;     // 6 hours
const AUTOCOMPLETE_TTL = 3600;  // 1 hour

/**
 * Helper: Generate a stable cache key from input.
 * Normalizes strings to lowercase and trims whitespace.
 */
function cacheKey(prefix, ...parts) {
    return `${prefix}:${parts.map(p => String(p).toLowerCase().trim()).join(':')}`;
}

// ========================================================
// 1. Geocoding — address → { ltd, lng }
//    With Redis cache (hit rate ~70% for repeat addresses)
// ========================================================
module.exports.getAddressCoordinate = async (address) => {
    if (!address) throw new AppError('Address is required', 400);

    const redis = getRedisClient();
    const key = cacheKey('geo', address);

    // Try cache
    const cached = await redis.get(key);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {
            // Corrupted cache entry — fall through to API
        }
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.googleMapsApiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        const result = { ltd: location.lat, lng: location.lng };

        // Cache result
        await redis.setex(key, GEOCODE_TTL, JSON.stringify(result));

        return result;
    }
    
    logger.warn('Google geocoding failed', { address, status: response.data.status });
    throw new AppError('Unable to fetch coordinates for this address', 404);
};

// ========================================================
// 1b. Reverse Geocoding — { lat, lng } → readable address
//     Cached by rounded coordinates (3 decimal places ≈ 111m)
// ========================================================
module.exports.reverseGeocode = async (lat, lng) => {
    if (lat == null || lng == null) throw new AppError('Latitude and longitude are required', 400);

    const redis = getRedisClient();
    // Round to 3 decimal places for cache grouping (~111m precision)
    const roundedLat = parseFloat(lat).toFixed(3);
    const roundedLng = parseFloat(lng).toFixed(3);
    const key = cacheKey('rgeo', roundedLat, roundedLng);

    const cached = await redis.get(key);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch { /* fall through */ }
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${config.googleMapsApiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const components = result.address_components || [];
        const get = (type) => components.find((c) => c.types.includes(type))?.long_name;
        const parts = [
            get('sublocality_level_1') || get('sublocality') || get('neighborhood'),
            get('locality') || get('administrative_area_level_2'),
            get('administrative_area_level_1'),
        ].filter(Boolean);

        const output = {
            address: parts.length > 0 ? parts.join(', ') : result.formatted_address,
            displayName: result.formatted_address,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
        };

        await redis.setex(key, GEOCODE_TTL, JSON.stringify(output));
        return output;
    }
    throw new AppError('Unable to find address for these coordinates', 404);
};

// ========================================================
// 2. Distance & Time — origin/dest → { distance, duration }
//    Cached by origin+destination hash
// ========================================================
module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) throw new AppError('Origin and destination are required', 400);

    const redis = getRedisClient();
    const key = cacheKey('dist', origin, destination);

    const cached = await redis.get(key);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch { /* fall through */ }
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=metric&key=${config.googleMapsApiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.status !== 'OK') {
        throw new AppError('Unable to fetch distance and time', 502);
    }
    const element = response.data.rows[0]?.elements[0];
    if (!element || element.status === 'ZERO_RESULTS') {
        throw new AppError('No routes found between these locations', 404);
    }

    await redis.setex(key, DISTANCE_TTL, JSON.stringify(element));
    return element;
};

// ========================================================
// 3. Autocomplete — input → array of place strings
//    Cached by prefix (min 3 chars)
// ========================================================
module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) throw new AppError('Search query is required', 400);

    // Only cache if input is >= 3 characters
    if (input.length >= 3) {
        const redis = getRedisClient();
        const key = cacheKey('autocomp', input);

        const cached = await redis.get(key);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch { /* fall through */ }
        }

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${config.googleMapsApiKey}`;
        const response = await axios.get(url, { timeout: 10000 });

        if (response.data.status === 'OK') {
            const suggestions = response.data.predictions.map((p) => p.description).filter(Boolean);
            await redis.setex(key, AUTOCOMPLETE_TTL, JSON.stringify(suggestions));
            return suggestions;
        }
        throw new AppError('Unable to fetch suggestions', 502);
    }

    // Too short for cache — query directly
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${config.googleMapsApiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.status === 'OK') {
        return response.data.predictions.map((p) => p.description).filter(Boolean);
    }
    throw new AppError('Unable to fetch suggestions', 502);
};

// ========================================================
// 4. Find captains within radius (MongoDB geospatial)
//    KYC-approved filter added for security
// ========================================================
module.exports.getCaptainsInTheRadius = async (lat, lng, radiusKm) => {
    // Primary: geospatial query — only active + approved captains
    const captains = await captainModel.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [lng, lat] },
                distanceField: 'distance',
                maxDistance: radiusKm * 1000,
                spherical: true,
                query: {
                    status: 'active',
                    kycStatus: 'approved',
                    socketId: { $ne: null },
                    'location.coordinates': { $ne: [0, 0] },
                },
            },
        },
        { $project: { password: 0, __v: 0, bankAccount: 0, loginAttempts: 0, lockUntil: 0 } },
    ]);

    if (captains.length > 0) return captains;

    // Fallback: any active + approved captain recently connected
    const fallback = await captainModel.find({
        status: 'active',
        kycStatus: 'approved',
        socketId: { $ne: null },
        'location.coordinates': { $ne: [0, 0] },
    }).select('-password -__v -bankAccount -loginAttempts -lockUntil').limit(10);

    return fallback;
};