const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// Helper function to format lens color
const formatLensColor = (color) => ({
  id: color.id,
  name: color.name,
  colorCode: color.color_code,
  hexCode: color.hex_code,
  imageUrl: color.image_url,
  priceAdjustment: parseFloat(color.price_adjustment),
  isActive: color.is_active,
  sortOrder: color.sort_order
});

// Helper function to format prescription lens variant
const formatPrescriptionLensVariant = (variant) => ({
  id: variant.id,
  name: variant.name,
  slug: variant.slug,
  description: variant.description,
  price: parseFloat(variant.price),
  isRecommended: variant.is_recommended,
  viewingRange: variant.viewing_range,
  useCases: variant.use_cases,
  isActive: variant.is_active,
  sortOrder: variant.sort_order,
  prescriptionLensTypeId: variant.prescription_lens_type_id,
  createdAt: variant.created_at,
  updatedAt: variant.updated_at
});

// ==================== PRESCRIPTION LENS VARIANTS - PUBLIC ====================

// @desc    Get all active prescription lens variants for a type
// @route   GET /api/prescription-lens-types/:typeId/variants
// @access  Public
exports.getPrescriptionLensVariants = asyncHandler(async (req, res) => {
  const { typeId } = req.params;
  const { isActive, isRecommended, page, limit } = req.query;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 100;
  const skip = (pageNum - 1) * limitNum;

  // Verify prescription lens type exists
  const prescriptionLensType = await prisma.prescriptionLensType.findUnique({
    where: { id: parseInt(typeId) }
  });

  if (!prescriptionLensType) {
    return error(res, 'Prescription lens type not found', 404);
  }

  const where = {
    prescription_lens_type_id: parseInt(typeId)
  };

  // Filter by active status (default to true if not specified)
  if (isActive !== undefined) {
    where.is_active = isActive === 'true' || isActive === true;
  } else {
    where.is_active = true; // Default to active only
  }

  // Filter by recommended status
  if (isRecommended !== undefined) {
    where.is_recommended = isRecommended === 'true' || isRecommended === true;
  }

  // Get colors from the parent prescription lens type
  const prescriptionLensTypeWithColors = await prisma.prescriptionLensType.findUnique({
    where: { id: parseInt(typeId) },
    include: {
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  const [variants, total] = await Promise.all([
    prisma.prescriptionLensVariant.findMany({
      where,
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ],
      skip,
      take: limitNum
    }),
    prisma.prescriptionLensVariant.count({ where })
  ]);

  // Map colors from parent type to each variant
  const typeColors = prescriptionLensTypeWithColors?.colors || [];

  return success(res, 'Prescription lens variants retrieved successfully', {
    prescriptionLensType: {
      id: prescriptionLensType.id,
      name: prescriptionLensType.name,
      slug: prescriptionLensType.slug
    },
    variants: variants.map(variant => ({
      ...formatPrescriptionLensVariant(variant),
      colors: typeColors.map(formatLensColor) // Use colors from parent type
    })),
    count: variants.length,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// @desc    Get single prescription lens variant
// @route   GET /api/prescription-lens-variants/:id
// @access  Public
exports.getPrescriptionLensVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const variant = await prisma.prescriptionLensVariant.findFirst({
    where: {
      id: parseInt(id),
      is_active: true
    },
    include: {
      prescriptionLensType: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!variant) {
    return error(res, 'Prescription lens variant not found', 404);
  }

  // Get colors from the parent prescription lens type
  const prescriptionLensTypeWithColors = await prisma.prescriptionLensType.findUnique({
    where: { id: variant.prescription_lens_type_id },
    include: {
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  const typeColors = prescriptionLensTypeWithColors?.colors || [];

  return success(res, 'Prescription lens variant retrieved successfully', {
    variant: {
      ...formatPrescriptionLensVariant(variant),
      colors: typeColors.map(formatLensColor), // Use colors from parent type
      prescriptionLensType: {
        id: variant.prescriptionLensType.id,
        name: variant.prescriptionLensType.name,
        slug: variant.prescriptionLensType.slug
      }
    }
  });
});

// ==================== PRESCRIPTION LENS VARIANTS - ADMIN ====================

// @desc    Get all prescription lens variants (Admin)
// @route   GET /api/admin/prescription-lens-variants
// @access  Private/Admin
exports.getAllPrescriptionLensVariants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, prescriptionLensTypeId, isActive, isRecommended } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (prescriptionLensTypeId) {
    where.prescription_lens_type_id = parseInt(prescriptionLensTypeId);
  }

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  if (isRecommended !== undefined) {
    where.is_recommended = isRecommended === 'true';
  }

  const [variants, total] = await Promise.all([
    prisma.prescriptionLensVariant.findMany({
      where,
      include: {
        prescriptionLensType: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ],
      skip,
      take: parseInt(limit)
    }),
    prisma.prescriptionLensVariant.count({ where })
  ]);

  return success(res, 'Prescription lens variants retrieved successfully', {
    variants: variants.map(v => ({
      ...formatPrescriptionLensVariant(v),
      prescriptionLensType: {
        id: v.prescriptionLensType.id,
        name: v.prescriptionLensType.name,
        slug: v.prescriptionLensType.slug
      }
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Create prescription lens variant (Admin)
// @route   POST /api/admin/prescription-lens-variants
// @access  Private/Admin
exports.createPrescriptionLensVariant = asyncHandler(async (req, res) => {
  const {
    prescription_lens_type_id,
    name,
    slug,
    description,
    price,
    is_recommended = false,
    viewing_range,
    use_cases,
    is_active = true,
    sort_order = 0
  } = req.body;

  if (!prescription_lens_type_id || !name || price === undefined) {
    return error(res, 'Prescription lens type ID, name, and price are required', 400);
  }

  // Verify prescription lens type exists
  const prescriptionLensType = await prisma.prescriptionLensType.findUnique({
    where: { id: parseInt(prescription_lens_type_id) }
  });

  if (!prescriptionLensType) {
    return error(res, 'Prescription lens type not found', 404);
  }

  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const variant = await prisma.prescriptionLensVariant.create({
    data: {
      prescription_lens_type_id: parseInt(prescription_lens_type_id),
      name,
      slug: finalSlug,
      description: description || null,
      price: parseFloat(price),
      is_recommended: is_recommended === true || is_recommended === 'true',
      viewing_range: viewing_range || null,
      use_cases: use_cases || null,
      is_active,
      sort_order: parseInt(sort_order)
    },
    include: {
      prescriptionLensType: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  return success(res, 'Prescription lens variant created successfully', {
    variant: {
      ...formatPrescriptionLensVariant(variant),
      prescriptionLensType: {
        id: variant.prescriptionLensType.id,
        name: variant.prescriptionLensType.name,
        slug: variant.prescriptionLensType.slug
      }
    }
  }, 201);
});

// @desc    Update prescription lens variant (Admin)
// @route   PUT /api/admin/prescription-lens-variants/:id
// @access  Private/Admin
exports.updatePrescriptionLensVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['name', 'slug', 'description', 'price', 'is_recommended', 'viewing_range', 'use_cases', 'is_active', 'sort_order'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'price') {
        updateData[field] = parseFloat(req.body[field]);
      } else if (field === 'sort_order') {
        updateData[field] = parseInt(req.body[field]);
      } else if (field === 'is_active' || field === 'is_recommended') {
        updateData[field] = req.body[field] === true || req.body[field] === 'true';
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  const variant = await prisma.prescriptionLensVariant.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      prescriptionLensType: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  return success(res, 'Prescription lens variant updated successfully', {
    variant: {
      ...formatPrescriptionLensVariant(variant),
      prescriptionLensType: {
        id: variant.prescriptionLensType.id,
        name: variant.prescriptionLensType.name,
        slug: variant.prescriptionLensType.slug
      }
    }
  });
});

// @desc    Delete prescription lens variant (Admin)
// @route   DELETE /api/admin/prescription-lens-variants/:id
// @access  Private/Admin
exports.deletePrescriptionLensVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const variant = await prisma.prescriptionLensVariant.findUnique({
    where: { id: parseInt(id) }
  });

  if (!variant) {
    return error(res, 'Prescription lens variant not found', 404);
  }

  await prisma.prescriptionLensVariant.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Prescription lens variant deleted successfully');
});

