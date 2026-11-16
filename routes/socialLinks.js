const express = require('express');
const router = express.Router();
const { getSocialLinks } = require('../controllers/cmsController');

// Public route - active footer social links
router.get('/', getSocialLinks);

module.exports = router;
