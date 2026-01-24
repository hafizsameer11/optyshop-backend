const express = require('express');
const router = express.Router();
const {
  emergencyFixDatabase
} = require('../controllers/emergencyController');

// Emergency routes - no auth required (with secret key protection)
router.post('/fix-database', emergencyFixDatabase);

module.exports = router;
