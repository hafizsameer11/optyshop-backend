/**
 * Optical Calculation Services
 * Handles all optical science calculations for OptyShop
 */

/**
 * Calculate Pupillary Distance (PD)
 * @param {Object} params - PD calculation parameters
 * @param {number} params.distancePD - Distance PD in mm
 * @param {string} params.type - 'monocular' or 'binocular'
 * @returns {Object} Calculated PD values
 */
exports.calculatePD = (params) => {
  const { distancePD, type = 'binocular' } = params;

  if (!distancePD || distancePD <= 0) {
    throw new Error('Distance PD is required and must be greater than 0');
  }

  // Near PD calculation: Distance PD - 3mm
  const nearPD = distancePD - 3;

  let result = {
    distancePD: parseFloat(distancePD.toFixed(2)),
    nearPD: parseFloat(nearPD.toFixed(2))
  };

  // If monocular, split the PD
  if (type === 'monocular' && distancePD > 0) {
    result.monocularPD = {
      left: parseFloat((distancePD / 2).toFixed(2)),
      right: parseFloat((distancePD / 2).toFixed(2))
    };
    result.monocularNearPD = {
      left: parseFloat((nearPD / 2).toFixed(2)),
      right: parseFloat((nearPD / 2).toFixed(2))
    };
  }

  return result;
};

/**
 * Calculate Pupillary Height (HP)
 * @param {Object} params - HP calculation parameters
 * @param {number} params.pupilPosition - Pupil position from top in pixels
 * @param {number} params.frameMidline - Frame midline position in pixels
 * @param {number} params.pixelToMMRatio - Conversion ratio (pixels to mm)
 * @returns {Object} Calculated HP value
 */
exports.calculatePupillaryHeight = (params) => {
  const { pupilPosition, frameMidline, pixelToMMRatio = 1 } = params;

  if (pupilPosition === undefined || frameMidline === undefined) {
    throw new Error('Pupil position and frame midline are required');
  }

  // Calculate height difference in pixels
  const heightDifferencePixels = Math.abs(pupilPosition - frameMidline);

  // Convert to millimeters
  const heightDifferenceMM = heightDifferencePixels * pixelToMMRatio;

  return {
    heightDifferenceMM: parseFloat(heightDifferenceMM.toFixed(2)),
    pupilPosition,
    frameMidline,
    direction: pupilPosition > frameMidline ? 'above' : 'below'
  };
};

/**
 * Calculate Lens Thickness
 * @param {Object} params - Lens thickness calculation parameters
 * @param {number} params.frameDiameter - Frame diameter in mm
 * @param {number} params.lensPower - Lens power (diopters)
 * @param {number} params.lensIndex - Lens index (1.56, 1.61, 1.67, 1.74)
 * @returns {Object} Calculated thickness values
 */
exports.calculateLensThickness = (params) => {
  const { frameDiameter, lensPower, lensIndex } = params;

  if (!frameDiameter || frameDiameter <= 0) {
    throw new Error('Frame diameter is required and must be greater than 0');
  }

  if (lensPower === undefined) {
    throw new Error('Lens power is required');
  }

  if (!lensIndex || ![1.56, 1.61, 1.67, 1.74].includes(lensIndex)) {
    throw new Error('Valid lens index is required (1.56, 1.61, 1.67, or 1.74)');
  }

  // Edge thickness formula: (FrameDiameter² × LensPower) / (2000 × Index)
  const edgeThickness = (Math.pow(frameDiameter, 2) * Math.abs(lensPower)) / (2000 * lensIndex);

  // Center thickness (typically 1-2mm for most lenses)
  const centerThickness = 1.5;

  // Determine thickness category
  let thicknessCategory = 'medium';
  if (edgeThickness < 2) {
    thicknessCategory = 'thin';
  } else if (edgeThickness > 5) {
    thicknessCategory = 'thick';
  }

  return {
    edgeThickness: parseFloat(edgeThickness.toFixed(2)),
    centerThickness: parseFloat(centerThickness.toFixed(2)),
    frameDiameter: parseFloat(frameDiameter.toFixed(2)),
    lensPower: parseFloat(lensPower.toFixed(2)),
    lensIndex: parseFloat(lensIndex.toFixed(2)),
    thicknessCategory,
    recommendation: getThicknessRecommendation(edgeThickness, lensIndex)
  };
};

/**
 * Get thickness recommendation based on calculated values
 */
function getThicknessRecommendation(edgeThickness, lensIndex) {
  if (edgeThickness > 5 && lensIndex < 1.67) {
    return 'Consider upgrading to a higher index lens (1.67 or 1.74) for thinner edges';
  }
  if (edgeThickness < 2) {
    return 'Standard index lens is suitable';
  }
  return 'Current lens index is appropriate';
}

/**
 * Recommend lens for kids
 * @param {Object} params - Kids lens recommendation parameters
 * @param {number} params.age - Child's age
 * @param {number} params.pd - Pupillary distance
 * @param {number} params.power - Lens power
 * @returns {Object} Recommended lens configuration
 */
exports.recommendKidsLens = (params) => {
  const { age, pd, power } = params;

  if (!age || age < 0) {
    throw new Error('Age is required');
  }

  const recommendations = {
    material: 'polycarbonate', // Impact-resistant
    coatings: ['uv_protection', 'scratch_protection'],
    index: 1.56, // Standard for kids
    impactResistant: true,
    reasons: []
  };

  // Age-based recommendations
  if (age < 10) {
    recommendations.reasons.push('Polycarbonate is essential for children under 10 for safety');
  }

  // Power-based recommendations
  if (Math.abs(power) > 4) {
    recommendations.index = 1.61;
    recommendations.reasons.push('Higher index recommended for stronger prescriptions');
  }

  // PD-based recommendations
  if (pd && pd < 50) {
    recommendations.reasons.push('Small PD detected - ensure proper frame fit');
  }

  return recommendations;
};

/**
 * Lifestyle-based lens recommendation
 * @param {Object} lifestyle - User lifestyle preferences
 * @returns {Object} Recommended lens features
 */
exports.recommendLifestyleLens = (lifestyle) => {
  const recommendations = {
    lensType: 'prescription',
    coatings: [],
    index: 1.56,
    features: []
  };

  // Screen usage
  if (lifestyle.screenUsage === 'high') {
    recommendations.coatings.push('blue_light_filter');
    recommendations.features.push('Blue-light filter for digital eye strain');
  }

  // Outdoor activities
  if (lifestyle.outdoorActivities === 'frequent') {
    recommendations.lensType = 'photochromic';
    recommendations.features.push('Photochromic lenses adapt to sunlight');
  }

  // Night driving
  if (lifestyle.nightDriving === true) {
    recommendations.coatings.push('ar_coating');
    recommendations.features.push('AR coating reduces glare for night driving');
  }

  // High prescription
  if (lifestyle.prescriptionStrength && Math.abs(lifestyle.prescriptionStrength) > 4) {
    recommendations.index = 1.67;
    recommendations.features.push('High-index lens for thinner profile');
  }

  return recommendations;
};

/**
 * Calculate base curve for contact lenses
 * @param {Object} params - Base curve calculation parameters
 * @param {number} params.cornealCurvature - Corneal curvature in mm
 * @returns {number} Recommended base curve
 */
exports.calculateBaseCurve = (params) => {
  const { cornealCurvature } = params;

  if (!cornealCurvature || cornealCurvature <= 0) {
    throw new Error('Corneal curvature is required');
  }

  // Base curve is typically 0.6-0.8mm flatter than corneal curvature
  const baseCurve = cornealCurvature + 0.7;

  return {
    baseCurve: parseFloat(baseCurve.toFixed(2)),
    cornealCurvature: parseFloat(cornealCurvature.toFixed(2)),
    recommendation: 'Standard base curve calculation'
  };
};

