const express = require('express');
const router = express.Router();
const {
  getProductWithCalibers,
  getProductsByCategory,
  getProductCalibers,
  getProductVariants,
  getVariantDetails
} = require('../../controllers/productVariantController');

// Website Product Routes
router.get('/products/:id', getProductWithCalibers);
router.get('/products/:id/calibers', getProductCalibers);
router.get('/products/:id/variants', getProductVariants);
router.get('/products/:id/variants/:variantId', getVariantDetails);
router.get('/categories/:categoryId/products', getProductsByCategory);

module.exports = router;
