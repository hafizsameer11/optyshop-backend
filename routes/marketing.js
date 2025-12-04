const express = require('express');
const router = express.Router();
const {
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign
} = require('../controllers/marketingController');
const { protect, authorize } = require('../middleware/auth');

// All marketing routes require admin access
router.use(protect);
router.use(authorize('admin'));

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

module.exports = router;
