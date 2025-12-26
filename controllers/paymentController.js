const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const {
  createPaymentIntent,
  confirmPaymentIntent,
  createRefund,
  getPaymentIntent,
  calculateStripeFee
} = require('../services/stripeService');

// Helper function to generate transaction number
const generateTransactionNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN-${timestamp}-${random}`;
};

// ==================== PAYMENT INTENT ====================

// @desc    Create payment intent for an order
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { order_id, amount, currency = 'USD' } = req.body;

  if (!order_id) {
    return error(res, 'Order ID is required', 400);
  }

  // Verify order exists and belongs to user
  const order = await prisma.order.findUnique({
    where: { id: parseInt(order_id) },
    select: {
      id: true,
      user_id: true,
      order_number: true,
      total: true,
      payment_status: true
    }
  });

  if (!order) {
    return error(res, 'Order not found', 404);
  }

  if (order.user_id !== req.user.id) {
    return error(res, 'Unauthorized to access this order', 403);
  }

  if (order.payment_status === 'paid') {
    return error(res, 'Order is already paid', 400);
  }

  // Use order total if amount not provided
  const paymentAmount = amount || parseFloat(order.total);

  // Create payment intent with Stripe
  const result = await createPaymentIntent(paymentAmount, currency.toLowerCase(), {
    order_id: order.id.toString(),
    user_id: req.user.id.toString(),
    order_number: order.order_number
  });

  if (!result.success) {
    return error(res, result.error || 'Failed to create payment intent', 500);
  }

  // Create pending transaction record
  const transaction = await prisma.transaction.create({
    data: {
      transaction_number: generateTransactionNumber(),
      order_id: order.id,
      user_id: req.user.id,
      type: 'payment',
      status: 'pending',
      payment_method: 'stripe',
      amount: paymentAmount,
      currency: currency.toUpperCase(),
      gateway_transaction_id: result.paymentIntent.id,
      description: `Payment for order ${order.order_number}`
    }
  });

  return success(res, 'Payment intent created successfully', {
    clientSecret: result.paymentIntent.client_secret,
    paymentIntentId: result.paymentIntent.id,
    amount: result.paymentIntent.amount,
    currency: result.paymentIntent.currency,
    status: result.paymentIntent.status,
    transactionId: transaction.id,
    transactionNumber: transaction.transaction_number
  }, 201);
});

// @desc    Confirm payment intent
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = asyncHandler(async (req, res) => {
  const { payment_intent_id } = req.body;

  if (!payment_intent_id) {
    return error(res, 'Payment intent ID is required', 400);
  }

  // Verify transaction exists and belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: {
      gateway_transaction_id: payment_intent_id,
      user_id: req.user.id
    },
    include: {
      order: {
        select: {
          id: true,
          order_number: true,
          total: true
        }
      }
    }
  });

  if (!transaction) {
    return error(res, 'Transaction not found', 404);
  }

  // Confirm payment intent with Stripe
  const result = await confirmPaymentIntent(payment_intent_id);

  if (!result.success) {
    // Update transaction status to failed
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'failed',
        gateway_response: JSON.stringify(result)
      }
    });

    return error(res, result.error || 'Payment confirmation failed', 400);
  }

  // Update transaction
  const gatewayFee = calculateStripeFee(transaction.amount);
  const netAmount = transaction.amount - gatewayFee;

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'completed',
      gateway_response: JSON.stringify(result.paymentIntent),
      gateway_fee: gatewayFee,
      net_amount: netAmount,
      processed_at: new Date()
    }
  });

  // Update order payment status
  await prisma.order.update({
    where: { id: transaction.order_id },
    data: {
      payment_status: 'paid',
      payment_id: payment_intent_id
    }
  });

  return success(res, 'Payment confirmed successfully', {
    transaction: {
      id: transaction.id,
      transactionNumber: transaction.transaction_number,
      status: 'completed',
      amount: transaction.amount,
      netAmount: netAmount
    },
    order: {
      id: transaction.order.id,
      orderNumber: transaction.order.order_number,
      paymentStatus: 'paid'
    }
  });
});

// @desc    Get payment intent status
// @route   GET /api/payments/intent/:payment_intent_id
// @access  Private
exports.getPaymentIntentStatus = asyncHandler(async (req, res) => {
  const { payment_intent_id } = req.params;

  // Verify transaction belongs to user
  const transaction = await prisma.transaction.findFirst({
    where: {
      gateway_transaction_id: payment_intent_id,
      user_id: req.user.id
    }
  });

  if (!transaction) {
    return error(res, 'Transaction not found', 404);
  }

  // Get payment intent from Stripe
  const result = await getPaymentIntent(payment_intent_id);

  if (!result.success) {
    return error(res, result.error || 'Failed to retrieve payment intent', 500);
  }

  return success(res, 'Payment intent retrieved successfully', {
    paymentIntent: result.paymentIntent,
    transaction: {
      id: transaction.id,
      transactionNumber: transaction.transaction_number,
      status: transaction.status
    }
  });
});

// ==================== REFUNDS ====================

// @desc    Create refund (Admin)
// @route   POST /api/admin/payments/refund
// @access  Private/Admin
exports.createRefund = asyncHandler(async (req, res) => {
  const { transaction_id, amount, reason = 'requested_by_customer' } = req.body;

  if (!transaction_id) {
    return error(res, 'Transaction ID is required', 400);
  }

  // Get transaction
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(transaction_id) },
    include: {
      order: {
        select: {
          id: true,
          order_number: true,
          payment_status: true
        }
      }
    }
  });

  if (!transaction) {
    return error(res, 'Transaction not found', 404);
  }

  if (transaction.status !== 'completed' || transaction.type !== 'payment') {
    return error(res, 'Can only refund completed payment transactions', 400);
  }

  if (!transaction.gateway_transaction_id) {
    return error(res, 'Transaction does not have a gateway transaction ID', 400);
  }

  // Create refund with Stripe
  const result = await createRefund(
    transaction.gateway_transaction_id,
    amount || null,
    reason
  );

  if (!result.success) {
    return error(res, result.error || 'Refund failed', 500);
  }

  // Determine refund type
  const refundType = amount && amount < transaction.amount ? 'partial_refund' : 'refund';

  // Create refund transaction
  const refundTransaction = await prisma.transaction.create({
    data: {
      transaction_number: generateTransactionNumber(),
      order_id: transaction.order_id,
      user_id: transaction.user_id,
      type: refundType,
      status: 'completed',
      payment_method: 'stripe',
      amount: result.refund.amount,
      currency: transaction.currency,
      gateway_transaction_id: result.refund.id,
      gateway_response: JSON.stringify(result.refund),
      description: `Refund for transaction ${transaction.transaction_number}`,
      processed_at: new Date()
    }
  });

  // Update order payment status if full refund
  if (refundType === 'refund') {
    await prisma.order.update({
      where: { id: transaction.order_id },
      data: {
        payment_status: 'refunded'
      }
    });
  }

  return success(res, 'Refund processed successfully', {
    refund: result.refund,
    transaction: {
      id: refundTransaction.id,
      transactionNumber: refundTransaction.transaction_number,
      type: refundTransaction.type,
      amount: refundTransaction.amount
    }
  }, 201);
});

// ==================== WEBHOOK ====================

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public (Stripe signature verification)
exports.handleWebhook = asyncHandler(async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const { handleWebhook } = require('../services/stripeService');

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return error(res, 'Webhook secret not configured', 500);
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return error(res, `Webhook Error: ${err.message}`, 400);
  }

  // Handle the event
  const result = await handleWebhook(event);

  if (result.success) {
    return res.status(200).json({ received: true, message: result.message });
  } else {
    console.error('Webhook handling failed:', result.error);
    return res.status(500).json({ received: false, error: result.error });
  }
});

