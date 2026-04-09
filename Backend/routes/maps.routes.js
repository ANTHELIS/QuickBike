const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const mapController = require('../controllers/map.controller');
const { query } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');

router.get(
    '/get-coordinates',
    authMiddleware.authUser,
    [query('address').isString().trim().isLength({ min: 3 }).withMessage('Address is required')],
    asyncHandler(mapController.getCoordinates)
);

router.get(
    '/get-distance-time',
    authMiddleware.authUser,
    [
        query('origin')
            .isString()
            .trim()
            .isLength({ min: 3 })
            .withMessage('Origin is required'),
        query('destination')
            .isString()
            .trim()
            .isLength({ min: 3 })
            .withMessage('Destination is required'),
    ],
    asyncHandler(mapController.getDistanceTime)
);

router.get(
    '/get-suggestions',
    authMiddleware.authUser,
    [query('input').isString().trim().isLength({ min: 3 }).withMessage('Search input is required')],
    asyncHandler(mapController.getAutoCompleteSuggestions)
);

module.exports = router;