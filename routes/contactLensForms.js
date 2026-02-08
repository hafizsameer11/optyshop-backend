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
  getContactLensProducts,
  getUnitPriceAndImages
} = require('../controllers/contactLensFormController');
const { protect, authorize } = require('../middleware/auth');
const { uploadFields } = require('../middleware/upload');

// Public routes (Website)
router.get('/config/:sub_category_id', getFormConfig);
router.get('/config/:config_id/unit/:unit', getUnitPriceAndImages); // Get price and images for selected unit
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
router.post('/admin/astigmatism', protect, authorize('admin', 'staff'), uploadFields([
  { name: 'unit_images_10', maxCount: 5 },
  { name: 'unit_images_20', maxCount: 5 },
  { name: 'unit_images_30', maxCount: 5 },
  { name: 'unit_images_60', maxCount: 5 },
  { name: 'unit_images_90', maxCount: 5 },
  { name: 'unit_images_180', maxCount: 5 }
]), createAstigmatismConfig);
router.put('/admin/astigmatism/:id', protect, authorize('admin', 'staff'), uploadFields([
  { name: 'unit_images_10', maxCount: 5 },
  { name: 'unit_images_20', maxCount: 5 },
  { name: 'unit_images_30', maxCount: 5 },
  { name: 'unit_images_60', maxCount: 5 },
  { name: 'unit_images_90', maxCount: 5 },
  { name: 'unit_images_180', maxCount: 5 }
]), updateAstigmatismConfig);
router.delete('/admin/astigmatism/:id', protect, authorize('admin', 'staff'), deleteAstigmatismConfig);

// Admin routes - Spherical configurations
router.get('/admin/spherical', protect, authorize('admin', 'staff'), getSphericalConfigs);
router.post('/admin/spherical', protect, authorize('admin', 'staff'), uploadFields([
  { name: 'unit_images_10', maxCount: 5 },
  { name: 'unit_images_20', maxCount: 5 },
  { name: 'unit_images_30', maxCount: 5 },
  { name: 'unit_images_60', maxCount: 5 },
  { name: 'unit_images_90', maxCount: 5 },
  { name: 'unit_images_180', maxCount: 5 }
]), createSphericalConfig);
router.put('/admin/spherical/:id', protect, authorize('admin', 'staff'), uploadFields([
  { name: 'unit_images_10', maxCount: 5 },
  { name: 'unit_images_20', maxCount: 5 },
  { name: 'unit_images_30', maxCount: 5 },
  { name: 'unit_images_60', maxCount: 5 },
  { name: 'unit_images_90', maxCount: 5 },
  { name: 'unit_images_180', maxCount: 5 }
]), updateSphericalConfig);
router.delete('/admin/spherical/:id', protect, authorize('admin', 'staff'), deleteSphericalConfig);

module.exports = router;

