const express = require('express');
const router = express.Router();
const {
  getPrescriptionSunLenses,
  getPrescriptionSunLens
} = require('../controllers/prescriptionSunLensController');

// Public routes
router.get('/', getPrescriptionSunLenses);
router.get('/:id', getPrescriptionSunLens);

module.exports = router;

