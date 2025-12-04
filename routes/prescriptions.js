const express = require('express');
const router = express.Router();
const {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
  validatePrescription,
  verifyPrescription
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');

// All prescription routes require authentication
router.use(protect);

router.get('/', getPrescriptions);
router.post('/', createPrescription);
router.get('/:id', getPrescription);
router.put('/:id', updatePrescription);
router.delete('/:id', deletePrescription);

// Admin only routes
router.post('/validate', authorize('admin'), validatePrescription);
router.put('/:id/verify', authorize('admin'), verifyPrescription);

module.exports = router;

