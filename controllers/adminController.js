const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { uploadToS3, deleteFromS3 } = require('../config/aws');

// ==================== DASHBOARD ====================

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, paidOrders] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: { payment_status: 'paid' },
      select: { total: true }
    })
  ]);

  const totalRevenue = paidOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { created_at: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true
        }
      }
    }
  });

  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  return success(res, 'Dashboard stats retrieved', {
    stats: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      recentOrders
    }
  });
});

// ==================== PRODUCTS ====================

// @desc    Create product (Admin)
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body };

  // Handle image uploads if present
  if (req.files && req.files.images) {
    const imageUrls = [];
    for (const file of req.files.images) {
      const url = await uploadToS3(file, 'products');
      imageUrls.push(url);
    }
    productData.images = imageUrls;
  }

  // Generate slug if not provided
  if (!productData.slug) {
    productData.slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Convert price to Decimal
  if (productData.price) {
    productData.price = parseFloat(productData.price);
  }
  if (productData.compare_at_price) {
    productData.compare_at_price = parseFloat(productData.compare_at_price);
  }
  if (productData.cost_price) {
    productData.cost_price = parseFloat(productData.cost_price);
  }

  const product = await prisma.product.create({
    data: productData
  });

  return success(res, 'Product created successfully', { product }, 201);
});

// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productData = { ...req.body };

  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
  if (!product) {
    return error(res, 'Product not found', 404);
  }

  // Handle image uploads
  if (req.files && req.files.images) {
    const imageUrls = Array.isArray(product.images) ? [...product.images] : [];
    for (const file of req.files.images) {
      const url = await uploadToS3(file, 'products');
      imageUrls.push(url);
    }
    productData.images = imageUrls;
  }

  // Convert price to Decimal if provided
  if (productData.price) {
    productData.price = parseFloat(productData.price);
  }
  if (productData.compare_at_price) {
    productData.compare_at_price = parseFloat(productData.compare_at_price);
  }
  if (productData.cost_price) {
    productData.cost_price = parseFloat(productData.cost_price);
  }

  const updatedProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: productData
  });

  return success(res, 'Product updated successfully', { product: updatedProduct });
});

// @desc    Delete product (Admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
  if (!product) {
    return error(res, 'Product not found', 404);
  }

  // Delete images from S3
  if (product.images && Array.isArray(product.images)) {
    for (const imageUrl of product.images) {
      try {
        const key = imageUrl.split('.com/')[1];
        await deleteFromS3(key);
      } catch (err) {
        console.error('Error deleting image from S3:', err);
      }
    }
  }

  await prisma.product.delete({ where: { id: parseInt(id) } });

  return success(res, 'Product deleted successfully');
});

// ==================== ORDERS ====================

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, payment_status } = req.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (payment_status) where.payment_status = payment_status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { created_at: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  return success(res, 'Orders retrieved successfully', {
    orders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// ==================== USERS ====================

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { first_name: { contains: search } },
      { last_name: { contains: search } },
      { email: { contains: search } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        is_active: true,
        email_verified: true,
        avatar: true,
        created_at: true,
        updated_at: true
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { created_at: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  return success(res, 'Users retrieved successfully', {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!user) {
    return error(res, 'User not found', 404);
  }

  const updateData = {};
  if (req.body.role) updateData.role = req.body.role;
  if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;
  if (req.body.email_verified !== undefined) updateData.email_verified = req.body.email_verified;

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      phone: true,
      role: true,
      is_active: true,
      email_verified: true,
      avatar: true,
      created_at: true,
      updated_at: true
    }
  });

  return success(res, 'User updated successfully', { user: updatedUser });
});

// ==================== CATEGORIES ====================

// @desc    Create category (Admin)
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const categoryData = { ...req.body };

  if (!categoryData.slug) {
    categoryData.slug = categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const category = await prisma.category.create({
    data: categoryData
  });

  return success(res, 'Category created successfully', { category }, 201);
});

// @desc    Update category (Admin)
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });
  if (!category) {
    return error(res, 'Category not found', 404);
  }

  const updatedCategory = await prisma.category.update({
    where: { id: parseInt(id) },
    data: req.body
  });

  return success(res, 'Category updated successfully', { category: updatedCategory });
});

// @desc    Delete category (Admin)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });
  if (!category) {
    return error(res, 'Category not found', 404);
  }

  await prisma.category.delete({ where: { id: parseInt(id) } });

  return success(res, 'Category deleted successfully');
});
