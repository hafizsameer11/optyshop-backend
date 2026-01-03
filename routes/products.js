const express = require('express');
const router = express.Router();
const {
  getProducts,
  getSunglassesProducts,
  getEyeglassesProducts,
  getContactLensesProducts,
  getEyeHygieneProducts,
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
  validateProductQuery,
  validateProductId
} = require('../validators/productValidator');

// Public routes
router.get('/', validateProductQuery, getProducts);
// Section-specific product endpoints (must come before /:id route)
router.get('/section/sunglasses', validateProductQuery, getSunglassesProducts);
router.get('/section/eyeglasses', validateProductQuery, getEyeglassesProducts);
router.get('/section/contact-lenses', validateProductQuery, getContactLensesProducts);
router.get('/section/eye-hygiene', validateProductQuery, getEyeHygieneProducts);
router.get('/featured', getFeaturedProducts);
router.get('/options', getProductFormOptions);
router.get('/configuration/lens-types', getLensTypes);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', validateProductId, getProduct);
router.get('/:id/related', validateProductId, getRelatedProducts);
router.get('/:id/configuration', validateProductId, getProductConfiguration);

module.exports = router;

