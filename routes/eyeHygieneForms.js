const express = require('express');
const { getEyeHygieneFormOptions } = require('../controllers/productVariantController');
const router = express.Router();

// @route   GET /api/eye-hygiene-forms/options
// @access  Public
router.get('/options', getEyeHygieneFormOptions);

module.exports = router;
