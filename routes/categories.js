const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  getCategoryBySlug,
  getRelatedCategories
} = require('../controllers/categoryController');
const { getProductsByCategory } = require('../controllers/productVariantController');

// Standard category routes
router.get('/', getCategories);
router.get('/:id/related', getRelatedCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);
router.get('/:id/products', getProductsByCategory);

module.exports = router;

