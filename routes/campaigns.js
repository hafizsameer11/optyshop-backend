const express = require('express');
const router = express.Router();
const { getCampaigns } = require('../controllers/marketingController');

// Public route - get campaigns (with optional ?activeOnly=true)
router.get('/', getCampaigns);

module.exports = router;

