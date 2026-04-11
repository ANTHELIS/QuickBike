const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────────────
// User endpoints
// ─────────────────────────────────────────────────

// Create a Razorpay order (user initiates payment)
router.post(
    '/create-order',
    authMiddleware.authUser,
    [body('rideId').isMongoId().withMessage('Invalid ride ID')],
    asyncHandler(paymentController.createOrder)
);

// Verify payment after Razorpay checkout
router.post(
    '/verify',
    authMiddleware.authUser,
    [
        body('razorpay_order_id').isString().notEmpty().withMessage('Order ID required'),
        body('razorpay_payment_id').isString().notEmpty().withMessage('Payment ID required'),
        body('razorpay_signature').isString().notEmpty().withMessage('Signature required'),
        body('rideId').isMongoId().withMessage('Invalid ride ID'),
    ],
    asyncHandler(paymentController.verifyPayment)
);

// ─────────────────────────────────────────────────
// Webhook (no auth — verified via signature)
// ─────────────────────────────────────────────────
router.post(
    '/webhook',
    // NOTE: No auth middleware — Razorpay sends raw POST
    // Signature is verified inside the handler
    asyncHandler(paymentController.handleWebhook)
);

// ─────────────────────────────────────────────────
// Captain endpoints
// ─────────────────────────────────────────────────

// Mark cash received
router.post(
    '/:rideId/cash',
    authMiddleware.authCaptain,
    asyncHandler(paymentController.markCashPayment)
);

// ─────────────────────────────────────────────────
// Shared endpoints
// ─────────────────────────────────────────────────

// Get payment details for a ride
router.get(
    '/:rideId',
    authMiddleware.authAny,
    asyncHandler(paymentController.getPaymentDetails)
);

module.exports = router;
