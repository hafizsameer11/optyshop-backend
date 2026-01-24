const express = require('express');
const router = express.Router();
const productGiftController = require('../controllers/productGiftController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/', productGiftController.getProductGifts);
router.get('/product/:productId', productGiftController.getGiftsForProduct);

// Admin routes
router.get('/admin', protect, admin, productGiftController.getProductGiftsAdmin);
router.get('/admin/:id', protect, admin, productGiftController.getProductGiftById);
router.post('/admin', protect, admin, productGiftController.createProductGift);
router.put('/admin/:id', protect, admin, productGiftController.updateProductGift);
router.delete('/admin/:id', protect, admin, productGiftController.deleteProductGift);

module.exports = router;
