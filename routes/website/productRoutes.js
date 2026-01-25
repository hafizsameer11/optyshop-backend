const express = require('express');
const router = express.Router();
const {
  getProductWithCalibers,
  getProductsByCategory
} = require('../../controllers/productVariantController');

// Website Product Routes
router.get('/products/:id', getProductWithCalibers);
router.get('/categories/:categoryId/products', getProductsByCategory);

module.exports = router;
