const express = require('express');
const router = express.Router();
const { getContactLocations } = require('../controllers/cmsController');

// Public route - active Contact Us locations
router.get('/', getContactLocations);

module.exports = router;
