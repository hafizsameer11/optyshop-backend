const express = require('express');
const router = express.Router();
const flashOfferController = require('../controllers/flashOfferController');
const { protect, authorizeAdmin } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Public routes
router.get('/', flashOfferController.getFlashOffers);
router.get('/active', flashOfferController.getActiveFlashOffer);

// Admin routes
router.get('/admin', protect, authorizeAdmin(), flashOfferController.getFlashOffersAdmin);
router.get('/admin/:id', protect, authorizeAdmin(), flashOfferController.getFlashOfferById);
router.post('/admin', protect, authorizeAdmin(), uploadSingle('image'), flashOfferController.createFlashOffer);
router.put('/admin/:id', protect, authorizeAdmin(), uploadSingle('image'), flashOfferController.updateFlashOffer);
router.delete('/admin/:id', protect, authorizeAdmin(), flashOfferController.deleteFlashOffer);

module.exports = router;
