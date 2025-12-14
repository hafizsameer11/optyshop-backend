const express = require('express');
const router = express.Router();
const { applyCoupon } = require('../controllers/marketingController');
const { optionalAuth } = require('../middleware/auth');

// Public route - coupon application (optional auth for user-specific limits)
router.post('/apply', optionalAuth, applyCoupon);

module.exports = router;

