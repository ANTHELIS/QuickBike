const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.post(
    '/create',
    authMiddleware.authUser,
    [
        body('pickup').isString().trim().isLength({ min: 3 }).withMessage('Invalid pickup address'),
        body('destination')
            .isString()
            .trim()
            .isLength({ min: 3 })
            .withMessage('Invalid destination address'),
        body('vehicleType')
            .isString()
            .isIn(['auto', 'car', 'moto'])
            .withMessage('Invalid vehicle type'),
    ],
    asyncHandler(rideController.createRide)
);

router.get(
    '/get-fare',
    authMiddleware.authUser,
    [
        query('pickup')
            .isString()
            .trim()
            .isLength({ min: 3 })
            .withMessage('Invalid pickup address'),
        query('destination')
            .isString()
            .trim()
            .isLength({ min: 3 })
            .withMessage('Invalid destination address'),
    ],
    asyncHandler(rideController.getFare)
);

router.post(
    '/confirm',
    authMiddleware.authCaptain,
    [body('rideId').isMongoId().withMessage('Invalid ride id')],
    asyncHandler(rideController.confirmRide)
);

router.get(
    '/start-ride',
    authMiddleware.authCaptain,
    [
        query('rideId').isMongoId().withMessage('Invalid ride id'),
        query('otp')
            .isString()
            .isLength({ min: 6, max: 6 })
            .withMessage('Invalid OTP'),
    ],
    asyncHandler(rideController.startRide)
);

router.post(
    '/end-ride',
    authMiddleware.authCaptain,
    [body('rideId').isMongoId().withMessage('Invalid ride id')],
    asyncHandler(rideController.endRide)
);

// User or Captain cancels a ride
router.post(
    '/:rideId/cancel',
    authMiddleware.authAny,
    asyncHandler(rideController.cancelRide)
);

// Post-ride mutual rating (both user and captain can call)
router.post(
    '/:rideId/rate',
    authMiddleware.authAny,
    [
        body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
        body('feedback').optional().isString(),
    ],
    asyncHandler(rideController.rateRide)
);

// Promo code validation
router.get(
    '/promo/:code',
    authMiddleware.authUser,
    asyncHandler(rideController.validatePromo)
);

// ── Ride History & Stats (supports both user and captain) ──
router.get(
    '/history',
    authMiddleware.authAny,
    asyncHandler(rideController.getRideHistory)
);

router.get(
    '/stats',
    authMiddleware.authAny,
    asyncHandler(rideController.getUserStats)
);

module.exports = router;