const opticalCalculations = require('../services/opticalCalculations');
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

