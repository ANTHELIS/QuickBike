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
        body('email').isEmail().normalizeEmail().withMessage('Invalid Email'),
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
        body('email').isEmail().normalizeEmail().withMessage('Invalid Email'),
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

module.exports = router;