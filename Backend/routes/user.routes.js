const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const { uploadProfilePic } = require('../middlewares/upload.middleware');

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
    ],
    asyncHandler(userController.registerUser)
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
    asyncHandler(userController.loginUser)
);

router.get('/profile', authMiddleware.authUser, asyncHandler(userController.getUserProfile));

router.patch(
    '/profile',
    authMiddleware.authUser,
    [
        body('firstname').optional().trim().isLength({ min: 3 }).withMessage('First name too short'),
        body('lastname').optional().trim(),
        body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
    ],
    asyncHandler(userController.updateProfile)
);

router.post('/logout', authMiddleware.authUser, asyncHandler(userController.logoutUser));

router.get('/saved-places', authMiddleware.authUser, asyncHandler(userController.getSavedPlaces));
router.post('/saved-places', authMiddleware.authUser, asyncHandler(userController.upsertSavedPlace));
router.delete('/saved-places/:label', authMiddleware.authUser, asyncHandler(userController.deleteSavedPlace));

// ── Wallet ──
router.get('/wallet', authMiddleware.authUser, asyncHandler(userController.getWallet));
router.post('/wallet/topup', authMiddleware.authUser, asyncHandler(userController.topUpWallet));

// ── Payment History ──
router.get('/payment-history', authMiddleware.authUser, asyncHandler(userController.getPaymentHistory));

// ── Notifications ──
router.get('/notifications', authMiddleware.authUser, asyncHandler(userController.getNotifications));
router.patch('/notifications/read-all', authMiddleware.authUser, asyncHandler(userController.markAllNotificationsRead));

// ── Payment Methods (UPI / Card) ──
router.post('/payment-methods', authMiddleware.authUser, asyncHandler(userController.addPaymentMethod));
router.delete('/payment-methods/:methodId', authMiddleware.authUser, asyncHandler(userController.deletePaymentMethod));
router.patch('/payment-methods/:methodId/default', authMiddleware.authUser, asyncHandler(userController.setDefaultPaymentMethod));

// ── Profile Picture ──
router.post('/profile/picture', authMiddleware.authUser, uploadProfilePic, asyncHandler(userController.uploadProfilePicture));

module.exports = router;