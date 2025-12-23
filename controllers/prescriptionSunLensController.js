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

// Helper function to format lens finish
const formatLensFinish = (finish) => ({
  id: finish.id,
  name: finish.name,
  slug: finish.slug,
  description: finish.description,
  priceAdjustment: parseFloat(finish.price_adjustment),
  isActive: finish.is_active,
  sortOrder: finish.sort_order,
  colors: finish.colors ? finish.colors.map(formatLensColor) : []
});

// Helper function to format prescription sun lens option
const formatPrescriptionSunLensOption = (option) => ({
  id: option.id,
  name: option.name,
  slug: option.slug,
  type: option.type,
  description: option.description,
  basePrice: parseFloat(option.base_price),
  isActive: option.is_active,
  sortOrder: option.sort_order,
  finishes: option.finishes ? option.finishes.map(formatLensFinish) : [],
  colors: option.colors ? option.colors.filter(c => !c.lens_finish_id).map(formatLensColor) : [],
  createdAt: option.created_at,
  updatedAt: option.updated_at
});

// ==================== PRESCRIPTION SUN LENSES - PUBLIC ====================

// @desc    Get all prescription sun lens options (Polarized, Classic, Blokz)
// @route   GET /api/prescription-sun-lenses
// @access  Public
exports.getPrescriptionSunLenses = asyncHandler(async (req, res) => {
  // Get lens options that are polarized or related to prescription sun lenses
  const types = ['polarized', 'classic', 'photochromic'];
  
  const options = await prisma.lensOption.findMany({
    where: {
      type: { in: types },
      is_active: true,
      OR: [
        { name: { contains: 'Polarized' } },
        { name: { contains: 'Classic' } },
        { name: { contains: 'Blokz' } },
        { name: { contains: 'Sunglasses' } }
      ]
    },
    include: {
      finishes: {
        where: { is_active: true },
        include: {
          colors: {
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
          }
        },
        orderBy: { sort_order: 'asc' }
      },
      colors: {
        where: { 
          is_active: true,
          lens_finish_id: null
        },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  // Organize by category: Polarized, Classic, Blokz
  const polarized = options.find(opt => opt.name.includes('Polarized') || opt.type === 'polarized');
  const classic = options.find(opt => opt.name.includes('Classic') && !opt.name.includes('Polarized') && opt.type === 'classic');
  const blokz = options.find(opt => opt.name.includes('Blokz') || opt.name.includes('Sunglasses'));

  const result = {
    polarized: polarized ? formatPrescriptionSunLensOption(polarized) : null,
    classic: classic ? formatPrescriptionSunLensOption(classic) : null,
    blokz: blokz ? formatPrescriptionSunLensOption(blokz) : null
  };

  return success(res, 'Prescription sun lenses retrieved successfully', result);
});

// @desc    Get single prescription sun lens option
// @route   GET /api/prescription-sun-lenses/:id
// @access  Public
exports.getPrescriptionSunLens = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const option = await prisma.lensOption.findFirst({
    where: {
      id: parseInt(id),
      is_active: true,
      OR: [
        { name: { contains: 'Polarized' } },
        { name: { contains: 'Classic' } },
        { name: { contains: 'Blokz' } },
        { name: { contains: 'Sunglasses' } }
      ]
    },
    include: {
      finishes: {
        where: { is_active: true },
        include: {
          colors: {
            where: { is_active: true },
            orderBy: { sort_order: 'asc' }
          }
        },
        orderBy: { sort_order: 'asc' }
      },
      colors: {
        where: { 
          is_active: true,
          lens_finish_id: null
        },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  if (!option) {
    return error(res, 'Prescription sun lens option not found', 404);
  }

  return success(res, 'Prescription sun lens option retrieved successfully', {
    option: formatPrescriptionSunLensOption(option)
  });
});

// ==================== PRESCRIPTION SUN LENSES - ADMIN ====================

// @desc    Get all prescription sun lens options (Admin)
// @route   GET /api/admin/prescription-sun-lenses
// @access  Private/Admin
exports.getAllPrescriptionSunLenses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    OR: [
      { name: { contains: 'Polarized' } },
      { name: { contains: 'Classic' } },
      { name: { contains: 'Blokz' } },
      { name: { contains: 'Sunglasses' } }
    ]
  };

  if (type) {
    where.type = type;
  }

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  const [options, total] = await Promise.all([
    prisma.lensOption.findMany({
      where,
      include: {
        finishes: {
          include: {
            colors: {
              orderBy: { sort_order: 'asc' }
            }
          },
          orderBy: { sort_order: 'asc' }
        },
        colors: {
          where: { lens_finish_id: null },
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
    prisma.lensOption.count({ where })
  ]);

  return success(res, 'Prescription sun lenses retrieved successfully', {
    options: options.map(formatPrescriptionSunLensOption),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Create prescription sun lens option (Admin)
// @route   POST /api/admin/prescription-sun-lenses
// @access  Private/Admin
exports.createPrescriptionSunLens = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    type,
    description,
    base_price = 0,
    is_active = true,
    sort_order = 0
  } = req.body;

  if (!name || !type) {
    return error(res, 'Name and type are required', 400);
  }

  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const option = await prisma.lensOption.create({
    data: {
      name,
      slug: finalSlug,
      type,
      description: description || null,
      base_price: parseFloat(base_price),
      is_active,
      sort_order: parseInt(sort_order)
    },
    include: {
      colors: true
    }
  });

  return success(res, 'Prescription sun lens option created successfully', {
    option: formatPrescriptionSunLensOption(option)
  }, 201);
});

// @desc    Update prescription sun lens option (Admin)
// @route   PUT /api/admin/prescription-sun-lenses/:id
// @access  Private/Admin
exports.updatePrescriptionSunLens = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['name', 'slug', 'type', 'description', 'base_price', 'is_active', 'sort_order'];
  
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

  const option = await prisma.lensOption.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      colors: {
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  return success(res, 'Prescription sun lens option updated successfully', {
    option: formatPrescriptionSunLensOption(option)
  });
});

// @desc    Delete prescription sun lens option (Admin)
// @route   DELETE /api/admin/prescription-sun-lenses/:id
// @access  Private/Admin
exports.deletePrescriptionSunLens = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const option = await prisma.lensOption.findUnique({
    where: { id: parseInt(id) }
  });

  if (!option) {
    return error(res, 'Prescription sun lens option not found', 404);
  }

  await prisma.lensOption.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Prescription sun lens option deleted successfully');
});

