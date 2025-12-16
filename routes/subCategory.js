const express = require('express');
const router = express.Router();
const {
    getSubCategories,
    getSubCategory,
    getSubCategoryBySlug,
    getSubCategoriesByCategory
} = require('../controllers/subCategoryController');

// Public routes
router.get('/', getSubCategories);
router.get('/by-category/:category_id', getSubCategoriesByCategory);
router.get('/slug/:slug', getSubCategoryBySlug);
router.get('/:id', getSubCategory);

module.exports = router;
