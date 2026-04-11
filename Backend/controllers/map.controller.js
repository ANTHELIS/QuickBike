const mapService = require('../services/maps.service');
const { validationResult } = require('express-validator');

module.exports.getCoordinates = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.query;
    const coordinates = await mapService.getAddressCoordinate(address);
    res.status(200).json(coordinates);
};

module.exports.getDistanceTime = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { origin, destination } = req.query;
    const distanceTime = await mapService.getDistanceTime(origin, destination);
    res.status(200).json(distanceTime);
};

module.exports.getAutoCompleteSuggestions = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { input } = req.query;
    const suggestions = await mapService.getAutoCompleteSuggestions(input);
    res.status(200).json(suggestions);
};

module.exports.reverseGeocode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng } = req.query;
    const result = await mapService.reverseGeocode(parseFloat(lat), parseFloat(lng));
    res.status(200).json(result);
};

// GET /maps/nearby-captains?lat=&lng=&radius=5
module.exports.getNearbyCaptains = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Prevent 304 caching — location data must always be fresh
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    const { lat, lng, radius = 5 } = req.query;
    const captains = await mapService.getCaptainsInTheRadius(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius)
    );

    // Return only anonymized location data (privacy)
    const result = captains.map(c => ({
        lat: c.location?.coordinates?.[1],
        lng: c.location?.coordinates?.[0],
        vehicleType: c.vehicle?.vehicleType || 'moto',
    })).filter(c => c.lat && c.lng && (c.lat !== 0 || c.lng !== 0));

    res.json({ captains: result });
};