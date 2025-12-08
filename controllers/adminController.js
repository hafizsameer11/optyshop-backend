const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { uploadToS3, deleteFromS3 } = require('../config/aws');
const csv = require('csv-parser');
const { Readable } = require('stream');

// ==================== DASHBOARD ====================

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const rangeDays = parseInt(req.query.range || req.query.range_days || 30, 10);
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - rangeDays);
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - rangeDays);

  const lastYearStart = new Date(now);
  lastYearStart.setMonth(now.getMonth() - 11);
  lastYearStart.setDate(1);

  const growthRate = (current, previous) => {
    if (!previous || previous === 0) return null;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  };

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    paidOrdersCurrent,
    paidOrdersPrevious,
    ordersByStatus,
    recentOrders,
    paidOrdersLastYear,
    lensOrderItems,
    topSellingGroups,
    productBasics,
    totalRevenueAggregate,
    prescriptionAverages,
    prescriptionsForTrend,
    pendingCustomizations
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: {
        payment_status: 'paid',
        created_at: { gte: currentPeriodStart }
      },
      select: { total: true }
    }),
    prisma.order.findMany({
      where: {
        payment_status: 'paid',
        created_at: { gte: previousPeriodStart, lt: currentPeriodStart }
      },
      select: { total: true }
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.order.findMany({
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
    }),
    prisma.order.findMany({
      where: {
        payment_status: 'paid',
        created_at: { gte: lastYearStart }
      },
      select: {
        total: true,
        created_at: true
      }
    }),
    prisma.orderItem.findMany({
      where: {
        order: { payment_status: 'paid' },
        product: { lens_type: { not: null } }
      },
      select: {
        quantity: true,
        product: { select: { lens_type: true } }
      }
    }),
    prisma.orderItem.groupBy({
      by: ['product_id'],
      where: { order: { payment_status: 'paid' } },
      _sum: { total_price: true, quantity: true },
      orderBy: { _sum: { total_price: 'desc' } },
      take: 4
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        lens_type: true
      }
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { payment_status: 'paid' }
    }),
    prisma.prescription.aggregate({
      _avg: {
        pd_binocular: true,
        ph_od: true,
        ph_os: true
      }
    }),
    prisma.prescription.findMany({
      where: { created_at: { gte: lastYearStart } },
      select: {
        created_at: true,
        pd_binocular: true,
        ph_od: true,
        ph_os: true
      }
    }),
    prisma.orderItem.count({
      where: {
        customization: { not: null },
        order: { status: 'pending' }
      }
    })
  ]);

  const revenueCurrent = paidOrdersCurrent.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const revenuePrevious = paidOrdersPrevious.reduce((sum, order) => sum + parseFloat(order.total), 0);
  const totalRevenue = totalRevenueAggregate._sum.total
    ? parseFloat(totalRevenueAggregate._sum.total.toFixed(2))
    : 0;

  const monthlyRevenue = Array(12).fill(0);
  paidOrdersLastYear.forEach(order => {
    const monthDiff = (now.getFullYear() - order.created_at.getFullYear()) * 12 +
      (now.getMonth() - order.created_at.getMonth());
    if (monthDiff >= 0 && monthDiff < 12) {
      const index = 11 - monthDiff; // oldest at 0, newest at 11
      monthlyRevenue[index] += parseFloat(order.total);
    }
  });

  const lensTypeDistribution = lensOrderItems.reduce((acc, item) => {
    const lensType = item.product?.lens_type || 'unknown';
    if (!acc[lensType]) acc[lensType] = { lensType, orders: 0, quantity: 0 };
    acc[lensType].orders += 1;
    acc[lensType].quantity += item.quantity || 0;
    return acc;
  }, {});

  const topLensType = Object.values(lensTypeDistribution).sort((a, b) => b.orders - a.orders)[0] || null;

  const productMap = productBasics.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

  const topSellingFrames = topSellingGroups.map(group => ({
    product_id: group.product_id,
    name: productMap[group.product_id]?.name || undefined,
    lens_type: productMap[group.product_id]?.lens_type || null,
    revenue: parseFloat(group._sum.total_price || 0),
    quantity: group._sum.quantity || 0
  }));

  const pdAverage = prescriptionAverages._avg.pd_binocular
    ? parseFloat(prescriptionAverages._avg.pd_binocular.toFixed(2))
    : null;
  const phAverageRaw = [];
  if (prescriptionAverages._avg.ph_od !== null) phAverageRaw.push(prescriptionAverages._avg.ph_od);
  if (prescriptionAverages._avg.ph_os !== null) phAverageRaw.push(prescriptionAverages._avg.ph_os);
  const hpAverage = phAverageRaw.length
    ? parseFloat(
        (phAverageRaw.reduce((s, v) => s + parseFloat(v), 0) / phAverageRaw.length).toFixed(2)
      )
    : null;

  const pdHpTrend = Array(12).fill(null).map((_, idx) => {
    const date = new Date(lastYearStart);
    date.setMonth(lastYearStart.getMonth() + idx);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    return { month: key, pdTotal: 0, pdCount: 0, hpTotal: 0, hpCount: 0 };
  });

  prescriptionsForTrend.forEach(item => {
    const monthDiff = (item.created_at.getFullYear() - lastYearStart.getFullYear()) * 12 +
      (item.created_at.getMonth() - lastYearStart.getMonth());
    if (monthDiff >= 0 && monthDiff < 12) {
      const bucket = pdHpTrend[monthDiff];
      const pd = item.pd_binocular ? parseFloat(item.pd_binocular) : null;
      const hpVals = [];
      if (item.ph_od !== null) hpVals.push(parseFloat(item.ph_od));
      if (item.ph_os !== null) hpVals.push(parseFloat(item.ph_os));
      const hp = hpVals.length ? hpVals.reduce((s, v) => s + v, 0) / hpVals.length : null;

      if (pd !== null) {
        bucket.pdTotal += pd;
        bucket.pdCount += 1;
      }
      if (hp !== null) {
        bucket.hpTotal += hp;
        bucket.hpCount += 1;
      }
    }
  });

  const stats = {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    ordersByStatus: ordersByStatus.map(item => ({
      status: item.status,
      count: item._count.id
    })),
    recentOrders,
    cards: {
      orders: {
        value: paidOrdersCurrent.length,
        growth: growthRate(paidOrdersCurrent.length, paidOrdersPrevious.length)
      },
      revenue: {
        value: parseFloat(revenueCurrent.toFixed(2)),
        growth: growthRate(revenueCurrent, revenuePrevious)
      },
      average_pd: pdAverage,
      average_hp: hpAverage,
      top_lens_type: topLensType,
      total_users: totalUsers,
      pending_customizations: pendingCustomizations
    },
    revenueAnalytics: {
      months: monthlyRevenue.map((value, idx) => {
        const date = new Date(lastYearStart);
        date.setMonth(lastYearStart.getMonth() + idx);
        return {
          month: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
          revenue: parseFloat(value.toFixed(2))
        };
      })
    },
    ordersOverview: ordersByStatus.map(item => ({
      status: item.status,
      count: item._count.id
    })),
    lensTypeDistribution: Object.values(lensTypeDistribution),
    pdHpAnalytics: {
      average_pd: pdAverage,
      average_hp: hpAverage,
      trend: pdHpTrend.map(entry => ({
        month: entry.month,
        pd: entry.pdCount ? parseFloat((entry.pdTotal / entry.pdCount).toFixed(2)) : null,
        hp: entry.hpCount ? parseFloat((entry.hpTotal / entry.hpCount).toFixed(2)) : null,
        samples: Math.max(entry.pdCount, entry.hpCount)
      }))
    },
    topSellingFrames: topSellingFrames,
    pendingCustomizations
  };

  return success(res, 'Dashboard stats retrieved', { stats });
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

  // Handle 3D model upload
  if (req.files && req.files.model_3d) {
    const url = await uploadToS3(req.files.model_3d[0], 'products/models');
    productData.model_3d_url = url;
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

  // Handle variants
  let variantsData = [];
  if (productData.variants) {
    try {
      variantsData = typeof productData.variants === 'string'
        ? JSON.parse(productData.variants)
        : productData.variants;
      delete productData.variants;
    } catch (e) {
      console.error('Error parsing variants:', e);
    }
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      variants: {
        create: variantsData
      }
    }
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

  // Handle 3D model upload
  if (req.files && req.files.model_3d) {
    const url = await uploadToS3(req.files.model_3d[0], 'products/models');
    productData.model_3d_url = url;
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

// @desc    Get all orders (Admin) with filters
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    payment_status,
    search,
    start_date,
    end_date
  } = req.query;

  const skip = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (payment_status) where.payment_status = payment_status;

  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) where.created_at.gte = new Date(start_date);
    if (end_date) {
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);
      where.created_at.lte = end;
    }
  }

  if (search) {
    where.OR = [
      { order_number: { contains: search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      }
    ];
  }

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
        },
        _count: {
          select: { items: true }
        }
      },
      take: parseInt(limit, 10),
      skip: parseInt(skip, 10),
      orderBy: { created_at: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  return success(res, 'Orders retrieved successfully', {
    orders,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single order (Admin)
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
exports.getOrderDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              lens_type: true,
              frame_material: true,
              frame_shape: true
            }
          }
        }
      },
      prescription: true
    }
  });

  if (!order) {
    return error(res, 'Order not found', 404);
  }

  return success(res, 'Order retrieved successfully', { order });
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

// ==================== FRAME SIZES ====================

// @desc    Create frame size (Admin)
// @route   POST /api/admin/frame-sizes
// @access  Private/Admin
exports.createFrameSize = asyncHandler(async (req, res) => {
  const frameSize = await prisma.frameSize.create({
    data: req.body
  });
  return success(res, 'Frame size created successfully', { frameSize }, 201);
});

// @desc    Update frame size (Admin)
// @route   PUT /api/admin/frame-sizes/:id
// @access  Private/Admin
exports.updateFrameSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const frameSize = await prisma.frameSize.update({
    where: { id: parseInt(id) },
    data: req.body
  });
  return success(res, 'Frame size updated successfully', { frameSize });
});

// @desc    Delete frame size (Admin)
// @route   DELETE /api/admin/frame-sizes/:id
// @access  Private/Admin
exports.deleteFrameSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.frameSize.delete({ where: { id: parseInt(id) } });
  return success(res, 'Frame size deleted successfully');
});

// ==================== LENS TYPES ====================

// @desc    Create lens type (Admin)
// @route   POST /api/admin/lens-types
// @access  Private/Admin
exports.createLensType = asyncHandler(async (req, res) => {
  const lensTypeData = { ...req.body };

  if (!lensTypeData.slug) {
    lensTypeData.slug = lensTypeData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const lensType = await prisma.lensType.create({
    data: lensTypeData
  });
  return success(res, 'Lens type created successfully', { lensType }, 201);
});

// @desc    Update lens type (Admin)
// @route   PUT /api/admin/lens-types/:id
// @access  Private/Admin
exports.updateLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lensType = await prisma.lensType.update({
    where: { id: parseInt(id) },
    data: req.body
  });
  return success(res, 'Lens type updated successfully', { lensType });
});

// @desc    Delete lens type (Admin)
// @route   DELETE /api/admin/lens-types/:id
// @access  Private/Admin
exports.deleteLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.lensType.delete({ where: { id: parseInt(id) } });
  return success(res, 'Lens type deleted successfully');
});

// ==================== LENS COATINGS ====================

// @desc    Create lens coating (Admin)
// @route   POST /api/admin/lens-coatings
// @access  Private/Admin
exports.createLensCoating = asyncHandler(async (req, res) => {
  const coatingData = { ...req.body };

  if (!coatingData.slug) {
    coatingData.slug = coatingData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const lensCoating = await prisma.lensCoating.create({
    data: coatingData
  });
  return success(res, 'Lens coating created successfully', { lensCoating }, 201);
});

// @desc    Update lens coating (Admin)
// @route   PUT /api/admin/lens-coatings/:id
// @access  Private/Admin
exports.updateLensCoating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lensCoating = await prisma.lensCoating.update({
    where: { id: parseInt(id) },
    data: req.body
  });
  return success(res, 'Lens coating updated successfully', { lensCoating });
});

// @desc    Delete lens coating (Admin)
// @route   DELETE /api/admin/lens-coatings/:id
// @access  Private/Admin
exports.deleteLensCoating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.lensCoating.delete({ where: { id: parseInt(id) } });
  return success(res, 'Lens coating deleted successfully');
});

// ==================== BULK UPLOAD ====================

// @desc    Bulk upload products (Admin)
// @route   POST /api/admin/products/bulk-upload
// @access  Private/Admin
exports.bulkUploadProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, 'Please upload a CSV file', 400);
  }

  const results = [];
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const createdProducts = [];
        for (const item of results) {
          // Basic validation and transformation
          if (!item.name || !item.sku) continue;

          const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

          // Check if product exists
          const existing = await prisma.product.findFirst({
            where: { OR: [{ sku: item.sku }, { slug }] }
          });

          if (existing) continue; // Skip duplicates for now

          const product = await prisma.product.create({
            data: {
              name: item.name,
              slug,
              sku: item.sku,
              description: item.description,
              price: parseFloat(item.price || 0),
              category_id: parseInt(item.category_id || 1), // Default to 1 if missing
              stock_quantity: parseInt(item.stock_quantity || 0),
              product_type: item.product_type || 'frame',
              gender: item.gender || 'unisex'
            }
          });
          createdProducts.push(product);
        }

        return success(res, `Processed ${results.length} items. Created ${createdProducts.length} products.`, {
          count: createdProducts.length
        });
      } catch (err) {
        console.error('Bulk upload error:', err);
        return error(res, 'Error processing bulk upload', 500);
      }
    });
});

