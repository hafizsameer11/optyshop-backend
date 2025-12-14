const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// Helper function to format shipping method
const formatShippingMethod = (method) => ({
  id: method.id,
  name: method.name,
  slug: method.slug,
  type: method.type,
  description: method.description,
  price: parseFloat(method.price),
  estimatedDays: method.estimated_days,
  isActive: method.is_active,
  sortOrder: method.sort_order,
  icon: method.icon,
  createdAt: method.created_at,
  updatedAt: method.updated_at
});

// ==================== PUBLIC ENDPOINTS ====================

// @desc    Get all active shipping methods
// @route   GET /api/shipping-methods
// @access  Public
exports.getShippingMethods = asyncHandler(async (req, res) => {
  const { type } = req.query;

  const where = {
    is_active: true
  };

  if (type) {
    where.type = type;
  }

  const methods = await prisma.shippingMethod.findMany({
    where,
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  return success(res, 'Shipping methods retrieved successfully', {
    methods: methods.map(formatShippingMethod),
    count: methods.length
  });
});

// @desc    Get single shipping method
// @route   GET /api/shipping-methods/:id
// @access  Public
exports.getShippingMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const method = await prisma.shippingMethod.findFirst({
    where: {
      id: parseInt(id),
      is_active: true
    }
  });

  if (!method) {
    return error(res, 'Shipping method not found', 404);
  }

  return success(res, 'Shipping method retrieved successfully', {
    method: formatShippingMethod(method)
  });
});

// ==================== ADMIN ENDPOINTS ====================

// @desc    Get all shipping methods (Admin)
// @route   GET /api/admin/shipping-methods
// @access  Private/Admin
exports.getAllShippingMethods = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (type) {
    where.type = type;
  }

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  const [methods, total] = await Promise.all([
    prisma.shippingMethod.findMany({
      where,
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ],
      skip,
      take: parseInt(limit)
    }),
    prisma.shippingMethod.count({ where })
  ]);

  return success(res, 'Shipping methods retrieved successfully', {
    methods: methods.map(formatShippingMethod),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single shipping method (Admin)
// @route   GET /api/admin/shipping-methods/:id
// @access  Private/Admin
exports.getShippingMethodAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const method = await prisma.shippingMethod.findUnique({
    where: { id: parseInt(id) }
  });

  if (!method) {
    return error(res, 'Shipping method not found', 404);
  }

  return success(res, 'Shipping method retrieved successfully', {
    method: formatShippingMethod(method)
  });
});

// @desc    Create shipping method (Admin)
// @route   POST /api/admin/shipping-methods
// @access  Private/Admin
exports.createShippingMethod = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    type,
    description,
    price = 0,
    estimated_days,
    is_active = true,
    sort_order = 0,
    icon
  } = req.body;

  if (!name || !type) {
    return error(res, 'Name and type are required', 400);
  }

  // Generate slug if not provided
  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const method = await prisma.shippingMethod.create({
    data: {
      name,
      slug: finalSlug,
      type,
      description: description || null,
      price: parseFloat(price),
      estimated_days: estimated_days ? parseInt(estimated_days) : null,
      is_active,
      sort_order: parseInt(sort_order),
      icon: icon || null
    }
  });

  return success(res, 'Shipping method created successfully', {
    method: formatShippingMethod(method)
  }, 201);
});

// @desc    Update shipping method (Admin)
// @route   PUT /api/admin/shipping-methods/:id
// @access  Private/Admin
exports.updateShippingMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['name', 'slug', 'type', 'description', 'price', 'estimated_days', 'is_active', 'sort_order', 'icon'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'price') {
        updateData[field] = parseFloat(req.body[field]);
      } else if (field === 'estimated_days' || field === 'sort_order') {
        updateData[field] = parseInt(req.body[field]);
      } else if (field === 'is_active') {
        updateData[field] = req.body[field] === true || req.body[field] === 'true';
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  const method = await prisma.shippingMethod.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Shipping method updated successfully', {
    method: formatShippingMethod(method)
  });
});

// @desc    Delete shipping method (Admin)
// @route   DELETE /api/admin/shipping-methods/:id
// @access  Private/Admin
exports.deleteShippingMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const method = await prisma.shippingMethod.findUnique({
    where: { id: parseInt(id) }
  });

  if (!method) {
    return error(res, 'Shipping method not found', 404);
  }

  await prisma.shippingMethod.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Shipping method deleted successfully');
});

