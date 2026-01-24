const express = require('express');
const router = express.Router();
const productGiftController = require('../controllers/productGiftController');
const { protect, authorizeAdmin } = require('../middleware/auth');

// Public routes
router.get('/', productGiftController.getProductGifts);
router.get('/product/:productId', productGiftController.getGiftsForProduct);

// Admin routes
router.get('/admin', protect, authorizeAdmin(), productGiftController.getProductGiftsAdmin);
router.get('/admin/:id', protect, authorizeAdmin(), productGiftController.getProductGiftById);
router.post('/admin', protect, authorizeAdmin(), productGiftController.createProductGift);
router.put('/admin/:id', protect, authorizeAdmin(), productGiftController.updateProductGift);
router.delete('/admin/:id', protect, authorizeAdmin(), productGiftController.deleteProductGift);

module.exports = router;
