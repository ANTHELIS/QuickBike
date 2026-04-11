const paymentService = require('../services/payment.service');
const { validationResult } = require('express-validator');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────
// POST /payments/create-order
// User initiates online payment for a ride
// ─────────────────────────────────────────────────
module.exports.createOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { rideId } = req.body;

    const order = await paymentService.createOrder({
        rideId,
        userId: req.user._id,
    });

    return success(res, {
        message: 'Order created',
        data: order,
    });
};

// ─────────────────────────────────────────────────
// POST /payments/verify
// User's frontend calls after Razorpay checkout completes
// ─────────────────────────────────────────────────
module.exports.verifyPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        rideId,
    } = req.body;

    const payment = await paymentService.verifyPayment({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        rideId,
    });

    return success(res, {
        message: 'Payment verified',
        data: {
            paymentId: payment._id,
            status: payment.status,
            amount: payment.amount,
        },
    });
};

// ─────────────────────────────────────────────────
// POST /payments/webhook
// Razorpay server-to-server webhook
// ─────────────────────────────────────────────────
module.exports.handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing signature header' });
        }

        // req.rawBody is set by bodyParser with verify option
        const rawBody = req.rawBody || JSON.stringify(req.body);

        const result = await paymentService.handleWebhook(rawBody, signature);

        logger.info('Webhook response', { result });

        // Always return 200 to Razorpay (prevents retries)
        return res.status(200).json(result);
    } catch (err) {
        // Log error but still return 200 to prevent Razorpay retries
        // (failed processing will be caught by monitoring)
        logger.error('Webhook processing error', { error: err.message });
        return res.status(200).json({ status: 'error', message: err.message });
    }
};

// ─────────────────────────────────────────────────
// POST /payments/:rideId/cash
// Captain marks cash as received after ride completion
// ─────────────────────────────────────────────────
module.exports.markCashPayment = async (req, res) => {
    const { rideId } = req.params;

    const payment = await paymentService.markCashPayment({
        rideId,
        captainId: req.captain._id,
    });

    return success(res, {
        message: 'Cash payment recorded',
        data: {
            paymentId: payment._id,
            amount: payment.amount,
            method: 'cash',
        },
    });
};

// ─────────────────────────────────────────────────
// GET /payments/:rideId
// Get payment details for a ride (user or captain)
// ─────────────────────────────────────────────────
module.exports.getPaymentDetails = async (req, res) => {
    const { rideId } = req.params;
    const payment = await paymentService.getPaymentByRide(rideId);

    if (!payment) {
        throw new AppError('No payment found for this ride', 404);
    }

    return success(res, { data: payment });
};
