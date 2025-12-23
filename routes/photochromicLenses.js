const express = require('express');
const router = express.Router();
const {
  getPhotochromicLenses,
  getPhotochromicLens
} = require('../controllers/photochromicLensController');

// Public routes
router.get('/', getPhotochromicLenses);
router.get('/:id', getPhotochromicLens);

module.exports = router;

