const express = require('express');
const router = express.Router();
const {
  fixDatabaseSchema,
  getDatabaseStatus
} = require('../controllers/databaseController');

// Admin database management routes
router.post('/fix-schema', fixDatabaseSchema);
router.get('/status', getDatabaseStatus);

module.exports = router;
