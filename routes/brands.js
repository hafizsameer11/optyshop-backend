const express = require('express');
const router = express.Router();
const { getBrands } = require('../controllers/marketingController');

// Public route - get brands (with optional ?activeOnly=true)
router.get('/', getBrands);

module.exports = router;

