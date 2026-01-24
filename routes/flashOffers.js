const express = require('express');
const router = express.Router();
const flashOfferController = require('../controllers/flashOfferController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', flashOfferController.getFlashOffers);
router.get('/active', flashOfferController.getActiveFlashOffer);

// Admin routes
router.get('/admin', protect, admin, flashOfferController.getFlashOffersAdmin);
router.get('/admin/:id', protect, admin, flashOfferController.getFlashOfferById);
router.post('/admin', protect, admin, upload.single('image'), flashOfferController.createFlashOffer);
router.put('/admin/:id', protect, admin, upload.single('image'), flashOfferController.updateFlashOffer);
router.delete('/admin/:id', protect, admin, flashOfferController.deleteFlashOffer);

module.exports = router;
