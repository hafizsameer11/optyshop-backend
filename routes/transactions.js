const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserTransactions,
  getTransaction
} = require('../controllers/transactionController');

// All transaction routes require authentication
router.use(protect);

// Customer routes
router.get('/', getUserTransactions);
router.get('/:id', getTransaction);

module.exports = router;

