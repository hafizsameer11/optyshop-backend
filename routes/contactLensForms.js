const express = require('express');
const router = express.Router();
const {
  getFormConfig,
  getSphericalConfigs,
  createSphericalConfig,
  updateSphericalConfig,
  deleteSphericalConfig,
  getAstigmatismDropdownValues,
  createAstigmatismDropdownValue,
  updateAstigmatismDropdownValue,
  deleteAstigmatismDropdownValue,
  getAstigmatismDropdownValuesPublic,
  getSphericalConfigsPublic,
  addContactLensToCart
} = require('../controllers/contactLensFormController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (Website)
router.get('/config/:sub_category_id', getFormConfig);
router.get('/astigmatism/dropdown-values', getAstigmatismDropdownValuesPublic);
router.get('/spherical', getSphericalConfigsPublic);

// Checkout route (requires authentication)
router.post('/checkout', protect, addContactLensToCart);

// Admin routes - Spherical configurations
router.get('/admin/spherical', protect, authorize('admin', 'staff'), getSphericalConfigs);
router.post('/admin/spherical', protect, authorize('admin', 'staff'), createSphericalConfig);
router.put('/admin/spherical/:id', protect, authorize('admin', 'staff'), updateSphericalConfig);
router.delete('/admin/spherical/:id', protect, authorize('admin', 'staff'), deleteSphericalConfig);

// Admin routes - Astigmatism dropdown values
router.get('/admin/astigmatism/dropdown-values', protect, authorize('admin', 'staff'), getAstigmatismDropdownValues);
router.post('/admin/astigmatism/dropdown-values', protect, authorize('admin', 'staff'), createAstigmatismDropdownValue);
router.put('/admin/astigmatism/dropdown-values/:id', protect, authorize('admin', 'staff'), updateAstigmatismDropdownValue);
router.delete('/admin/astigmatism/dropdown-values/:id', protect, authorize('admin', 'staff'), deleteAstigmatismDropdownValue);

module.exports = router;

