const express = require('express');
const router = express.Router();

const {
  getActiveMenus,
  getMenuByCode
} = require('../controllers/navigationController');

// Public navigation endpoints
router.get('/', getActiveMenus);
router.get('/:code', getMenuByCode);

module.exports = router;


