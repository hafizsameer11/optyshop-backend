const express = require('express');
const router = express.Router();
const { getFaqs } = require('../controllers/cmsController');

// Public route - get active FAQs
router.get('/', getFaqs);

module.exports = router;

