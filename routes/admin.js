const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllUsers,
  updateUser,
  createCategory,
  updateCategory,
  deleteCategory,
  createFrameSize,
  updateFrameSize,
  deleteFrameSize,
  createLensType,
  updateLensType,
  deleteLensType,
  createLensCoating,
  updateLensCoating,
  deleteLensCoating,
  bulkUploadProducts
} = require('../controllers/adminController');
const {
  getAllOrdersAdmin,
  getAdminOrderDetail
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple, uploadSingle, uploadFields } = require('../middleware/upload');
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
router.post('/products',
  uploadFields([{ name: 'images', maxCount: 5 }, { name: 'model_3d', maxCount: 1 }]),
  validateCreateProduct,
  createProduct
);
router.put('/products/:id',
  uploadFields([{ name: 'images', maxCount: 5 }, { name: 'model_3d', maxCount: 1 }]),
  validateUpdateProduct,
  updateProduct
);
router.delete('/products/:id', deleteProduct);
router.post('/products/bulk-upload', uploadSingle('file'), bulkUploadProducts);

// Frame Sizes
router.post('/frame-sizes', createFrameSize);
router.put('/frame-sizes/:id', updateFrameSize);
router.delete('/frame-sizes/:id', deleteFrameSize);

// Lens Types
router.post('/lens-types', createLensType);
router.put('/lens-types/:id', updateLensType);
router.delete('/lens-types/:id', deleteLensType);

// Lens Coatings
router.post('/lens-coatings', createLensCoating);
router.put('/lens-coatings/:id', updateLensCoating);
router.delete('/lens-coatings/:id', deleteLensCoating);

// Orders
router.get('/orders', getAllOrdersAdmin);
router.get('/orders/:id', getAdminOrderDetail);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

// Categories
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;

