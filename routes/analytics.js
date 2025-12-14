const express = require('express');
const router = express.Router();
const {
    getSalesAnalytics,
    getVtoAnalytics,
    getConversionRates,
    getAdminLogs,
    getApiErrors
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// All analytics routes require admin access
router.use(protect);
router.use(authorize('admin', 'staff'));

// Analytics
router.get('/sales', getSalesAnalytics);
router.get('/vto', getVtoAnalytics);
router.get('/conversion', getConversionRates);

// Logs
router.get('/logs/admin', getAdminLogs);
router.get('/logs/errors', getApiErrors);

module.exports = router;
