const { body, query, param, validationResult } = require('express-validator');
const { GENDERS } = require('../utils/constants');

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

// Product creation validation
exports.validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters'),
  body('slug')
    .optional()
    .trim()
    .isSlug()
    .withMessage('Invalid slug format'),
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('SKU must be between 3 and 100 characters'),
  body('category_id')
    .custom((value) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1) {
        throw new Error('Valid category ID is required');
      }
      return true;
    })
    .withMessage('Valid category ID is required'),
  body('price')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error('Price must be a positive number');
      }
      return true;
    })
    .withMessage('Price must be a positive number'),
  body('frame_shape')
    .optional(),
  body('frame_material')
    .optional(),
  body('lens_type')
    .optional(),
  body('gender')
    .optional()
    .isIn(GENDERS)
    .withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),
  handleValidationErrors
];

// Product update validation
exports.validateUpdateProduct = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('frame_shape')
    .optional(),
  body('frame_material')
    .optional(),
  handleValidationErrors
];

// Product query validation
exports.validateProductQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('frameShape')
    .optional(),
  query('frameMaterial')
    .optional(),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  handleValidationErrors
];

// Product ID validation
exports.validateProductId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid product ID'),
  handleValidationErrors
];

