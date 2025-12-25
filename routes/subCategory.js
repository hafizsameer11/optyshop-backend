const express = require('express');
const router = express.Router();
const {
    getSubCategories,
    getSubCategory,
    getSubCategoryBySlug,
    getSubCategoriesByCategory,
    getSubCategoriesByParent,
    getRelatedCategories,
    getSubCategoryProducts,
    getContactLensOptions,
    getContactLensOptionsBySlug,
} = require('../controllers/subCategoryController');

// Public routes - specific routes first, then parameterized
router.get('/', getSubCategories);
router.get('/by-category/:category_id', getSubCategoriesByCategory);
router.get('/by-parent/:parent_id', getSubCategoriesByParent); // Get sub-subcategories by parent
router.get('/slug/:slug/contact-lens-options', getContactLensOptionsBySlug); // Contact lens options by slug
router.get('/slug/:slug', getSubCategoryBySlug); // Must come before /:id routes
router.get('/:id/contact-lens-options', getContactLensOptions); // Contact lens options by ID
router.get('/:id/products', getSubCategoryProducts);
router.get('/:id/related-categories', getRelatedCategories);
router.get('/:id', getSubCategory);

module.exports = router;
