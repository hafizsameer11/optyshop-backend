const express = require('express');
const router = express.Router();
const {
  getShippingMethods,
  getShippingMethod
} = require('../controllers/shippingController');

// Public routes
router.get('/', getShippingMethods);
router.get('/:id', getShippingMethod);

module.exports = router;

