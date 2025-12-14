const express = require('express');
const router = express.Router();
const { getPageBySlug } = require('../controllers/cmsController');

// Public route - get page by slug
router.get('/:slug', getPageBySlug);

module.exports = router;

