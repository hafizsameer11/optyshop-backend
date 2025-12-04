const opticalCalculations = require('../services/opticalCalculations');
const prisma = require('../lib/prisma');
const { uploadToS3, deleteFromS3 } = require('../config/aws');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// @desc    Calculate PD (Pupillary Distance)
// @route   POST /api/simulations/pd
// @access  Public
exports.calculatePD = asyncHandler(async (req, res) => {
  try {
    const result = opticalCalculations.calculatePD(req.body);
    return success(res, 'PD calculated successfully', { calculation: result });
  } catch (err) {
    return error(res, err.message, 400);
  }
});

// @desc    Calculate Pupillary Height (HP)
// @route   POST /api/simulations/pupillary-height
// @access  Public
exports.calculatePupillaryHeight = asyncHandler(async (req, res) => {
  try {
    const result = opticalCalculations.calculatePupillaryHeight(req.body);
    return success(res, 'Pupillary height calculated successfully', { calculation: result });
  } catch (err) {
    return error(res, err.message, 400);
  }
});

// @desc    Calculate Lens Thickness
// @route   POST /api/simulations/lens-thickness
// @access  Public
exports.calculateLensThickness = asyncHandler(async (req, res) => {
  try {
    const result = opticalCalculations.calculateLensThickness(req.body);
    return success(res, 'Lens thickness calculated successfully', { calculation: result });
  } catch (err) {
    return error(res, err.message, 400);
  }
});

// @desc    Get Kids Lens Recommendation
// @route   POST /api/simulations/kids-lens-recommendation
// @access  Public
exports.recommendKidsLens = asyncHandler(async (req, res) => {
  try {
    const result = opticalCalculations.recommendKidsLens(req.body);
    return success(res, 'Kids lens recommendation generated', { recommendation: result });
  } catch (err) {
    return error(res, err.message, 400);
  }
});

// @desc    Get Lifestyle Lens Recommendation
// @route   POST /api/simulations/lifestyle-recommendation
// @access  Public
exports.recommendLifestyleLens = asyncHandler(async (req, res) => {
  try {
    const result = opticalCalculations.recommendLifestyleLens(req.body);
    return success(res, 'Lifestyle lens recommendation generated', { recommendation: result });
  } catch (err) {
    return error(res, err.message, 400);
  }
});

// @desc    Calculate Base Curve (for contact lenses)
// @route   POST /api/simulations/base-curve
// @access  Public
exports.calculateBaseCurve = asyncHandler(async (req, res) => {
  try {
    const result = opticalCalculations.calculateBaseCurve(req.body);
    return success(res, 'Base curve calculated successfully', { calculation: result });
  } catch (err) {
    return error(res, err.message, 400);
  }
});

// @desc    Simulate Photochromic Lens
// @route   POST /api/simulations/photochromic
// @access  Public
exports.simulatePhotochromic = asyncHandler(async (req, res) => {
  const { sunlightLevel } = req.body; // 0-100

  if (sunlightLevel === undefined || sunlightLevel < 0 || sunlightLevel > 100) {
    return error(res, 'Sunlight level must be between 0 and 100', 400);
  }

  // Calculate opacity and color based on sunlight level
  const opacity = Math.min(sunlightLevel / 100, 0.8); // Max 80% opacity
  const brightness = 1 - (sunlightLevel / 100) * 0.5; // Reduce brightness
  const contrast = 1 + (sunlightLevel / 100) * 0.3; // Increase contrast

  return success(res, 'Photochromic simulation generated', {
    simulation: {
      sunlightLevel,
      opacity: parseFloat(opacity.toFixed(2)),
      brightness: parseFloat(brightness.toFixed(2)),
      contrast: parseFloat(contrast.toFixed(2)),
      color: sunlightLevel > 50 ? 'dark_gray' : 'light_gray'
    }
  });
});

// @desc    Simulate AR (Anti-Reflective) Coating
// @route   POST /api/simulations/ar-coating
// @access  Public
exports.simulateARCoating = asyncHandler(async (req, res) => {
  const { reflectionIntensity } = req.body; // 0-100

  if (reflectionIntensity === undefined || reflectionIntensity < 0 || reflectionIntensity > 100) {
    return error(res, 'Reflection intensity must be between 0 and 100', 400);
  }

  // Calculate AR coating effect
  const reflectionOpacity = (reflectionIntensity / 100) * 0.6; // Max 60% opacity
  const colorIntensity = reflectionIntensity / 100;

  return success(res, 'AR coating simulation generated', {
    simulation: {
      reflectionIntensity,
      reflectionOpacity: parseFloat(reflectionOpacity.toFixed(2)),
      colorIntensity: parseFloat(colorIntensity.toFixed(2)),
      colors: ['green', 'blue', 'purple'] // Typical AR coating colors
    }
  });
});

// ==================== SIMULATION CONFIG ====================

// @desc    Get simulation config
// @route   GET /api/simulations/config
// @access  Private/Admin
exports.getSimulationConfig = asyncHandler(async (req, res) => {
  const configs = await prisma.simulationConfig.findMany({
    where: { is_active: true }
  });
  return success(res, 'Simulation config retrieved', { configs });
});

// @desc    Update simulation config
// @route   PUT /api/simulations/config
// @access  Private/Admin
exports.updateSimulationConfig = asyncHandler(async (req, res) => {
  const { config_key, config_value, description, category } = req.body;

  const config = await prisma.simulationConfig.upsert({
    where: { config_key },
    update: { config_value, description, category },
    create: { config_key, config_value, description, category }
  });

  return success(res, 'Simulation config updated', { config });
});

// ==================== VTO ASSETS ====================

// @desc    Get VTO assets
// @route   GET /api/simulations/vto-assets
// @access  Private/Admin
exports.getVtoAssets = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const where = { is_active: true };
  if (type) where.asset_type = type;

  const assets = await prisma.vtoAsset.findMany({ where });
  return success(res, 'VTO assets retrieved', { assets });
});

// @desc    Create VTO asset
// @route   POST /api/simulations/vto-assets
// @access  Private/Admin
exports.createVtoAsset = asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 'File is required', 400);

  const { name, asset_type, description, metadata } = req.body;
  const url = await uploadToS3(req.file, 'vto-assets');

  const asset = await prisma.vtoAsset.create({
    data: {
      name,
      asset_type,
      file_url: url,
      description,
      metadata: metadata ? JSON.parse(metadata) : {}
    }
  });

  return success(res, 'VTO asset created', { asset }, 201);
});

// @desc    Delete VTO asset
// @route   DELETE /api/simulations/vto-assets/:id
// @access  Private/Admin
exports.deleteVtoAsset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const asset = await prisma.vtoAsset.findUnique({ where: { id: parseInt(id) } });
  if (!asset) return error(res, 'Asset not found', 404);

  // Delete from S3
  const key = asset.file_url.split('.com/')[1];
  if (key) await deleteFromS3(key);

  await prisma.vtoAsset.delete({ where: { id: parseInt(id) } });
  return success(res, 'VTO asset deleted');
});

// ==================== VTO CONFIGS ====================

// @desc    Get VTO configs
// @route   GET /api/simulations/vto-configs
// @access  Private/Admin
exports.getVtoConfigs = asyncHandler(async (req, res) => {
  const configs = await prisma.vtoConfig.findMany({ where: { is_active: true } });
  return success(res, 'VTO configs retrieved', { configs });
});

// @desc    Create VTO config
// @route   POST /api/simulations/vto-configs
// @access  Private/Admin
exports.createVtoConfig = asyncHandler(async (req, res) => {
  const configData = { ...req.body };
  if (!configData.slug) {
    configData.slug = configData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  const config = await prisma.vtoConfig.create({ data: configData });
  return success(res, 'VTO config created', { config }, 201);
});

// @desc    Update VTO config
// @route   PUT /api/simulations/vto-configs/:id
// @access  Private/Admin
exports.updateVtoConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const config = await prisma.vtoConfig.update({
    where: { id: parseInt(id) },
    data: req.body
  });
  return success(res, 'VTO config updated', { config });
});

// @desc    Delete VTO config
// @route   DELETE /api/simulations/vto-configs/:id
// @access  Private/Admin
exports.deleteVtoConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.vtoConfig.delete({ where: { id: parseInt(id) } });
  return success(res, 'VTO config deleted');
});

