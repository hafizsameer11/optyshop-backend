const express = require('express');
const router = express.Router();
const {
  getLensOptions,
  getLensOption,
  getLensTreatments,
  getLensTreatment,
  getLensColors,
  getLensColor,
  getLensFinishes,
  getLensFinish
} = require('../controllers/lensController');
const {
  getPrescriptionLensTypes,
  getPrescriptionLensType,
  getPrescriptionSunColors
} = require('../controllers/prescriptionLensTypeController');
const {
  getPrescriptionLensVariants,
  getPrescriptionLensVariant
} = require('../controllers/prescriptionLensVariantController');
const {
  getLensThicknessMaterials,
  getLensThicknessMaterial,
  getLensThicknessOptions,
  getLensThicknessOption
} = require('../controllers/lensThicknessController');

// Public routes
router.get('/options', getLensOptions);
router.get('/options/:id', getLensOption);
router.get('/treatments', getLensTreatments);
router.get('/treatments/:id', getLensTreatment);
router.get('/colors', getLensColors);
router.get('/colors/:id', getLensColor);
router.get('/finishes', getLensFinishes);
router.get('/finishes/:id', getLensFinish);
router.get('/prescription-lens-types', getPrescriptionLensTypes);
router.get('/prescription-sun-colors', getPrescriptionSunColors);
router.get('/prescription-lens-types/:typeId/variants', getPrescriptionLensVariants);
router.get('/prescription-lens-types/:id', getPrescriptionLensType);
router.get('/prescription-lens-variants/:id', getPrescriptionLensVariant);
router.get('/thickness-materials', getLensThicknessMaterials);
router.get('/thickness-materials/:id', getLensThicknessMaterial);
router.get('/thickness-options', getLensThicknessOptions);
router.get('/thickness-options/:id', getLensThicknessOption);

module.exports = router;

