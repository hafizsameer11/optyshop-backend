const express = require('express');
const router = express.Router();
const {
    getSubCategories,
    getSubCategory,
    getSubCategoryBySlug
} = require('../controllers/subCategoryController');

// Public routes
router.get('/', getSubCategories);
router.get('/:id', getSubCategory);
router.get('/slug/:slug', getSubCategoryBySlug);

module.exports = router;
