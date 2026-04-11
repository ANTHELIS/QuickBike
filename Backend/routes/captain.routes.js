const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const captainController = require('../controllers/captain.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');

router.post(
    '/register',
    authLimiter,
    [
        body('phone')
            .trim()
            .matches(/^[0-9]{10}$/)
            .withMessage('Phone must be a valid 10-digit number'),
        body('email')
            .optional({ nullable: true, checkFalsy: true })
            .isEmail()
            .normalizeEmail()
            .withMessage('Invalid Email'),
        body('fullname.firstname')
            .trim()
            .isLength({ min: 3 })
            .withMessage('First name must be at least 3 characters long'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('vehicle.color')
            .trim()
            .isLength({ min: 3 })
            .withMessage('Color must be at least 3 characters long'),
        body('vehicle.plate')
            .trim()
            .isLength({ min: 3 })
            .withMessage('Plate must be at least 3 characters long'),
        body('vehicle.capacity')
            .isInt({ min: 1 })
            .withMessage('Capacity must be at least 1'),
        body('vehicle.vehicleType')
            .isIn(['car', 'moto', 'auto'])
            .withMessage('Invalid vehicle type'),
    ],
    asyncHandler(captainController.registerCaptain)
);

router.post(
    '/login',
    authLimiter,
    [
        body('phone')
            .optional({ nullable: true, checkFalsy: true })
            .matches(/^[0-9]{10}$/)
            .withMessage('Invalid phone number'),
        body('email')
            .optional({ nullable: true, checkFalsy: true })
            .isEmail()
            .normalizeEmail()
            .withMessage('Invalid Email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
    ],
    asyncHandler(captainController.loginCaptain)
);

router.get(
    '/profile',
    authMiddleware.authCaptain,
    asyncHandler(captainController.getCaptainProfile)
);

router.post(
    '/logout',
    authMiddleware.authCaptain,
    asyncHandler(captainController.logoutCaptain)
);

// Captain updates their own online/offline status
router.patch(
    '/status',
    authMiddleware.authCaptain,
    [
        body('status').isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
    ],
    asyncHandler(captainController.updateStatus)
);

module.exports = router;