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
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  updateSimulationConfig,
  getSimulationConfig,
  createVtoAsset,
  deleteVtoAsset,
  getVtoAssets,
  createVtoConfig,
  updateVtoConfig,
  deleteVtoConfig,
  getVtoConfigs
} = require('../controllers/simulationController');

// All simulation routes are public (no authentication required)
router.post('/pd', validatePDCalculation, calculatePD);
router.post('/pupillary-height', validateHPCalculation, calculatePupillaryHeight);
router.post('/lens-thickness', validateLensThickness, calculateLensThickness);
router.post('/kids-lens-recommendation', validateKidsLensRecommendation, recommendKidsLens);
router.post('/lifestyle-recommendation', validateLifestyleRecommendation, recommendLifestyleLens);
router.post('/base-curve', calculateBaseCurve);
router.post('/photochromic', simulatePhotochromic);
router.post('/ar-coating', simulateARCoating);

// Admin Routes (Protected)
router.use(protect);
router.use(authorize('admin'));

// Simulation Config
router.get('/config', getSimulationConfig);
router.put('/config', updateSimulationConfig);

// VTO Assets
router.get('/vto-assets', getVtoAssets);
router.post('/vto-assets', uploadSingle('file'), createVtoAsset);
router.delete('/vto-assets/:id', deleteVtoAsset);

// VTO Configs
router.get('/vto-configs', getVtoConfigs);
router.post('/vto-configs', createVtoConfig);
router.put('/vto-configs/:id', updateVtoConfig);
router.delete('/vto-configs/:id', deleteVtoConfig);

module.exports = router;

