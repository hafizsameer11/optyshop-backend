const express = require('express');
const router = express.Router();
const {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription
} = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');

// All prescription routes require authentication
router.use(protect);

router.get('/', getPrescriptions);
router.post('/', createPrescription);
router.get('/:id', getPrescription);
router.put('/:id', updatePrescription);
router.delete('/:id', deletePrescription);

module.exports = router;

