const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// Helper function to format prescription lens variant
const formatVariant = (variant) => ({
  id: variant.id,
  name: variant.name,
  slug: variant.slug,
  description: variant.description,
  price: parseFloat(variant.price),
  isRecommended: variant.is_recommended,
  viewingRange: variant.viewing_range,
  useCases: variant.use_cases,
  isActive: variant.is_active,
  sortOrder: variant.sort_order
});

// Helper function to format prescription lens type
const formatPrescriptionLensType = (type) => ({
  id: type.id,
  name: type.name,
  slug: type.slug,
  description: type.description,
  prescriptionType: type.prescription_type,
  basePrice: parseFloat(type.base_price),
  isActive: type.is_active,
  sortOrder: type.sort_order,
  colors: type.colors ? type.colors.map(formatColor) : [],
  variants: type.variants ? type.variants.map(formatVariant) : [],
  createdAt: type.created_at,
  updatedAt: type.updated_at
});

// Helper function to format color
const formatColor = (color) => ({
  id: color.id,
  name: color.name,
  colorCode: color.color_code,
  hexCode: color.hex_code,
  imageUrl: color.image_url,
  priceAdjustment: parseFloat(color.price_adjustment),
  isActive: color.is_active,
  sortOrder: color.sort_order
});

// ==================== PRESCRIPTION LENS TYPES - PUBLIC ====================

// @desc    Get all active prescription lens types
// @route   GET /api/prescription-lens-types
// @access  Public
exports.getPrescriptionLensTypes = asyncHandler(async (req, res) => {
  const types = await prisma.prescriptionLensType.findMany({
    where: { is_active: true },
    include: {
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      },
      variants: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  return success(res, 'Prescription lens types retrieved successfully', {
    prescriptionLensTypes: types.map(formatPrescriptionLensType),
    count: types.length
  });
});

// @desc    Get single prescription lens type
// @route   GET /api/prescription-lens-types/:id
// @access  Public
exports.getPrescriptionLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const type = await prisma.prescriptionLensType.findFirst({
      where: {
        id: parseInt(id),
        is_active: true
      },
      include: {
        colors: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' }
        },
        variants: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' }
        }
      }
  });

  if (!type) {
    return error(res, 'Prescription lens type not found', 404);
  }

  return success(res, 'Prescription lens type retrieved successfully', {
    prescriptionLensType: formatPrescriptionLensType(type)
  });
});

// ==================== PRESCRIPTION LENS TYPES - ADMIN ====================

// @desc    Get all prescription lens types (Admin)
// @route   GET /api/admin/prescription-lens-types
// @access  Private/Admin
exports.getAllPrescriptionLensTypes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, prescriptionType, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (prescriptionType) {
    where.prescription_type = prescriptionType;
  }

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  const [types, total] = await Promise.all([
    prisma.prescriptionLensType.findMany({
      where,
      include: {
        colors: {
          orderBy: { sort_order: 'asc' }
        },
        variants: {
          orderBy: { sort_order: 'asc' }
        }
      },
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ],
      skip,
      take: parseInt(limit)
    }),
    prisma.prescriptionLensType.count({ where })
  ]);

  return success(res, 'Prescription lens types retrieved successfully', {
    prescriptionLensTypes: types.map(formatPrescriptionLensType),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Create prescription lens type (Admin)
// @route   POST /api/admin/prescription-lens-types
// @access  Private/Admin
exports.createPrescriptionLensType = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    prescription_type,
    base_price = 60.00,
    is_active = true,
    sort_order = 0
  } = req.body;

  if (!name || !prescription_type) {
    return error(res, 'Name and prescription_type are required', 400);
  }

  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const type = await prisma.prescriptionLensType.create({
    data: {
      name,
      slug: finalSlug,
      description: description || null,
      prescription_type,
      base_price: parseFloat(base_price),
      is_active,
      sort_order: parseInt(sort_order)
    },
    include: {
      colors: true
    }
  });

  return success(res, 'Prescription lens type created successfully', {
    prescriptionLensType: formatPrescriptionLensType(type)
  }, 201);
});

// @desc    Update prescription lens type (Admin)
// @route   PUT /api/admin/prescription-lens-types/:id
// @access  Private/Admin
exports.updatePrescriptionLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['name', 'slug', 'description', 'prescription_type', 'base_price', 'is_active', 'sort_order'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'base_price') {
        updateData[field] = parseFloat(req.body[field]);
      } else if (field === 'sort_order') {
        updateData[field] = parseInt(req.body[field]);
      } else if (field === 'is_active') {
        updateData[field] = req.body[field] === true || req.body[field] === 'true';
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  const type = await prisma.prescriptionLensType.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      colors: {
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  return success(res, 'Prescription lens type updated successfully', {
    prescriptionLensType: formatPrescriptionLensType(type)
  });
});

// @desc    Delete prescription lens type (Admin)
// @route   DELETE /api/admin/prescription-lens-types/:id
// @access  Private/Admin
exports.deletePrescriptionLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const type = await prisma.prescriptionLensType.findUnique({
    where: { id: parseInt(id) }
  });

  if (!type) {
    return error(res, 'Prescription lens type not found', 404);
  }

  await prisma.prescriptionLensType.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Prescription lens type deleted successfully');
});

