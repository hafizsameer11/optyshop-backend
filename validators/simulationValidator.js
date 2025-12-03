const { body, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// PD Calculator validation
exports.validatePDCalculation = [
  body('distancePD')
    .isFloat({ min: 50, max: 80 })
    .withMessage('Distance PD must be between 50 and 80 mm'),
  body('type')
    .optional()
    .isIn(['monocular', 'binocular'])
    .withMessage('Type must be either monocular or binocular'),
  handleValidationErrors
];

// Pupillary Height calculation validation
exports.validateHPCalculation = [
  body('pupilPosition')
    .isFloat({ min: 0 })
    .withMessage('Pupil position must be a positive number'),
  body('frameMidline')
    .isFloat({ min: 0 })
    .withMessage('Frame midline must be a positive number'),
  body('pixelToMMRatio')
    .optional()
    .isFloat({ min: 0.01, max: 10 })
    .withMessage('Pixel to MM ratio must be between 0.01 and 10'),
  handleValidationErrors
];

// Lens thickness calculation validation
exports.validateLensThickness = [
  body('frameDiameter')
    .isFloat({ min: 30, max: 80 })
    .withMessage('Frame diameter must be between 30 and 80 mm'),
  body('lensPower')
    .isFloat({ min: -20, max: 20 })
    .withMessage('Lens power must be between -20 and +20 diopters'),
  body('lensIndex')
    .isIn([1.56, 1.61, 1.67, 1.74])
    .withMessage('Lens index must be 1.56, 1.61, 1.67, or 1.74'),
  handleValidationErrors
];

// Kids lens recommendation validation
exports.validateKidsLensRecommendation = [
  body('age')
    .isInt({ min: 0, max: 18 })
    .withMessage('Age must be between 0 and 18'),
  body('pd')
    .optional()
    .isFloat({ min: 40, max: 80 })
    .withMessage('PD must be between 40 and 80 mm'),
  body('power')
    .optional()
    .isFloat({ min: -20, max: 20 })
    .withMessage('Power must be between -20 and +20 diopters'),
  handleValidationErrors
];

// Lifestyle lens recommendation validation
exports.validateLifestyleRecommendation = [
  body('screenUsage')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Screen usage must be low, medium, or high'),
  body('outdoorActivities')
    .optional()
    .isIn(['none', 'occasional', 'frequent'])
    .withMessage('Outdoor activities must be none, occasional, or frequent'),
  body('nightDriving')
    .optional()
    .isBoolean()
    .withMessage('Night driving must be a boolean'),
  body('prescriptionStrength')
    .optional()
    .isFloat({ min: -20, max: 20 })
    .withMessage('Prescription strength must be between -20 and +20 diopters'),
  handleValidationErrors
];

