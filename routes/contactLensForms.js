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
  getAstigmatismConfigsPublic,
  getAstigmatismConfigs,
  createAstigmatismConfig,
  updateAstigmatismConfig,
  deleteAstigmatismConfig,
  addContactLensToCart,
  getContactLensProducts
} = require('../controllers/contactLensFormController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (Website)
router.get('/config/:sub_category_id', getFormConfig);
router.get('/astigmatism/dropdown-values', getAstigmatismDropdownValuesPublic);
router.get('/astigmatism', getAstigmatismConfigsPublic);
router.get('/spherical', getSphericalConfigsPublic);

// Checkout route (requires authentication)
router.post('/checkout', protect, addContactLensToCart);

// Admin routes - Get contact lens products (for product assignment)
router.get('/admin/products', protect, authorize('admin', 'staff'), getContactLensProducts);

// Admin routes - Astigmatism dropdown values (more specific routes first)
router.get('/admin/astigmatism/dropdown-values', protect, authorize('admin', 'staff'), getAstigmatismDropdownValues);
router.post('/admin/astigmatism/dropdown-values', protect, authorize('admin', 'staff'), createAstigmatismDropdownValue);
router.put('/admin/astigmatism/dropdown-values/:id', protect, authorize('admin', 'staff'), updateAstigmatismDropdownValue);
router.delete('/admin/astigmatism/dropdown-values/:id', protect, authorize('admin', 'staff'), deleteAstigmatismDropdownValue);

// Admin routes - Astigmatism configurations
router.get('/admin/astigmatism', protect, authorize('admin', 'staff'), getAstigmatismConfigs);
router.post('/admin/astigmatism', protect, authorize('admin', 'staff'), createAstigmatismConfig);
router.put('/admin/astigmatism/:id', protect, authorize('admin', 'staff'), updateAstigmatismConfig);
router.delete('/admin/astigmatism/:id', protect, authorize('admin', 'staff'), deleteAstigmatismConfig);

// Admin routes - Spherical configurations
router.get('/admin/spherical', protect, authorize('admin', 'staff'), getSphericalConfigs);
router.post('/admin/spherical', protect, authorize('admin', 'staff'), createSphericalConfig);
router.put('/admin/spherical/:id', protect, authorize('admin', 'staff'), updateSphericalConfig);
router.delete('/admin/spherical/:id', protect, authorize('admin', 'staff'), deleteSphericalConfig);

module.exports = router;

