const express = require('express');
const router = express.Router();
const { getOverview } = require('../controllers/overviewController');
const { protect, authorize } = require('../middleware/auth');

// Overview routes require admin access
router.use(protect);
router.use(authorize('admin'));

router.get('/', getOverview);

module.exports = router;

