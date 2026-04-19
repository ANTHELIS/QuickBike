const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────────────
// User endpoints
// ─────────────────────────────────────────────────

// Create a ride (user only)
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
        body('pickupLat').optional().isNumeric(),
        body('pickupLng').optional().isNumeric(),
        body('destLat').optional().isNumeric(),
        body('destLng').optional().isNumeric(),
    ],
    asyncHandler(rideController.createRide)
);

// Get fare estimate (user only)
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
        query('pickupLat').optional().isNumeric(),
        query('pickupLng').optional().isNumeric(),
        query('destLat').optional().isNumeric(),
        query('destLng').optional().isNumeric(),
    ],
    asyncHandler(rideController.getFare)
);

// ─────────────────────────────────────────────────
// Captain endpoints — require KYC approval
// ─────────────────────────────────────────────────

// Confirm ride (captain with approved KYC only)
router.post(
    '/confirm',
    authMiddleware.authCaptainApproved,
    [body('rideId').isMongoId().withMessage('Invalid ride id')],
    asyncHandler(rideController.confirmRide)
);

// Start ride with OTP (captain with approved KYC only)
router.get(
    '/start-ride',
    authMiddleware.authCaptainApproved,
    [
        query('rideId').isMongoId().withMessage('Invalid ride id'),
        query('otp')
            .isString()
            .isLength({ min: 6, max: 6 })
            .withMessage('Invalid OTP'),
    ],
    asyncHandler(rideController.startRide)
);

// End ride (captain with approved KYC only)
router.post(
    '/end-ride',
    authMiddleware.authCaptainApproved,
    [body('rideId').isMongoId().withMessage('Invalid ride id')],
    asyncHandler(rideController.endRide)
);

// ─────────────────────────────────────────────────
// Shared endpoints (user OR captain)
// ─────────────────────────────────────────────────

// Promo code validation
router.get(
    '/promo/:code',
    authMiddleware.authUser,
    asyncHandler(rideController.validatePromo)
);

// Ride history (paginated)
router.get(
    '/history',
    authMiddleware.authAny,
    asyncHandler(rideController.getRideHistory)
);

// Ride stats
router.get(
    '/stats',
    authMiddleware.authAny,
    asyncHandler(rideController.getUserStats)
);

// Captain online hours stats
router.get(
    '/online-stats',
    authMiddleware.authCaptain,
    asyncHandler(rideController.getCaptainOnlineStats)
);

// Cancel ride
router.post(
    '/:rideId/cancel',
    authMiddleware.authAny,
    asyncHandler(rideController.cancelRide)
);

// Rate ride
router.post(
    '/:rideId/rate',
    authMiddleware.authAny,
    [
        body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
        body('feedback').optional().isString(),
    ],
    asyncHandler(rideController.rateRide)
);

module.exports = router;