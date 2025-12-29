const express = require('express');
const router = express.Router();
const {
  getPrescriptionFormDropdownValues,
  createPrescriptionFormDropdownValue,
  updatePrescriptionFormDropdownValue,
  deletePrescriptionFormDropdownValue,
  getPrescriptionFormDropdownValuesPublic,
  getPrescriptionFormStructure,
  submitPrescriptionForm
} = require('../controllers/prescriptionFormController');
const { protect, authorize } = require('../middleware/auth');

// Admin routes - Dropdown values management (MUST BE BEFORE DYNAMIC ROUTES)
router.get('/admin/dropdown-values', protect, authorize('admin', 'staff'), getPrescriptionFormDropdownValues);
router.post('/admin/dropdown-values', protect, authorize('admin', 'staff'), createPrescriptionFormDropdownValue);
router.put('/admin/dropdown-values/:id', protect, authorize('admin', 'staff'), updatePrescriptionFormDropdownValue);
router.delete('/admin/dropdown-values/:id', protect, authorize('admin', 'staff'), deletePrescriptionFormDropdownValue);

// Public routes (Website/Frontend) - Specific routes first, then dynamic
router.get('/dropdown-values', getPrescriptionFormDropdownValuesPublic);
router.post('/submit', submitPrescriptionForm);
router.get('/:form_type', getPrescriptionFormStructure); // Dynamic route last to avoid conflicts

module.exports = router;

