const express = require('express');
const router = express.Router();
const { applyCoupon, getAvailableCoupons, getCouponsPublic } = require('../controllers/marketingController');
const { optionalAuth } = require('../middleware/auth');

// Public route - get active coupons
router.get('/', getCouponsPublic);

// Public route - get available coupons for cart items
router.post('/available', optionalAuth, getAvailableCoupons);

// Public route - coupon application (optional auth for user-specific limits)
router.post('/apply', optionalAuth, applyCoupon);

module.exports = router;

