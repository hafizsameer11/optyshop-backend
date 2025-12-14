const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  processRefund,
  assignTechnician
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// All order routes require authentication
router.use(protect);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

// Admin only routes
router.put('/:id/status', authorize('admin', 'staff'), updateOrderStatus);
router.post('/:id/refund', authorize('admin', 'staff'), processRefund);
router.put('/:id/assign-technician', authorize('admin', 'staff'), assignTechnician);

module.exports = router;

