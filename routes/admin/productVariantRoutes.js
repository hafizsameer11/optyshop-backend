const express = require('express');
const router = express.Router();
const {
  addProductCaliber,
  updateProductCaliber,
  deleteProductCaliber,
  getProductCalibers,
  createEyeHygieneVariant,
  updateEyeHygieneVariant,
  deleteEyeHygieneVariant,
  getEyeHygieneVariants
} = require('../../controllers/productVariantController');
const { protect, authorize } = require('../../middleware/auth');

// MM Caliber Management Routes
router.post('/products/:productId/calibers', protect, authorize('admin'), addProductCaliber);
router.get('/products/:productId/calibers', protect, authorize('admin'), getProductCalibers);
router.put('/products/:productId/calibers/:mm', protect, authorize('admin'), updateProductCaliber);
router.delete('/products/:productId/calibers/:mm', protect, authorize('admin'), deleteProductCaliber);

// Eye Hygiene Variant Management Routes
router.post('/eye-hygiene-variants', protect, authorize('admin'), createEyeHygieneVariant);
router.put('/eye-hygiene-variants/:id', protect, authorize('admin'), updateEyeHygieneVariant);
router.delete('/eye-hygiene-variants/:id', protect, authorize('admin'), deleteEyeHygieneVariant);
router.get('/products/:productId/eye-hygiene-variants', protect, authorize('admin'), getEyeHygieneVariants);

module.exports = router;
