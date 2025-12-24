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
  getProductConfiguration,
  getLensTypes
} = require('../controllers/productConfigurationController');
const {
  getContactLensConfigsForFrontend
} = require('../controllers/contactLensConfigController');
const {
  validateProductQuery,
  validateProductId
} = require('../validators/productValidator');

// Public routes
router.get('/', validateProductQuery, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/options', getProductFormOptions);
router.get('/configuration/lens-types', getLensTypes);
router.get('/contact-lens-configs', getContactLensConfigsForFrontend);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', validateProductId, getProduct);
router.get('/:id/related', validateProductId, getRelatedProducts);
router.get('/:id/configuration', validateProductId, getProductConfiguration);

module.exports = router;

