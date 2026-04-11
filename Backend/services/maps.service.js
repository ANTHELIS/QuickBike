const axios = require('axios');
const captainModel = require('../models/captain.model');
const config = require('../config');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ========================================================
// 1. Geocoding — address → { ltd, lng }
// ========================================================
module.exports.getAddressCoordinate = async (address) => {
    if (!address) throw new AppError('Address is required', 400);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.googleMapsApiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return { ltd: location.lat, lng: location.lng };
    }
    
    logger.warn('Google geocoding failed', { address, status: response.data.status });
    throw new AppError('Unable to fetch coordinates for this address', 404);
};

// ========================================================
// 1b. Reverse Geocoding — { lat, lng } → readable address
// ========================================================
module.exports.reverseGeocode = async (lat, lng) => {
    if (lat == null || lng == null) throw new AppError('Latitude and longitude are required', 400);

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

        return {
            address: parts.length > 0 ? parts.join(', ') : result.formatted_address,
            displayName: result.formatted_address,
            lat,
            lng,
        };
    }
    throw new AppError('Unable to find address for these coordinates', 404);
};

// ========================================================
// 2. Distance & Time — origin/dest → { distance, duration }
// ========================================================
module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) throw new AppError('Origin and destination are required', 400);

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${config.googleMapsApiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.status !== 'OK') {
        throw new AppError('Unable to fetch distance and time', 502);
    }
    const element = response.data.rows[0]?.elements[0];
    if (!element || element.status === 'ZERO_RESULTS') {
        throw new AppError('No routes found between these locations', 404);
    }
    return element;
};

// ========================================================
// 3. Autocomplete — input → array of place strings
// ========================================================
module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) throw new AppError('Search query is required', 400);

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${config.googleMapsApiKey}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.status === 'OK') {
        return response.data.predictions.map((p) => p.description).filter(Boolean);
    }
    throw new AppError('Unable to fetch suggestions', 502);
};

// ========================================================
// 4. Find captains within radius (MongoDB geospatial)
// ========================================================
module.exports.getCaptainsInTheRadius = async (lat, lng, radiusKm) => {
    // Primary: geospatial query — only active captains with real coordinates
    const captains = await captainModel.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [lng, lat] },
                distanceField: 'distance',
                maxDistance: radiusKm * 1000,
                spherical: true,
                query: {
                    status: 'active',
                    // Exclude captains still at the default [0, 0] coordinates
                    'location.coordinates': { $ne: [0, 0] },
                },
            },
        },
        { $project: { password: 0, __v: 0 } },
    ]);

    if (captains.length > 0) return captains;

    // Fallback: if geo query found nothing, return any active online captain
    // that has a real location (socketId present = recently connected)
    const fallback = await captainModel.find({
        status: 'active',
        socketId: { $ne: null },
        'location.coordinates': { $ne: [0, 0] },
    }).select('-password -__v').limit(10);

    return fallback;
};