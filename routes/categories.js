const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  getCategoryBySlug,
  getRelatedCategories
} = require('../controllers/categoryController');

// Standard category routes
router.get('/', getCategories);
router.get('/:id/related', getRelatedCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);

module.exports = router;

