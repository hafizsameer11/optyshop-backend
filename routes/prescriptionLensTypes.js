const express = require('express');
const router = express.Router();
const {
  getPrescriptionLensTypes,
  getPrescriptionLensType
} = require('../controllers/prescriptionLensTypeController');

// Public routes
router.get('/', getPrescriptionLensTypes);
router.get('/:id', getPrescriptionLensType);

module.exports = router;

