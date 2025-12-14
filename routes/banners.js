const express = require('express');
const router = express.Router();
const { getBanners } = require('../controllers/cmsController');

// Public route - get active banners
router.get('/', getBanners);

module.exports = router;

