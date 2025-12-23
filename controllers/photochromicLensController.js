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

// Helper function to format photochromic lens option
const formatPhotochromicLensOption = (option) => ({
  id: option.id,
  name: option.name,
  slug: option.slug,
  type: option.type,
  description: option.description,
  basePrice: parseFloat(option.base_price),
  isActive: option.is_active,
  sortOrder: option.sort_order,
  colors: option.colors ? option.colors.filter(c => !c.lens_finish_id).map(formatLensColor) : [],
  createdAt: option.created_at,
  updatedAt: option.updated_at
});

// ==================== PHOTOCHROMIC LENSES - PUBLIC ====================

// @desc    Get all photochromic lens options
// @route   GET /api/photochromic-lenses
// @access  Public
exports.getPhotochromicLenses = asyncHandler(async (req, res) => {
  const options = await prisma.lensOption.findMany({
    where: {
      type: 'photochromic',
      is_active: true
    },
    include: {
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

  // Organize by specific types from the image
  const eyeqlenzWithGuard = options.find(opt => 
    opt.name.includes('EyeQLenz') && opt.name.includes('Zenni ID Guard')
  );
  const eyeqlenz = options.find(opt => 
    opt.name.includes('EyeQLenz') && !opt.name.includes('Zenni ID Guard')
  );
  const transitions = options.find(opt => 
    opt.name.includes('Transitions') || opt.name.includes('GEN S')
  );
  const standard = options.find(opt => 
    opt.name === 'Standard' || opt.name.includes('Standard')
  );
  const blokzPhotochromic = options.find(opt => 
    opt.name.includes('Blokz') && opt.name.includes('Photochromic')
  );

  const result = {
    eyeqlenzWithGuard: eyeqlenzWithGuard ? formatPhotochromicLensOption(eyeqlenzWithGuard) : null,
    eyeqlenz: eyeqlenz ? formatPhotochromicLensOption(eyeqlenz) : null,
    transitions: transitions ? formatPhotochromicLensOption(transitions) : null,
    standard: standard ? formatPhotochromicLensOption(standard) : null,
    blokzPhotochromic: blokzPhotochromic ? formatPhotochromicLensOption(blokzPhotochromic) : null,
    all: options.map(formatPhotochromicLensOption)
  };

  return success(res, 'Photochromic lenses retrieved successfully', result);
});

// @desc    Get single photochromic lens option
// @route   GET /api/photochromic-lenses/:id
// @access  Public
exports.getPhotochromicLens = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const option = await prisma.lensOption.findFirst({
    where: {
      id: parseInt(id),
      type: 'photochromic',
      is_active: true
    },
    include: {
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
    return error(res, 'Photochromic lens option not found', 404);
  }

  return success(res, 'Photochromic lens option retrieved successfully', {
    option: formatPhotochromicLensOption(option)
  });
});

// ==================== PHOTOCHROMIC LENSES - ADMIN ====================

// @desc    Get all photochromic lens options (Admin)
// @route   GET /api/admin/photochromic-lenses
// @access  Private/Admin
exports.getAllPhotochromicLenses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    type: 'photochromic'
  };

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  const [options, total] = await Promise.all([
    prisma.lensOption.findMany({
      where,
      include: {
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

  return success(res, 'Photochromic lenses retrieved successfully', {
    options: options.map(formatPhotochromicLensOption),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Create photochromic lens option (Admin)
// @route   POST /api/admin/photochromic-lenses
// @access  Private/Admin
exports.createPhotochromicLens = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    base_price = 0,
    is_active = true,
    sort_order = 0
  } = req.body;

  if (!name) {
    return error(res, 'Name is required', 400);
  }

  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const option = await prisma.lensOption.create({
    data: {
      name,
      slug: finalSlug,
      type: 'photochromic',
      description: description || null,
      base_price: parseFloat(base_price),
      is_active,
      sort_order: parseInt(sort_order)
    },
    include: {
      colors: true
    }
  });

  return success(res, 'Photochromic lens option created successfully', {
    option: formatPhotochromicLensOption(option)
  }, 201);
});

// @desc    Update photochromic lens option (Admin)
// @route   PUT /api/admin/photochromic-lenses/:id
// @access  Private/Admin
exports.updatePhotochromicLens = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['name', 'slug', 'description', 'base_price', 'is_active', 'sort_order'];
  
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

  return success(res, 'Photochromic lens option updated successfully', {
    option: formatPhotochromicLensOption(option)
  });
});

// @desc    Delete photochromic lens option (Admin)
// @route   DELETE /api/admin/photochromic-lenses/:id
// @access  Private/Admin
exports.deletePhotochromicLens = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const option = await prisma.lensOption.findUnique({
    where: { id: parseInt(id) }
  });

  if (!option) {
    return error(res, 'Photochromic lens option not found', 404);
  }

  await prisma.lensOption.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Photochromic lens option deleted successfully');
});

