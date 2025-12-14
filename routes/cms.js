// This file is deprecated - routes moved:
// - Public routes: /api/banners, /api/faqs, /api/pages/:slug
// - Admin routes: /api/admin/banners, /api/admin/blog-posts, /api/admin/faqs, /api/admin/pages
// - Testimonials still here for now (not in spec, keeping for backward compatibility)

const express = require('express');
const router = express.Router();
const {
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial
} = require('../controllers/cmsController');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Public route (GET only)
router.get('/testimonials', getTestimonials);
router.get('/banners', require('../controllers/cmsController').getBanners);

// Admin routes (Protected)
router.use(protect);
router.use(authorize('admin', 'staff'));

// Testimonials
router.post('/testimonials', uploadSingle('avatar'), createTestimonial);
router.put('/testimonials/:id', uploadSingle('avatar'), updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

module.exports = router;
