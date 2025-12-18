const express = require('express');
const router = express.Router();
const {
    getSubCategories,
    getSubCategory,
    getSubCategoryBySlug,
    getSubCategoriesByCategory,
    getSubCategoriesByParent,
    getRelatedCategories,
    getSubCategoryProducts
} = require('../controllers/subCategoryController');

// Public routes - specific routes first, then parameterized
router.get('/', getSubCategories);
router.get('/by-category/:category_id', getSubCategoriesByCategory);
router.get('/by-parent/:parent_id', getSubCategoriesByParent); // Get sub-subcategories by parent
router.get('/slug/:slug', getSubCategoryBySlug); // Must come before /:id routes
router.get('/:id/products', getSubCategoryProducts);
router.get('/:id/related-categories', getRelatedCategories);
router.get('/:id', getSubCategory);

module.exports = router;
