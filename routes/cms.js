const express = require('express');
const router = express.Router();
const {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    getBlogPosts,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    getFaqs,
    createFaq,
    updateFaq,
    deleteFaq,
    getPages,
    createPage,
    updatePage,
    deletePage,
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial
} = require('../controllers/cmsController');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Public routes (GET only)
router.get('/banners', getBanners);
router.get('/blog', getBlogPosts);
router.get('/faqs', getFaqs);
router.get('/pages', getPages);
router.get('/testimonials', getTestimonials);

// Admin routes (Protected)
router.use(protect);
router.use(authorize('admin'));

// Banners
router.post('/banners', uploadSingle('image'), createBanner);
router.put('/banners/:id', uploadSingle('image'), updateBanner);
router.delete('/banners/:id', deleteBanner);

// Blog Posts
router.post('/blog', uploadSingle('thumbnail'), createBlogPost);
router.put('/blog/:id', uploadSingle('thumbnail'), updateBlogPost);
router.delete('/blog/:id', deleteBlogPost);

// FAQs
router.post('/faqs', createFaq);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

// Pages
router.post('/pages', createPage);
router.put('/pages/:id', updatePage);
router.delete('/pages/:id', deletePage);

// Testimonials
router.post('/testimonials', uploadSingle('avatar'), createTestimonial);
router.put('/testimonials/:id', uploadSingle('avatar'), updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

module.exports = router;
