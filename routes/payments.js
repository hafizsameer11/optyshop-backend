const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentIntentStatus,
  createRefund,
  handleWebhook
} = require('../controllers/paymentController');

// Webhook endpoint (no auth - uses Stripe signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Customer routes (require authentication)
router.use(protect);

// Payment intents
router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/intent/:payment_intent_id', getPaymentIntentStatus);

// Admin routes (require admin role)
router.post('/refund', authorize('admin', 'staff'), createRefund);

module.exports = router;

