const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { success, error } = require("../utils/response");
const { uploadToS3, deleteFromS3 } = require("../config/aws");
const csv = require("csv-parser");
const { Readable } = require("stream");
const bcrypt = require('bcryptjs');

// ==================== DASHBOARD ====================

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getAllSubCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, category_id, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (category_id) where.category_id = parseInt(category_id);
  if (search) where.name = { contains: search };

  const [subcategories, total] = await Promise.all([
    prisma.subCategory.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true }
        },
        parent: {
          select: { id: true, name: true }
        },
        children: {
          select: { id: true, name: true, slug: true, image: true, is_active: true }
        }
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { sort_order: 'asc' }
    }),
    prisma.subCategory.count({ where })
  ]);

  return success(res, "Subcategories retrieved successfully", {
    subcategories,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single subcategory (Admin)
// @route   GET /api/admin/subcategories/:id
// @access  Private/Admin
exports.getSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subcategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      parent: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          is_active: true,
          sort_order: true
        },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  if (!subcategory) {
    return error(res, "Subcategory not found", 404);
  }

  return success(res, "Subcategory retrieved successfully", { subcategory });
});

exports.createSubCategory = asyncHandler(async (req, res) => {
  const { name, category_id, description, is_active, sort_order, parent_id } = req.body;

  if (!name || !category_id) {
    return error(res, "Name and Category ID are required", 400);
  }

  const categoryId = parseInt(category_id, 10);
  if (isNaN(categoryId)) {
    return error(res, "Invalid Category ID", 400);
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  });
  if (!category) {
    return error(res, `Category with ID ${categoryId} not found. Please create the category first.`, 404);
  }
  
  console.log(`✅ Category found: ${category.name} (ID: ${categoryId})`);

  // Generate slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Check if subcategory with same slug exists
  const existing = await prisma.subCategory.findUnique({ where: { slug } });
  if (existing) {
    return error(res, "Subcategory with this name already exists", 400);
  }

  let imageUrl = null;
  if (req.file) {
    imageUrl = await uploadToS3(req.file, "subcategories");
  }

  // Double-check category exists right before create (defensive check)
  const categoryExists = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true }
  });
  
  if (!categoryExists) {
    return error(res, `Category with ID ${categoryId} does not exist in the database. Please create the category first.`, 404);
  }

  try {
    const subcategory = await prisma.subCategory.create({
      data: {
        name,
        slug,
        category_id: categoryId,
        parent_id: parent_id ? parseInt(parent_id, 10) : null,
        description,
        is_active: is_active === 'true' || is_active === true,
        sort_order: parseInt(sort_order, 10) || 0,
        image: imageUrl
      }
    });

    return success(res, "Subcategory created successfully", { subcategory }, 201);
  } catch (createError) {
    console.error('❌ Subcategory creation error:', createError);
    
    // Check if it's a foreign key constraint error
    if (createError.code === 'P2003' || createError.message?.includes('Foreign key constraint')) {
      // One more verification - maybe category was deleted between checks?
      const categoryCheck = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true }
      });
      
      if (!categoryCheck) {
        return error(res, `Category with ID ${categoryId} was not found. The category may have been deleted.`, 404);
      }
      
      return error(res, `Failed to create subcategory. Foreign key constraint violation. Please ensure category ID ${categoryId} exists and try again.`, 400);
    }
    
    // Re-throw other errors to be handled by asyncHandler
    throw createError;
  }
});

exports.updateSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category_id, description, is_active, sort_order, slug: newSlug, parent_id } = req.body;

  const subcategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(id) }
  });

  if (!subcategory) {
    return error(res, "Subcategory not found", 404);
  }

  const data = {};
  if (name) {
    data.name = name;
  }

  if (newSlug && newSlug !== subcategory.slug) {
    const existing = await prisma.subCategory.findUnique({ where: { slug: newSlug } });
    if (existing) return error(res, "Slug already in use", 400);
    data.slug = newSlug;
  }

  if (category_id) {
    const categoryId = parseInt(category_id, 10);
    if (isNaN(categoryId)) {
      return error(res, "Invalid Category ID", 400);
    }
    
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category) {
      return error(res, `Category with ID ${categoryId} not found`, 404);
    }
    
    data.category_id = categoryId;
  }

  // Handle parent_id with cycle check
  if (parent_id !== undefined) {
    if (parent_id === 'null' || parent_id === null) {
      data.parent_id = null;
    } else {
      const pid = parseInt(parent_id);
      if (pid === parseInt(id)) {
        return error(res, "Cannot set parent category to itself", 400);
      }
      data.parent_id = pid;
    }
  }

  if (description !== undefined) data.description = description;
  if (is_active !== undefined) data.is_active = is_active === 'true' || is_active === true;
  if (sort_order !== undefined) data.sort_order = parseInt(sort_order);

  if (req.file) {
    if (subcategory.image) {
      await deleteFromS3(subcategory.image);
    }
    data.image = await uploadToS3(req.file, "subcategories");
  }

  const updatedSubCategory = await prisma.subCategory.update({
    where: { id: parseInt(id) },
    data
  });

  return success(res, "Subcategory updated successfully", { subcategory: updatedSubCategory });
});

exports.deleteSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subcategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(id) }
  });

  if (!subcategory) {
    return error(res, "Subcategory not found", 404);
  }

  if (subcategory.image) {
    await deleteFromS3(subcategory.image);
  }

  await prisma.subCategory.delete({
    where: { id: parseInt(id) }
  });

  return success(res, "Subcategory deleted successfully");
});

// @desc    Get dashboard statistics
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
    pendingCustomizations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: {
        payment_status: "paid",
        created_at: { gte: currentPeriodStart },
      },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: {
        payment_status: "paid",
        created_at: { gte: previousPeriodStart, lt: currentPeriodStart },
      },
      select: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      where: {
        payment_status: "paid",
        created_at: { gte: lastYearStart },
      },
      select: {
        total: true,
        created_at: true,
      },
    }),
    prisma.orderItem.findMany({
      where: {
        order: { payment_status: "paid" },
        product: { lens_type: { not: null } },
      },
      select: {
        quantity: true,
        product: { select: { lens_type: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["product_id"],
      where: { order: { payment_status: "paid" } },
      _sum: { total_price: true, quantity: true },
      orderBy: { _sum: { total_price: "desc" } },
      take: 4,
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        lens_type: true,
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { payment_status: "paid" },
    }),
    prisma.prescription.aggregate({
      _avg: {
        pd_binocular: true,
        ph_od: true,
        ph_os: true,
      },
    }),
    prisma.prescription.findMany({
      where: { created_at: { gte: lastYearStart } },
      select: {
        created_at: true,
        pd_binocular: true,
        ph_od: true,
        ph_os: true,
      },
    }),
    prisma.orderItem.count({
      where: {
        customization: { not: null },
        order: { status: "pending" },
      },
    }),
  ]);

  const revenueCurrent = paidOrdersCurrent.reduce(
    (sum, order) => sum + parseFloat(order.total),
    0
  );
  const revenuePrevious = paidOrdersPrevious.reduce(
    (sum, order) => sum + parseFloat(order.total),
    0
  );
  const totalRevenue = totalRevenueAggregate._sum.total
    ? parseFloat(totalRevenueAggregate._sum.total.toFixed(2))
    : 0;

  const monthlyRevenue = Array(12).fill(0);
  paidOrdersLastYear.forEach((order) => {
    const monthDiff =
      (now.getFullYear() - order.created_at.getFullYear()) * 12 +
      (now.getMonth() - order.created_at.getMonth());
    if (monthDiff >= 0 && monthDiff < 12) {
      const index = 11 - monthDiff; // oldest at 0, newest at 11
      monthlyRevenue[index] += parseFloat(order.total);
    }
  });

  const lensTypeDistribution = lensOrderItems.reduce((acc, item) => {
    const lensType = item.product?.lens_type || "unknown";
    if (!acc[lensType]) acc[lensType] = { lensType, orders: 0, quantity: 0 };
    acc[lensType].orders += 1;
    acc[lensType].quantity += item.quantity || 0;
    return acc;
  }, {});

  const topLensType =
    Object.values(lensTypeDistribution).sort(
      (a, b) => b.orders - a.orders
    )[0] || null;

  const productMap = productBasics.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

  const topSellingFrames = topSellingGroups.map((group) => ({
    product_id: group.product_id,
    name: productMap[group.product_id]?.name || undefined,
    lens_type: productMap[group.product_id]?.lens_type || null,
    revenue: parseFloat(group._sum.total_price || 0),
    quantity: group._sum.quantity || 0,
  }));

  const pdAverage = prescriptionAverages._avg.pd_binocular
    ? parseFloat(prescriptionAverages._avg.pd_binocular.toFixed(2))
    : null;
  const phAverageRaw = [];
  if (prescriptionAverages._avg.ph_od !== null)
    phAverageRaw.push(prescriptionAverages._avg.ph_od);
  if (prescriptionAverages._avg.ph_os !== null)
    phAverageRaw.push(prescriptionAverages._avg.ph_os);
  const hpAverage = phAverageRaw.length
    ? parseFloat(
      (
        phAverageRaw.reduce((s, v) => s + parseFloat(v), 0) /
        phAverageRaw.length
      ).toFixed(2)
    )
    : null;

  const pdHpTrend = Array(12)
    .fill(null)
    .map((_, idx) => {
      const date = new Date(lastYearStart);
      date.setMonth(lastYearStart.getMonth() + idx);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      return { month: key, pdTotal: 0, pdCount: 0, hpTotal: 0, hpCount: 0 };
    });

  prescriptionsForTrend.forEach((item) => {
    const monthDiff =
      (item.created_at.getFullYear() - lastYearStart.getFullYear()) * 12 +
      (item.created_at.getMonth() - lastYearStart.getMonth());
    if (monthDiff >= 0 && monthDiff < 12) {
      const bucket = pdHpTrend[monthDiff];
      const pd = item.pd_binocular ? parseFloat(item.pd_binocular) : null;
      const hpVals = [];
      if (item.ph_od !== null) hpVals.push(parseFloat(item.ph_od));
      if (item.ph_os !== null) hpVals.push(parseFloat(item.ph_os));
      const hp = hpVals.length
        ? hpVals.reduce((s, v) => s + v, 0) / hpVals.length
        : null;

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
    ordersByStatus: ordersByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    })),
    recentOrders,
    cards: {
      orders: {
        value: paidOrdersCurrent.length,
        growth: growthRate(paidOrdersCurrent.length, paidOrdersPrevious.length),
      },
      revenue: {
        value: parseFloat(revenueCurrent.toFixed(2)),
        growth: growthRate(revenueCurrent, revenuePrevious),
      },
      average_pd: pdAverage,
      average_hp: hpAverage,
      top_lens_type: topLensType,
      total_users: totalUsers,
      pending_customizations: pendingCustomizations,
    },
    revenueAnalytics: {
      months: monthlyRevenue.map((value, idx) => {
        const date = new Date(lastYearStart);
        date.setMonth(lastYearStart.getMonth() + idx);
        return {
          month: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`,
          revenue: parseFloat(value.toFixed(2)),
        };
      }),
    },
    ordersOverview: ordersByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    })),
    lensTypeDistribution: Object.values(lensTypeDistribution),
    pdHpAnalytics: {
      average_pd: pdAverage,
      average_hp: hpAverage,
      trend: pdHpTrend.map((entry) => ({
        month: entry.month,
        pd: entry.pdCount
          ? parseFloat((entry.pdTotal / entry.pdCount).toFixed(2))
          : null,
        hp: entry.hpCount
          ? parseFloat((entry.hpTotal / entry.hpCount).toFixed(2))
          : null,
        samples: Math.max(entry.pdCount, entry.hpCount),
      })),
    },
    topSellingFrames: topSellingFrames,
    pendingCustomizations,
  };

  return success(res, "Dashboard stats retrieved", { stats });
});

// ==================== PRODUCTS ====================

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search,
    category_id,
    sub_category_id,
    is_active,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    const searchTerm = search.trim(); // Remove leading/trailing spaces
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { not: null, contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
  }

  if (category_id) {
    where.category_id = parseInt(category_id);
  }

  if (sub_category_id) {
    where.sub_category_id = parseInt(sub_category_id);
  }


  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  // Validate sortBy field - only allow valid product fields
  const validSortFields = [
    'id', 'name', 'slug', 'sku', 'price', 'stock_quantity',
    'created_at', 'updated_at', 'rating', 'view_count',
    'is_active', 'is_featured', 'category_id'
  ];
  const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase())
    ? sortOrder.toLowerCase()
    : 'desc';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        subCategory: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      take: parseInt(limit),
      skip: skip,
      orderBy: { [validSortBy]: validSortOrder }
    }),
    prisma.product.count({ where })
  ]);

  // Ensure images are properly formatted (handle JSON strings)
  const formattedProducts = products.map(product => {
    let images = product.images;

    // Parse images if it's a JSON string
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        console.error(`Error parsing images for product ${product.id}:`, e);
        images = [];
      }
    }

    // Ensure images is an array
    if (!Array.isArray(images)) {
      images = images ? [images] : [];
    }

    // Get first image URL for easy access in frontend
    const firstImage = images && images.length > 0 ? images[0] : null;

    return {
      ...product,
      images,
      // Add first image URL for easy access in frontend
      image: firstImage,
      // Also add thumbnail for backward compatibility
      thumbnail: firstImage
    };
  });

  return success(res, "Products retrieved successfully", {
    products: formattedProducts,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single product (Admin)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
exports.getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: true,
      subCategory: true,
      variants: true,
      frameSizes: true,
      lensTypes: {
        include: {
          lensType: true
        }
      },
      lensCoatings: {
        include: {
          lensCoating: true
        }
      }
    }
  });

  if (!product) {
    return error(res, "Product not found", 404);
  }

  // Format images - parse JSON string to array
  let images = product.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = [];
    }
  }
  if (!Array.isArray(images)) {
    images = images ? [images] : [];
  }

  const formattedProduct = {
    ...product,
    images,
    image: images && images.length > 0 ? images[0] : null
  };

  return success(res, "Product retrieved successfully", { product: formattedProduct });
});

// @desc    Create product (Admin)
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
  try {
    console.log('📦 Creating product - Request received');
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

    const productData = { ...req.body };

    // Handle image uploads if present
    if (req.files && req.files.images) {
      try {
        const imageUrls = [];
        for (const file of req.files.images) {
          const url = await uploadToS3(file, "products");
          imageUrls.push(url);
        }
        productData.images = imageUrls;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return error(res, `Image upload failed: ${uploadError.message}`, 500);
      }
    }

    // Handle 3D model upload
    if (req.files && req.files.model_3d) {
      try {
        const url = await uploadToS3(req.files.model_3d[0], "products/models");
        productData.model_3d_url = url;
      } catch (uploadError) {
        console.error("3D model upload error:", uploadError);
        return error(res, `3D model upload failed: ${uploadError.message}`, 500);
      }
    }

    // Generate slug if not provided, ensuring uniqueness
    if (!productData.slug) {
      let baseSlug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check if slug exists and make it unique if needed
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await prisma.product.findUnique({
          where: { slug },
          select: { id: true }
        });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      productData.slug = slug;
    } else {
      // If slug is provided, check if it's unique
      const existing = await prisma.product.findUnique({
        where: { slug: productData.slug },
        select: { id: true }
      });
      if (existing) {
        return error(res, `A product with slug "${productData.slug}" already exists. Please use a different slug.`, 400);
      }
    }

    // Check if SKU already exists
    if (productData.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: productData.sku },
        select: { id: true }
      });
      if (existingSku) {
        return error(res, `A product with SKU "${productData.sku}" already exists. SKU must be unique.`, 400);
      }
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

    // Convert stock_quantity to Int
    if (productData.stock_quantity !== undefined) {
      productData.stock_quantity = parseInt(productData.stock_quantity, 10) || 0;
    }

    // Convert boolean fields from strings
    if (productData.is_active !== undefined) {
      productData.is_active = productData.is_active === 'true' || productData.is_active === true || productData.is_active === '1' || productData.is_active === 1;
    }
    if (productData.is_featured !== undefined) {
      productData.is_featured = productData.is_featured === 'true' || productData.is_featured === true || productData.is_featured === '1' || productData.is_featured === 1;
    }
    // Validate and parse category_id
    if (!productData.category_id) {
      return error(res, "Category ID is required", 400);
    }
    productData.category_id = parseInt(productData.category_id, 10);
    if (isNaN(productData.category_id)) {
      return error(res, "Invalid category ID", 400);
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: productData.category_id },
    });
    if (!category) {
      return error(res, `Category with ID ${productData.category_id} not found`, 404);
    }

    // Validate sub_category_id if provided
    if (productData.sub_category_id) {
      productData.sub_category_id = parseInt(productData.sub_category_id, 10);
      if (isNaN(productData.sub_category_id)) {
        return error(res, "Invalid sub_category_id", 400);
      }
      // Verify subcategory exists and belongs to category
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: productData.sub_category_id }
      });
      if (!subCategory) {
        return error(res, `SubCategory with ID ${productData.sub_category_id} not found`, 404);
      }
      if (subCategory.category_id !== productData.category_id) {
        return error(res, "SubCategory does not belong to the selected Category", 400);
      }
    }


    // Validate and normalize product_type enum
    const validProductTypes = ['frame', 'sunglasses', 'contact_lens', 'accessory'];
    if (productData.product_type !== undefined) {
      const productType = String(productData.product_type).toLowerCase().trim();

      // Map common invalid values to valid ones
      const productTypeMap = {
        'lens': 'contact_lens',
        'lenses': 'contact_lens',
        'contact': 'contact_lens',
        'glasses': 'frame',
        'eyeglass': 'frame',
        'eyeglasses': 'frame',
        'sunglass': 'sunglasses',
        'accessories': 'accessory'
      };

      const normalizedType = productTypeMap[productType] || productType;

      if (!validProductTypes.includes(normalizedType)) {
        return error(res, `Invalid product_type "${productData.product_type}". Valid values are: ${validProductTypes.join(', ')}`, 400);
      }

      productData.product_type = normalizedType;
    } else {
      // Default to 'frame' if not provided
      productData.product_type = 'frame';
    }

    // Validate and normalize stock_status enum
    if (productData.stock_status !== undefined) {
      const validStockStatuses = ['in_stock', 'out_of_stock', 'backorder'];
      const stockStatus = String(productData.stock_status).toLowerCase().trim();

      // Map common invalid values to valid ones
      const stockStatusMap = {
        'on_backorder': 'backorder',
        'back_order': 'backorder',
        'back-order': 'backorder',
        'instock': 'in_stock',
        'in-stock': 'in_stock',
        'in stock': 'in_stock',
        'outofstock': 'out_of_stock',
        'out-of-stock': 'out_of_stock',
        'out of stock': 'out_of_stock'
      };

      const normalizedStatus = stockStatusMap[stockStatus] || stockStatus;

      if (!validStockStatuses.includes(normalizedStatus)) {
        return error(res, `Invalid stock_status "${productData.stock_status}". Valid values are: ${validStockStatuses.join(', ')}`, 400);
      }

      productData.stock_status = normalizedStatus;
    }

    // Validate and normalize gender enum
    if (productData.gender !== undefined) {
      const validGenders = ['men', 'women', 'unisex', 'kids'];
      const gender = String(productData.gender).toLowerCase().trim();

      if (!validGenders.includes(gender)) {
        return error(res, `Invalid gender "${productData.gender}". Valid values are: ${validGenders.join(', ')}`, 400);
      }

      productData.gender = gender;
    }

    // Validate and normalize frame_shape enum
    if (productData.frame_shape !== undefined && productData.frame_shape !== null && productData.frame_shape !== '') {
      const validFrameShapes = ['round', 'square', 'oval', 'cat_eye', 'aviator', 'rectangle', 'wayfarer', 'geometric'];
      const frameShape = String(productData.frame_shape).toLowerCase().trim();

      const frameShapeMap = {
        'cat-eye': 'cat_eye',
        'cat eye': 'cat_eye'
      };

      const normalizedShape = frameShapeMap[frameShape] || frameShape;

      if (!validFrameShapes.includes(normalizedShape)) {
        return error(res, `Invalid frame_shape "${productData.frame_shape}". Valid values are: ${validFrameShapes.join(', ')}`, 400);
      }

      productData.frame_shape = normalizedShape;
    }

    // Validate and normalize frame_material enum
    if (productData.frame_material !== undefined && productData.frame_material !== null && productData.frame_material !== '') {
      const validFrameMaterials = ['acetate', 'metal', 'tr90', 'titanium', 'wood', 'mixed'];
      const frameMaterial = String(productData.frame_material).toLowerCase().trim();

      if (!validFrameMaterials.includes(frameMaterial)) {
        return error(res, `Invalid frame_material "${productData.frame_material}". Valid values are: ${validFrameMaterials.join(', ')}`, 400);
      }

      productData.frame_material = frameMaterial;
    }

    // Validate and normalize lens_type enum (LensTypeEnum)
    if (productData.lens_type !== undefined && productData.lens_type !== null && productData.lens_type !== '') {
      const validLensTypes = ['prescription', 'sunglasses', 'reading', 'computer', 'photochromic'];
      const lensType = String(productData.lens_type).toLowerCase().trim();

      if (!validLensTypes.includes(lensType)) {
        return error(res, `Invalid lens_type "${productData.lens_type}". Valid values are: ${validLensTypes.join(', ')}`, 400);
      }

      productData.lens_type = lensType;
    }

    // Normalize images coming from form-data / JSON
    // Images are stored as JSON string in database, but we work with arrays in code
    let imagesArray = [];

    // If images were uploaded as files, they're already in productData.images as an array
    if (req.files && req.files.images && Array.isArray(productData.images) && productData.images.length > 0) {
      // Images uploaded as files - already set as array in productData.images from S3 uploads
      imagesArray = productData.images;
      console.log('📸 Using uploaded images:', imagesArray);
    } else if (productData.images !== undefined) {
      // Images provided in body (form-data or JSON)
      if (typeof productData.images === "string") {
        if (productData.images.trim() === "") {
          imagesArray = [];
        } else {
          try {
            imagesArray = JSON.parse(productData.images);
          } catch (e) {
            console.error("Error parsing images:", e);
            imagesArray = [];
          }
        }
      } else if (Array.isArray(productData.images)) {
        imagesArray = productData.images;
      } else {
        imagesArray = [];
      }
    }

    // Convert images array to JSON string for database storage
    // Set to null if empty array (Prisma expects String or Null)
    productData.images = imagesArray.length > 0 ? JSON.stringify(imagesArray) : null;
    console.log('💾 Saving images to DB:', productData.images ? `${imagesArray.length} image(s)` : 'null');

    // Handle variants
    let variantsData = [];
    if (productData.variants) {
      try {
        variantsData =
          typeof productData.variants === "string"
            ? JSON.parse(productData.variants)
            : productData.variants;
        delete productData.variants;
      } catch (e) {
        console.error("Error parsing variants:", e);
      }
    }

    // Create the product first
    const product = await prisma.product.create({
      data: productData,
    });

    // Format images - parse JSON string to array for response
    let images = product.images;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        images = [];
      }
    }
    if (!Array.isArray(images)) {
      images = images ? [images] : [];
    }

    const formattedProduct = {
      ...product,
      images,
      image: images && images.length > 0 ? images[0] : null
    };

    // Create variants separately if any exist
    if (variantsData && variantsData.length > 0) {
      await prisma.productVariant.createMany({
        data: variantsData.map((variant) => ({
          ...variant,
          product_id: product.id,
        })),
      });

      // Fetch the product with variants to return
      const productWithVariants = await prisma.product.findUnique({
        where: { id: product.id },
        include: { variants: true },
      });

      // Format images for product with variants
      let variantImages = productWithVariants.images;
      if (typeof variantImages === 'string') {
        try {
          variantImages = JSON.parse(variantImages);
        } catch (e) {
          variantImages = [];
        }
      }
      if (!Array.isArray(variantImages)) {
        variantImages = variantImages ? [variantImages] : [];
      }

      const formattedProductWithVariants = {
        ...productWithVariants,
        images: variantImages,
        image: variantImages && variantImages.length > 0 ? variantImages[0] : null
      };

      return success(res, "Product created successfully", { product: formattedProductWithVariants }, 201);
    }

    return success(res, "Product created successfully", { product: formattedProduct }, 201);
  } catch (err) {
    console.error('❌ Product creation error:', err);
    throw err; // Let asyncHandler catch it
  }
});

// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productData = { ...req.body };

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });
  if (!product) {
    return error(res, "Product not found", 404);
  }

  // Handle image uploads
  if (req.files && req.files.images) {
    // Parse existing images from JSON string to array
    let existingImages = [];
    if (product.images) {
      try {
        existingImages = typeof product.images === 'string'
          ? JSON.parse(product.images)
          : (Array.isArray(product.images) ? product.images : []);
      } catch (e) {
        console.error("Error parsing existing images:", e);
        existingImages = [];
      }
    }

    // Upload new images and add to existing
    const imageUrls = [...existingImages];
    for (const file of req.files.images) {
      const url = await uploadToS3(file, "products");
      imageUrls.push(url);
    }
    productData.images = imageUrls; // Will be converted to JSON string later
  }

  // Handle 3D model upload
  if (req.files && req.files.model_3d) {
    const url = await uploadToS3(req.files.model_3d[0], "products/models");
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

  // Convert stock_quantity to Int (form-data sends as string)
  if (productData.stock_quantity !== undefined) {
    productData.stock_quantity = parseInt(productData.stock_quantity, 10) || 0;
  }

  // Validate and normalize product_type enum if provided
  if (productData.product_type !== undefined) {
    const validProductTypes = ['frame', 'sunglasses', 'contact_lens', 'accessory'];
    const productType = String(productData.product_type).toLowerCase().trim();

    // Map common invalid values to valid ones
    const productTypeMap = {
      'lens': 'contact_lens',
      'lenses': 'contact_lens',
      'contact': 'contact_lens',
      'glasses': 'frame',
      'eyeglass': 'frame',
      'eyeglasses': 'frame',
      'sunglass': 'sunglasses',
      'accessories': 'accessory'
    };

    const normalizedType = productTypeMap[productType] || productType;

    if (!validProductTypes.includes(normalizedType)) {
      return error(res, `Invalid product_type "${productData.product_type}". Valid values are: ${validProductTypes.join(', ')}`, 400);
    }

    productData.product_type = normalizedType;
  }

  // Validate and normalize stock_status enum if provided
  if (productData.stock_status !== undefined) {
    const validStockStatuses = ['in_stock', 'out_of_stock', 'backorder'];
    const stockStatus = String(productData.stock_status).toLowerCase().trim();

    // Map common invalid values to valid ones
    const stockStatusMap = {
      'on_backorder': 'backorder',
      'back_order': 'backorder',
      'back-order': 'backorder',
      'instock': 'in_stock',
      'in-stock': 'in_stock',
      'in stock': 'in_stock',
      'outofstock': 'out_of_stock',
      'out-of-stock': 'out_of_stock',
      'out of stock': 'out_of_stock'
    };

    const normalizedStatus = stockStatusMap[stockStatus] || stockStatus;

    if (!validStockStatuses.includes(normalizedStatus)) {
      return error(res, `Invalid stock_status "${productData.stock_status}". Valid values are: ${validStockStatuses.join(', ')}`, 400);
    }

    productData.stock_status = normalizedStatus;
  }

  // Validate and normalize gender enum if provided
  if (productData.gender !== undefined) {
    const validGenders = ['men', 'women', 'unisex', 'kids'];
    const gender = String(productData.gender).toLowerCase().trim();

    if (!validGenders.includes(gender)) {
      return error(res, `Invalid gender "${productData.gender}". Valid values are: ${validGenders.join(', ')}`, 400);
    }

    productData.gender = gender;
  }

  // Validate and normalize frame_shape enum if provided
  if (productData.frame_shape !== undefined && productData.frame_shape !== null && productData.frame_shape !== '') {
    const validFrameShapes = ['round', 'square', 'oval', 'cat_eye', 'aviator', 'rectangle', 'wayfarer', 'geometric'];
    const frameShape = String(productData.frame_shape).toLowerCase().trim();

    const frameShapeMap = {
      'cat-eye': 'cat_eye',
      'cat eye': 'cat_eye'
    };

    const normalizedShape = frameShapeMap[frameShape] || frameShape;

    if (!validFrameShapes.includes(normalizedShape)) {
      return error(res, `Invalid frame_shape "${productData.frame_shape}". Valid values are: ${validFrameShapes.join(', ')}`, 400);
    }

    productData.frame_shape = normalizedShape;
  }

  // Validate and normalize frame_material enum if provided
  if (productData.frame_material !== undefined && productData.frame_material !== null && productData.frame_material !== '') {
    const validFrameMaterials = ['acetate', 'metal', 'tr90', 'titanium', 'wood', 'mixed'];
    const frameMaterial = String(productData.frame_material).toLowerCase().trim();

    if (!validFrameMaterials.includes(frameMaterial)) {
      return error(res, `Invalid frame_material "${productData.frame_material}". Valid values are: ${validFrameMaterials.join(', ')}`, 400);
    }

    productData.frame_material = frameMaterial;
  }

  // Validate and normalize lens_type enum (LensTypeEnum) if provided
  if (productData.lens_type !== undefined && productData.lens_type !== null && productData.lens_type !== '') {
    const validLensTypes = ['prescription', 'sunglasses', 'reading', 'computer', 'photochromic'];
    const lensType = String(productData.lens_type).toLowerCase().trim();

    if (!validLensTypes.includes(lensType)) {
      return error(res, `Invalid lens_type "${productData.lens_type}". Valid values are: ${validLensTypes.join(', ')}`, 400);
    }

    productData.lens_type = lensType;
  }

  // Convert boolean fields from strings (form-data sends "true"/"false" as strings)
  if (productData.is_active !== undefined) {
    productData.is_active = productData.is_active === 'true' || productData.is_active === true || productData.is_active === '1' || productData.is_active === 1;
  }
  if (productData.is_featured !== undefined) {
    productData.is_featured = productData.is_featured === 'true' || productData.is_featured === true || productData.is_featured === '1' || productData.is_featured === 1;
  }

  // Validate category_id if provided
  if (productData.category_id !== undefined) {
    productData.category_id = parseInt(productData.category_id, 10);
    if (isNaN(productData.category_id)) {
      return error(res, "Invalid category ID", 400);
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: productData.category_id },
    });
    if (!category) {
      return error(res, `Category with ID ${productData.category_id} not found`, 404);
    }
  }

  // Validate sub_category_id if provided
  if (productData.sub_category_id !== undefined) {
    if (productData.sub_category_id === 'null' || productData.sub_category_id === null || productData.sub_category_id === '') {
      productData.sub_category_id = null;
    } else {
      productData.sub_category_id = parseInt(productData.sub_category_id, 10);
      if (isNaN(productData.sub_category_id)) {
        return error(res, "Invalid sub_category_id", 400);
      }
      // Verify subcategory exists
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: productData.sub_category_id }
      });
      if (!subCategory) {
        return error(res, `SubCategory with ID ${productData.sub_category_id} not found`, 404);
      }
      // If getting category_id from update or existing product
      const catId = productData.category_id || product.category_id;
      if (subCategory.category_id !== catId) {
        return error(res, "SubCategory does not belong to the product's Category", 400);
      }
    }
  }
  // Normalize images - convert array to JSON string for database storage
  if (productData.images !== undefined) {
    let imagesArray = [];

    if (Array.isArray(productData.images)) {
      // Already an array (from file uploads or direct array input)
      imagesArray = productData.images;
    } else if (typeof productData.images === "string") {
      if (productData.images.trim() === "") {
        imagesArray = [];
      } else {
        try {
          imagesArray = JSON.parse(productData.images);
        } catch (e) {
          console.error("Error parsing images:", e);
          imagesArray = [];
        }
      }
    }

    // Convert images array to JSON string for database storage
    // Set to null if empty array (Prisma expects String or Null)
    productData.images = imagesArray.length > 0 ? JSON.stringify(imagesArray) : null;
  }

  const updatedProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: productData,
  });

  // Format images - parse JSON string to array for response
  let images = updatedProduct.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = [];
    }
  }
  if (!Array.isArray(images)) {
    images = images ? [images] : [];
  }

  const formattedProduct = {
    ...updatedProduct,
    images,
    image: images && images.length > 0 ? images[0] : null
  };

  return success(res, "Product updated successfully", {
    product: formattedProduct,
  });
});

// @desc    Delete product (Admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });
  if (!product) {
    return error(res, "Product not found", 404);
  }

  // Delete images from S3
  // Parse images from JSON string if needed
  let imagesArray = [];
  if (product.images) {
    if (typeof product.images === 'string') {
      try {
        imagesArray = JSON.parse(product.images);
      } catch (e) {
        console.error("Error parsing images for deletion:", e);
        imagesArray = [];
      }
    } else if (Array.isArray(product.images)) {
      imagesArray = product.images;
    }
  }

  if (imagesArray.length > 0) {
    for (const imageUrl of imagesArray) {
      try {
        const key = imageUrl.split(".com/")[1];
        await deleteFromS3(key);
      } catch (err) {
        console.error("Error deleting image from S3:", err);
      }
    }
  }

  await prisma.product.delete({ where: { id: parseInt(id) } });

  return success(res, "Product deleted successfully");
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
    end_date,
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
      { order_number: { contains: search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      },
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
            email: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      take: parseInt(limit, 10),
      skip: parseInt(skip, 10),
      orderBy: { created_at: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return success(res, "Orders retrieved successfully", {
    orders,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / limit),
    },
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
          phone: true,
        },
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
              frame_shape: true,
            },
          },
        },
      },
      prescription: true,
    },
  });

  if (!order) {
    return error(res, "Order not found", 404);
  }

  return success(res, "Order retrieved successfully", { order });
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
      { email: { contains: search } },
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
        updated_at: true,
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { created_at: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return success(res, "Users retrieved successfully", {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Create user (Admin)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, phone, role } = req.body;

  // 1. Basic validation
  if (!email || !password || !first_name || !last_name) {
    return error(res, "Please provide all required fields", 400);
  }

  // 2. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return error(res, "User already exists with this email", 400);
  }

  // 3. Validate role (only allow known roles)
  const allowedRoles = ["admin", "customer"]; // add more if you have, e.g. "staff"
  let finalRole = role || "admin";

  if (!allowedRoles.includes(finalRole)) {
    return error(res, `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`, 400);
  }

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 5. Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      first_name,
      last_name,
      phone,
      role: finalRole,
      is_active: true,       // usually admin-created users are active
      email_verified: true,  // admin created users are verified by default
    },
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
      updated_at: true,
    },
  });

  return success(res, "User created successfully", { user }, 201);
});


// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!user) {
    return error(res, "User not found", 404);
  }

  const updateData = {};
  if (req.body.role) updateData.role = req.body.role;
  if (req.body.is_active !== undefined)
    updateData.is_active = req.body.is_active;
  if (req.body.email_verified !== undefined)
    updateData.email_verified = req.body.email_verified;

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
      updated_at: true,
    },
  });

  return success(res, "User updated successfully", { user: updatedUser });
});

// ==================== CATEGORIES ====================

// @desc    Get all categories (Admin)
// @route   GET /api/admin/categories
// @access  Private/Admin
exports.getAllCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, is_active, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      take: parseInt(limit),
      skip: skip,
      orderBy: { [sortBy]: sortOrder.toLowerCase() }
    }),
    prisma.category.count({ where })
  ]);

  return success(res, "Categories retrieved successfully", {
    categories,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single category (Admin)
// @route   GET /api/admin/categories/:id
// @access  Private/Admin
exports.getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) }
  });

  if (!category) {
    return error(res, "Category not found", 404);
  }

  return success(res, "Category retrieved successfully", { category });
});

// @desc    Create category (Admin)
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const categoryData = { ...req.body };

  if (!categoryData.slug) {
    categoryData.slug = categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const category = await prisma.category.create({
    data: categoryData,
  });

  return success(res, "Category created successfully", { category }, 201);
});

// @desc    Update category (Admin)
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
  });
  if (!category) {
    return error(res, "Category not found", 404);
  }

  const updatedCategory = await prisma.category.update({
    where: { id: parseInt(id) },
    data: req.body,
  });

  return success(res, "Category updated successfully", {
    category: updatedCategory,
  });
});

// @desc    Delete category (Admin)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
  });
  if (!category) {
    return error(res, "Category not found", 404);
  }

  await prisma.category.delete({ where: { id: parseInt(id) } });

  return success(res, "Category deleted successfully");
});

// ==================== FRAME SIZES ====================

// @desc    Get all frame sizes (Admin)
// @route   GET /api/admin/frame-sizes
// @access  Private/Admin
exports.getAllFrameSizes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, product_id, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    where.OR = [
      { size_label: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (product_id) {
    where.product_id = parseInt(product_id);
  }

  const [frameSizes, total] = await Promise.all([
    prisma.frameSize.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      take: parseInt(limit),
      skip: skip,
      orderBy: { [sortBy]: sortOrder.toLowerCase() }
    }),
    prisma.frameSize.count({ where })
  ]);

  return success(res, "Frame sizes retrieved successfully", {
    frameSizes,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single frame size (Admin)
// @route   GET /api/admin/frame-sizes/:id
// @access  Private/Admin
exports.getFrameSize = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const frameSize = await prisma.frameSize.findUnique({
    where: { id: parseInt(id) },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!frameSize) {
    return error(res, "Frame size not found", 404);
  }

  return success(res, "Frame size retrieved successfully", { frameSize });
});

// @desc    Create frame size (Admin)
// @route   POST /api/admin/frame-sizes
// @access  Private/Admin
exports.createFrameSize = asyncHandler(async (req, res) => {
  const frameSizeData = { ...req.body };

  // Validate product_id is required
  if (!frameSizeData.product_id) {
    return error(res, "Product ID is required", 400);
  }

  const productId = parseInt(frameSizeData.product_id, 10);
  if (isNaN(productId)) {
    return error(res, "Invalid product ID", 400);
  }

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    return error(res, `Product with ID ${productId} not found`, 404);
  }

  frameSizeData.product_id = productId;

  const frameSize = await prisma.frameSize.create({
    data: frameSizeData,
  });
  return success(res, "Frame size created successfully", { frameSize }, 201);
});

// @desc    Update frame size (Admin)
// @route   PUT /api/admin/frame-sizes/:id
// @access  Private/Admin
exports.updateFrameSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const frameSizeData = { ...req.body };

  // Check if frame size exists
  const existingFrameSize = await prisma.frameSize.findUnique({
    where: { id: parseInt(id) },
  });
  if (!existingFrameSize) {
    return error(res, "Frame size not found", 404);
  }

  // Validate product_id if provided
  if (frameSizeData.product_id !== undefined) {
    const productId = parseInt(frameSizeData.product_id, 10);
    if (isNaN(productId)) {
      return error(res, "Invalid product ID", 400);
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return error(res, `Product with ID ${productId} not found`, 404);
    }

    frameSizeData.product_id = productId;
  }

  const frameSize = await prisma.frameSize.update({
    where: { id: parseInt(id) },
    data: frameSizeData,
  });
  return success(res, "Frame size updated successfully", { frameSize });
});

// @desc    Delete frame size (Admin)
// @route   DELETE /api/admin/frame-sizes/:id
// @access  Private/Admin
exports.deleteFrameSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.frameSize.delete({ where: { id: parseInt(id) } });
  return success(res, "Frame size deleted successfully");
});

// ==================== LENS TYPES ====================

// @desc    Get all lens types (Admin)
// @route   GET /api/admin/lens-types
// @access  Private/Admin
exports.getAllLensTypes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, is_active, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  const [lensTypes, total] = await Promise.all([
    prisma.lensType.findMany({
      where,
      take: parseInt(limit),
      skip: skip,
      orderBy: { [sortBy]: sortOrder.toLowerCase() }
    }),
    prisma.lensType.count({ where })
  ]);

  return success(res, "Lens types retrieved successfully", {
    lensTypes,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single lens type (Admin)
// @route   GET /api/admin/lens-types/:id
// @access  Private/Admin
exports.getLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lensType = await prisma.lensType.findUnique({
    where: { id: parseInt(id) }
  });

  if (!lensType) {
    return error(res, "Lens type not found", 404);
  }

  return success(res, "Lens type retrieved successfully", { lensType });
});

// @desc    Create lens type (Admin)
// @route   POST /api/admin/lens-types
// @access  Private/Admin
exports.createLensType = asyncHandler(async (req, res) => {
  const lensTypeData = { ...req.body };

  if (!lensTypeData.slug) {
    lensTypeData.slug = lensTypeData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const lensType = await prisma.lensType.create({
    data: lensTypeData,
  });
  return success(res, "Lens type created successfully", { lensType }, 201);
});

// @desc    Update lens type (Admin)
// @route   PUT /api/admin/lens-types/:id
// @access  Private/Admin
exports.updateLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if lens type exists
  const existingLensType = await prisma.lensType.findUnique({
    where: { id: parseInt(id) },
  });
  if (!existingLensType) {
    return error(res, "Lens type not found", 404);
  }

  const lensType = await prisma.lensType.update({
    where: { id: parseInt(id) },
    data: req.body,
  });
  return success(res, "Lens type updated successfully", { lensType });
});

// @desc    Delete lens type (Admin)
// @route   DELETE /api/admin/lens-types/:id
// @access  Private/Admin
exports.deleteLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lensType = await prisma.lensType.findUnique({
    where: { id: parseInt(id) },
  });
  if (!lensType) {
    return error(res, "Lens type not found", 404);
  }

  await prisma.lensType.delete({ where: { id: parseInt(id) } });
  return success(res, "Lens type deleted successfully");
});

// ==================== LENS COATINGS ====================

// @desc    Get all lens coatings (Admin)
// @route   GET /api/admin/lens-coatings
// @access  Private/Admin
exports.getAllLensCoatings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, is_active, type, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  if (type) {
    where.type = type;
  }

  const [lensCoatings, total] = await Promise.all([
    prisma.lensCoating.findMany({
      where,
      take: parseInt(limit),
      skip: skip,
      orderBy: { [sortBy]: sortOrder.toLowerCase() }
    }),
    prisma.lensCoating.count({ where })
  ]);

  return success(res, "Lens coatings retrieved successfully", {
    lensCoatings,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single lens coating (Admin)
// @route   GET /api/admin/lens-coatings/:id
// @access  Private/Admin
exports.getLensCoating = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lensCoating = await prisma.lensCoating.findUnique({
    where: { id: parseInt(id) }
  });

  if (!lensCoating) {
    return error(res, "Lens coating not found", 404);
  }

  return success(res, "Lens coating retrieved successfully", { lensCoating });
});

// @desc    Create lens coating (Admin)
// @route   POST /api/admin/lens-coatings
// @access  Private/Admin
exports.createLensCoating = asyncHandler(async (req, res) => {
  const coatingData = { ...req.body };

  if (!coatingData.slug) {
    coatingData.slug = coatingData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const lensCoating = await prisma.lensCoating.create({
    data: coatingData,
  });
  return success(
    res,
    "Lens coating created successfully",
    { lensCoating },
    201
  );
});

// @desc    Update lens coating (Admin)
// @route   PUT /api/admin/lens-coatings/:id
// @access  Private/Admin
exports.updateLensCoating = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if lens coating exists
  const existingLensCoating = await prisma.lensCoating.findUnique({
    where: { id: parseInt(id) },
  });
  if (!existingLensCoating) {
    return error(res, "Lens coating not found", 404);
  }

  const lensCoating = await prisma.lensCoating.update({
    where: { id: parseInt(id) },
    data: req.body,
  });
  return success(res, "Lens coating updated successfully", { lensCoating });
});

// @desc    Delete lens coating (Admin)
// @route   DELETE /api/admin/lens-coatings/:id
// @access  Private/Admin
exports.deleteLensCoating = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lensCoating = await prisma.lensCoating.findUnique({
    where: { id: parseInt(id) },
  });
  if (!lensCoating) {
    return error(res, "Lens coating not found", 404);
  }

  await prisma.lensCoating.delete({ where: { id: parseInt(id) } });
  return success(res, "Lens coating deleted successfully");
});

// ==================== BULK UPLOAD ====================

// @desc    Bulk upload products (Admin)
// @route   POST /api/admin/products/bulk-upload
// @access  Private/Admin
exports.bulkUploadProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, "Please upload a CSV file", 400);
  }

  const results = [];
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        const createdProducts = [];
        for (const item of results) {
          // Basic validation and transformation
          if (!item.name || !item.sku) continue;

          const slug =
            item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

          // Check if product exists
          const existing = await prisma.product.findFirst({
            where: { OR: [{ sku: item.sku }, { slug }] },
          });

          if (existing) continue; // Skip duplicates for now

          const categoryId = parseInt(item.category_id || 1);

          // Validate category exists
          const category = await prisma.category.findUnique({
            where: { id: categoryId },
          });
          if (!category) {
            console.warn(`Skipping product ${item.name}: Category ${categoryId} not found`);
            continue;
          }

          const product = await prisma.product.create({
            data: {
              name: item.name,
              slug,
              sku: item.sku,
              description: item.description,
              price: parseFloat(item.price || 0),
              category_id: categoryId,
              stock_quantity: parseInt(item.stock_quantity || 0),
              product_type: item.product_type || "frame",
              gender: item.gender || "unisex",
            },
          });
          createdProducts.push(product);
        }

        return success(
          res,
          `Processed ${results.length} items. Created ${createdProducts.length} products.`,
          {
            count: createdProducts.length,
          }
        );
      } catch (err) {
        console.error("Bulk upload error:", err);
        return error(res, "Error processing bulk upload", 500);
      }
    });
});
