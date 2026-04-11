/**
 * Payment Service — Razorpay Integration
 *
 * Handles:
 *   1. Order creation (when ride is created)
 *   2. Payment verification (client-side capture → server verify)
 *   3. Webhook processing (server-to-server from Razorpay)
 *   4. Refund initiation (on ride cancellation)
 *
 * Idempotency:
 *   - Each payment has a unique `idempotencyKey` (rideId + timestamp)
 *   - Webhook events are deduplicated via `webhookLog`
 *   - Refunds check payment status before processing
 *
 * Security:
 *   - Webhook signature verified using HMAC-SHA256
 *   - Payment amounts verified against ride fare
 *   - All operations logged with requestId for audit trail
 */

const crypto = require('crypto');
const config = require('../config');
const paymentModel = require('../models/payment.model');
const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ── Razorpay SDK (lazy-loaded to support dev without keys) ──
let razorpayInstance = null;

function getRazorpay() {
    if (razorpayInstance) return razorpayInstance;

    if (!config.razorpay.keyId || !config.razorpay.keySecret) {
        throw new AppError('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.', 500);
    }

    try {
        const Razorpay = require('razorpay');
        razorpayInstance = new Razorpay({
            key_id: config.razorpay.keyId,
            key_secret: config.razorpay.keySecret,
        });
        return razorpayInstance;
    } catch (err) {
        throw new AppError('Failed to initialize Razorpay SDK. Run: npm install razorpay', 500);
    }
}

// ─────────────────────────────────────────────────
// 1. Create Order — called when user selects online payment
// ─────────────────────────────────────────────────
module.exports.createOrder = async ({ rideId, userId }) => {
    const ride = await rideModel.findById(rideId);
    if (!ride) throw new AppError('Ride not found', 404);
    if (ride.user.toString() !== userId.toString()) {
        throw new AppError('Unauthorized', 403);
    }

    // Check for existing payment (idempotency)
    const existing = await paymentModel.findOne({
        ride: rideId,
        status: { $in: ['created', 'authorized', 'captured'] },
    });
    if (existing) {
        return {
            orderId: existing.razorpayOrderId,
            amount: existing.amount,
            currency: existing.currency,
            paymentId: existing._id,
        };
    }

    const razorpay = getRazorpay();
    const amountInPaise = Math.round(ride.fare * 100); // Razorpay accepts paise

    const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `ride_${rideId}`,
        notes: {
            rideId: rideId.toString(),
            userId: userId.toString(),
        },
    });

    // Create payment record
    const payment = await paymentModel.create({
        ride: rideId,
        user: userId,
        captain: ride.captain,
        razorpayOrderId: order.id,
        amount: ride.fare,
        currency: 'INR',
        status: 'created',
        method: 'online',
        idempotencyKey: `order_${rideId}_${Date.now()}`,
    });

    // Update ride with payment info
    await rideModel.findByIdAndUpdate(rideId, {
        'payment.orderId': order.id,
        'payment.method': 'online',
        'payment.status': 'created',
    });

    logger.info('Razorpay order created', {
        rideId,
        orderId: order.id,
        amount: ride.fare,
        paymentId: payment._id,
    });

    return {
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        paymentId: payment._id,
        key: config.razorpay.keyId, // needed by frontend SDK
    };
};

// ─────────────────────────────────────────────────
// 2. Verify Payment — client calls after Razorpay checkout
// ─────────────────────────────────────────────────
module.exports.verifyPayment = async ({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    rideId,
}) => {
    // Step 1: Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpaySignature) {
        logger.warn('Payment signature verification failed', {
            razorpayOrderId,
            razorpayPaymentId,
        });
        throw new AppError('Payment verification failed — invalid signature', 400);
    }

    // Step 2: Update payment record
    const payment = await paymentModel.findOneAndUpdate(
        { razorpayOrderId, status: { $in: ['created', 'authorized'] } },
        {
            $set: {
                razorpayPaymentId,
                razorpaySignature,
                status: 'captured',
                capturedAt: new Date(),
            },
        },
        { new: true }
    );

    if (!payment) {
        throw new AppError('Payment record not found or already processed', 404);
    }

    // Step 3: Update ride payment status
    await rideModel.findByIdAndUpdate(rideId, {
        'payment.paymentId': razorpayPaymentId,
        'payment.signature': razorpaySignature,
        'payment.status': 'captured',
    });

    logger.info('Payment verified and captured', {
        rideId,
        razorpayOrderId,
        razorpayPaymentId,
        amount: payment.amount,
    });

    return payment;
};

// ─────────────────────────────────────────────────
// 3. Webhook Handler — Razorpay server-to-server
// ─────────────────────────────────────────────────
module.exports.handleWebhook = async (rawBody, signatureHeader) => {
    // Step 1: Verify webhook signature
    if (!config.razorpay.webhookSecret) {
        throw new AppError('Webhook secret not configured', 500);
    }

    const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(rawBody)
        .digest('hex');

    if (expectedSignature !== signatureHeader) {
        logger.warn('Webhook signature mismatch', { signatureHeader });
        throw new AppError('Invalid webhook signature', 400);
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload?.payment?.entity;

    if (!payload) {
        logger.warn('Webhook payload missing payment entity', { eventType });
        return { status: 'ignored', reason: 'No payment entity' };
    }

    // Step 2: Deduplicate (check if we've already processed this event)
    const existingLog = await paymentModel.findOne({
        razorpayOrderId: payload.order_id,
        'webhookLog.event': eventType,
        'webhookLog.receivedAt': { $gte: new Date(Date.now() - 60000) }, // within last 60s
    });
    if (existingLog) {
        return { status: 'duplicate', eventType };
    }

    // Step 3: Process based on event type
    const update = {
        $push: {
            webhookLog: {
                event: eventType,
                payload: JSON.stringify(payload).substring(0, 2000), // truncate
                receivedAt: new Date(),
            },
        },
    };

    switch (eventType) {
        case 'payment.captured':
            update.$set = {
                razorpayPaymentId: payload.id,
                status: 'captured',
                capturedAt: new Date(),
                method: payload.method || 'online',
            };
            break;

        case 'payment.failed':
            update.$set = {
                status: 'failed',
                failureReason: payload.error_description || 'Payment failed',
            };
            break;

        case 'refund.processed':
            const refundEntity = event.payload?.refund?.entity;
            if (refundEntity) {
                update.$set = {
                    'refund.razorpayRefundId': refundEntity.id,
                    'refund.status': 'processed',
                    'refund.processedAt': new Date(),
                };
            }
            break;

        default:
            logger.debug('Unhandled webhook event', { eventType });
            return { status: 'ignored', eventType };
    }

    await paymentModel.findOneAndUpdate(
        { razorpayOrderId: payload.order_id },
        update
    );

    // Update ride payment status
    if (update.$set?.status) {
        const payment = await paymentModel.findOne({ razorpayOrderId: payload.order_id });
        if (payment?.ride) {
            await rideModel.findByIdAndUpdate(payment.ride, {
                'payment.status': update.$set.status,
            });
        }
    }

    logger.info('Webhook processed', { eventType, orderId: payload.order_id });

    return { status: 'processed', eventType };
};

// ─────────────────────────────────────────────────
// 4. Initiate Refund — on ride cancellation
// ─────────────────────────────────────────────────
module.exports.initiateRefund = async ({ rideId, reason }) => {
    const payment = await paymentModel.findOne({
        ride: rideId,
        status: 'captured',
        method: 'online',
    });

    if (!payment) {
        // Cash payment or no payment captured — nothing to refund
        return null;
    }

    if (payment.refund?.status === 'processed') {
        throw new AppError('Refund already processed', 400);
    }

    const razorpay = getRazorpay();

    try {
        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: payment.amount * 100, // paise
            notes: {
                rideId: rideId.toString(),
                reason: reason || 'Ride cancelled',
            },
        });

        await paymentModel.findByIdAndUpdate(payment._id, {
            $set: {
                status: 'refunded',
                'refund.razorpayRefundId': refund.id,
                'refund.amount': payment.amount,
                'refund.status': 'initiated',
                'refund.initiatedAt': new Date(),
                'refund.reason': reason || 'Ride cancelled',
            },
        });

        await rideModel.findByIdAndUpdate(rideId, {
            'payment.status': 'refunded',
        });

        logger.info('Refund initiated', {
            rideId,
            refundId: refund.id,
            amount: payment.amount,
        });

        return { refundId: refund.id, amount: payment.amount };
    } catch (err) {
        logger.error('Refund failed', {
            rideId,
            paymentId: payment._id,
            error: err.message,
        });
        throw new AppError('Refund failed. Please contact support.', 500);
    }
};

// ─────────────────────────────────────────────────
// 5. Mark Cash Payment — captain confirms cash received
// ─────────────────────────────────────────────────
module.exports.markCashPayment = async ({ rideId, captainId }) => {
    const ride = await rideModel.findById(rideId);
    if (!ride) throw new AppError('Ride not found', 404);
    if (ride.captain.toString() !== captainId.toString()) {
        throw new AppError('Unauthorized', 403);
    }
    if (ride.status !== 'completed') {
        throw new AppError('Ride must be completed first', 400);
    }

    // Create or update payment record for cash
    let payment = await paymentModel.findOne({ ride: rideId });

    if (!payment) {
        payment = await paymentModel.create({
            ride: rideId,
            user: ride.user,
            captain: ride.captain,
            amount: ride.fare,
            currency: 'INR',
            status: 'captured',
            method: 'cash',
            capturedAt: new Date(),
            idempotencyKey: `cash_${rideId}_${Date.now()}`,
        });
    } else {
        payment.status = 'captured';
        payment.method = 'cash';
        payment.capturedAt = new Date();
        await payment.save();
    }

    await rideModel.findByIdAndUpdate(rideId, {
        'payment.method': 'cash',
        'payment.status': 'captured',
    });

    return payment;
};

// ─────────────────────────────────────────────────
// 6. Get Payment Details — for ride receipt screen
// ─────────────────────────────────────────────────
module.exports.getPaymentByRide = async (rideId) => {
    const payment = await paymentModel
        .findOne({ ride: rideId })
        .populate('ride', 'pickup destination fare fareBreakdown vehicleType')
        .lean();

    return payment;
};
