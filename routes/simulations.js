const express = require('express');
const router = express.Router();
const {
  calculatePD,
  calculatePupillaryHeight,
  calculateLensThickness,
  recommendKidsLens,
  recommendLifestyleLens,
  calculateBaseCurve,
  simulatePhotochromic,
  simulateARCoating
} = require('../controllers/simulationController');
const {
  validatePDCalculation,
  validateHPCalculation,
  validateLensThickness,
  validateKidsLensRecommendation,
  validateLifestyleRecommendation
} = require('../validators/simulationValidator');

// All simulation routes are public (no authentication required)
router.post('/pd', validatePDCalculation, calculatePD);
router.post('/pupillary-height', validateHPCalculation, calculatePupillaryHeight);
router.post('/lens-thickness', validateLensThickness, calculateLensThickness);
router.post('/kids-lens-recommendation', validateKidsLensRecommendation, recommendKidsLens);
router.post('/lifestyle-recommendation', validateLifestyleRecommendation, recommendLifestyleLens);
router.post('/base-curve', calculateBaseCurve);
router.post('/photochromic', simulatePhotochromic);
router.post('/ar-coating', simulateARCoating);

module.exports = router;

