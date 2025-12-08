const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getProductBySlug,
  getFeaturedProducts,
  getRelatedProducts,
  getProductFormOptions
} = require('../controllers/productController');
const {
  validateProductQuery,
  validateProductId
} = require('../validators/productValidator');

// Public routes
router.get('/', validateProductQuery, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/options', getProductFormOptions);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', validateProductId, getProduct);
router.get('/:id/related', validateProductId, getRelatedProducts);

module.exports = router;

