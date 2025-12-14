const express = require('express');
const router = express.Router();
const {
  getProductCustomization,
  calculateCustomizationPrice,
  getAllCustomizationOptions,
  getPrescriptionLensTypes,
  calculateCustomizationPriceWithPrescription
} = require('../controllers/productCustomizationController');

// Public routes
router.get('/options', getAllCustomizationOptions);
router.get('/prescription-lens-types', getPrescriptionLensTypes);
router.get('/products/:id/customization', getProductCustomization);
router.post('/products/:id/customization/calculate', calculateCustomizationPrice);
router.post('/products/:id/customization/calculate-with-prescription', calculateCustomizationPriceWithPrescription);

// Note: The routes are mounted at /api/customization in server.js
// So the full paths are:
// GET /api/customization/options
// GET /api/customization/prescription-lens-types
// GET /api/customization/products/:id/customization
// POST /api/customization/products/:id/customization/calculate
// POST /api/customization/products/:id/customization/calculate-with-prescription

module.exports = router;

