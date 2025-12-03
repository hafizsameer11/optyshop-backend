const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  getAllUsers,
  updateUser,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const {
  validateCreateProduct,
  validateUpdateProduct
} = require('../validators/productValidator');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.post('/products', uploadMultiple('images', 5), validateCreateProduct, createProduct);
router.put('/products/:id', uploadMultiple('images', 5), validateUpdateProduct, updateProduct);
router.delete('/products/:id', deleteProduct);

// Orders
router.get('/orders', getAllOrders);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

// Categories
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;

