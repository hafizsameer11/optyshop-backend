const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

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

// Helper function to format lens option
const formatLensOption = (option) => ({
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

// Helper function to format lens treatment
const formatLensTreatment = (treatment) => ({
  id: treatment.id,
  name: treatment.name,
  slug: treatment.slug,
  type: treatment.type,
  description: treatment.description,
  price: parseFloat(treatment.price),
  icon: treatment.icon,
  isActive: treatment.is_active,
  sortOrder: treatment.sort_order,
  createdAt: treatment.created_at,
  updatedAt: treatment.updated_at
});

// ==================== LENS OPTIONS - PUBLIC ====================

// @desc    Get all active lens options with colors
// @route   GET /api/lens-options
// @access  Public
exports.getLensOptions = asyncHandler(async (req, res) => {
  const { type } = req.query;

  const where = {
    is_active: true
  };

  if (type) {
    where.type = type;
  }

  const options = await prisma.lensOption.findMany({
    where,
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

  return success(res, 'Lens options retrieved successfully', {
    options: options.map(formatLensOption),
    count: options.length
  });
});

// @desc    Get single lens option with colors
// @route   GET /api/lens-options/:id
// @access  Public
exports.getLensOption = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const option = await prisma.lensOption.findFirst({
    where: {
      id: parseInt(id),
      is_active: true
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
    return error(res, 'Lens option not found', 404);
  }

  return success(res, 'Lens option retrieved successfully', {
    option: formatLensOption(option)
  });
});

// ==================== LENS OPTIONS - ADMIN ====================

// @desc    Get all lens options (Admin)
// @route   GET /api/admin/lens-options
// @access  Private/Admin
exports.getAllLensOptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

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

  return success(res, 'Lens options retrieved successfully', {
    options: options.map(formatLensOption),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Create lens option (Admin)
// @route   POST /api/admin/lens-options
// @access  Private/Admin
exports.createLensOption = asyncHandler(async (req, res) => {
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

  return success(res, 'Lens option created successfully', {
    option: formatLensOption(option)
  }, 201);
});

// @desc    Update lens option (Admin)
// @route   PUT /api/admin/lens-options/:id
// @access  Private/Admin
exports.updateLensOption = asyncHandler(async (req, res) => {
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

  return success(res, 'Lens option updated successfully', {
    option: formatLensOption(option)
  });
});

// @desc    Delete lens option (Admin)
// @route   DELETE /api/admin/lens-options/:id
// @access  Private/Admin
exports.deleteLensOption = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const option = await prisma.lensOption.findUnique({
    where: { id: parseInt(id) }
  });

  if (!option) {
    return error(res, 'Lens option not found', 404);
  }

  await prisma.lensOption.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Lens option deleted successfully');
});

// ==================== LENS COLORS - PUBLIC ====================

// @desc    Get all active lens colors
// @route   GET /api/lens/colors
// @access  Public
exports.getLensColors = asyncHandler(async (req, res) => {
  const { lensOptionId, lensFinishId, prescriptionLensTypeId } = req.query;

  const where = {
    is_active: true
  };

  if (lensOptionId) {
    where.lens_option_id = parseInt(lensOptionId);
  }

  if (lensFinishId) {
    where.lens_finish_id = parseInt(lensFinishId);
  }

  if (prescriptionLensTypeId) {
    where.prescription_lens_type_id = parseInt(prescriptionLensTypeId);
  }

  const colors = await prisma.lensColor.findMany({
    where,
    include: {
      lensOption: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true
        }
      },
      lensFinish: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
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
    ]
  });

  return success(res, 'Lens colors retrieved successfully', {
    colors: colors.map(color => ({
      ...formatLensColor(color),
      lensOption: color.lensOption ? {
        id: color.lensOption.id,
        name: color.lensOption.name,
        slug: color.lensOption.slug,
        type: color.lensOption.type
      } : null,
      lensFinish: color.lensFinish ? {
        id: color.lensFinish.id,
        name: color.lensFinish.name,
        slug: color.lensFinish.slug
      } : null,
      prescriptionLensType: color.prescriptionLensType ? {
        id: color.prescriptionLensType.id,
        name: color.prescriptionLensType.name,
        slug: color.prescriptionLensType.slug
      } : null
    })),
    count: colors.length
  });
});

// @desc    Get single lens color
// @route   GET /api/lens/colors/:id
// @access  Public
exports.getLensColor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const color = await prisma.lensColor.findFirst({
    where: {
      id: parseInt(id),
      is_active: true
    },
    include: {
      lensOption: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true
        }
      },
      lensFinish: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      prescriptionLensType: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!color) {
    return error(res, 'Lens color not found', 404);
  }

  return success(res, 'Lens color retrieved successfully', {
    color: {
      ...formatLensColor(color),
      lensOption: color.lensOption ? {
        id: color.lensOption.id,
        name: color.lensOption.name,
        slug: color.lensOption.slug,
        type: color.lensOption.type
      } : null,
      lensFinish: color.lensFinish ? {
        id: color.lensFinish.id,
        name: color.lensFinish.name,
        slug: color.lensFinish.slug
      } : null,
      prescriptionLensType: color.prescriptionLensType ? {
        id: color.prescriptionLensType.id,
        name: color.prescriptionLensType.name,
        slug: color.prescriptionLensType.slug
      } : null
    }
  });
});

// ==================== LENS FINISHES - PUBLIC ====================

// @desc    Get all active lens finishes
// @route   GET /api/lens/finishes
// @access  Public
exports.getLensFinishes = asyncHandler(async (req, res) => {
  const { lensOptionId } = req.query;

  const where = {
    is_active: true
  };

  if (lensOptionId) {
    where.lens_option_id = parseInt(lensOptionId);
  }

  const finishes = await prisma.lensFinish.findMany({
    where,
    include: {
      lensOption: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true
        }
      },
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  return success(res, 'Lens finishes retrieved successfully', {
    finishes: finishes.map(finish => ({
      ...formatLensFinish(finish),
      lensOption: finish.lensOption ? {
        id: finish.lensOption.id,
        name: finish.lensOption.name,
        slug: finish.lensOption.slug,
        type: finish.lensOption.type
      } : null
    })),
    count: finishes.length
  });
});

// @desc    Get single lens finish
// @route   GET /api/lens/finishes/:id
// @access  Public
exports.getLensFinish = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const finish = await prisma.lensFinish.findFirst({
    where: {
      id: parseInt(id),
      is_active: true
    },
    include: {
      lensOption: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true
        }
      },
      colors: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  if (!finish) {
    return error(res, 'Lens finish not found', 404);
  }

  return success(res, 'Lens finish retrieved successfully', {
    finish: {
      ...formatLensFinish(finish),
      lensOption: finish.lensOption ? {
        id: finish.lensOption.id,
        name: finish.lensOption.name,
        slug: finish.lensOption.slug,
        type: finish.lensOption.type
      } : null
    }
  });
});

// ==================== LENS COLORS - ADMIN ====================

// @desc    Get all lens colors (Admin)
// @route   GET /api/admin/lens-colors
// @access  Private/Admin
exports.getAllLensColors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, lensOptionId, lensFinishId, prescriptionLensTypeId, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (lensOptionId) {
    where.lens_option_id = parseInt(lensOptionId);
  }

  if (lensFinishId) {
    where.lens_finish_id = parseInt(lensFinishId);
  }

  if (prescriptionLensTypeId) {
    where.prescription_lens_type_id = parseInt(prescriptionLensTypeId);
  }

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  const [colors, total] = await Promise.all([
    prisma.lensColor.findMany({
      where,
      include: {
        lensOption: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        lensFinish: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
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
    prisma.lensColor.count({ where })
  ]);

  return success(res, 'Lens colors retrieved successfully', {
    colors: colors.map(color => ({
      ...formatLensColor(color),
      lensOption: color.lensOption ? {
        id: color.lensOption.id,
        name: color.lensOption.name,
        type: color.lensOption.type
      } : null,
      lensFinish: color.lensFinish ? {
        id: color.lensFinish.id,
        name: color.lensFinish.name,
        slug: color.lensFinish.slug
      } : null,
      prescriptionLensType: color.prescriptionLensType ? {
        id: color.prescriptionLensType.id,
        name: color.prescriptionLensType.name,
        slug: color.prescriptionLensType.slug
      } : null
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Create lens color (Admin)
// @route   POST /api/admin/lens-colors
// @access  Private/Admin
exports.createLensColor = asyncHandler(async (req, res) => {
  const {
    lens_option_id,
    lens_finish_id,
    name,
    color_code,
    hex_code,
    image_url,
    price_adjustment = 0,
    is_active = true,
    sort_order = 0
  } = req.body;

  // Trim and validate name and color_code
  const trimmedName = name ? String(name).trim() : '';
  const trimmedColorCode = color_code ? String(color_code).trim() : '';

  if (!trimmedName || !trimmedColorCode) {
    return error(res, 'Name and color code are required', 400);
  }

  // Color must belong to either a lens option, lens finish, or prescription lens type
  const { prescription_lens_type_id } = req.body;
  
  if (!lens_option_id && !lens_finish_id && !prescription_lens_type_id) {
    return error(res, 'Either lens_option_id, lens_finish_id, or prescription_lens_type_id is required', 400);
  }

  // Count how many parent types are provided
  const parentCount = [lens_option_id, lens_finish_id, prescription_lens_type_id].filter(Boolean).length;
  if (parentCount > 1) {
    return error(res, 'Color can only belong to one parent (lens option, lens finish, or prescription lens type). Choose one.', 400);
  }

  // Verify lens option exists if provided
  if (lens_option_id) {
    const lensOption = await prisma.lensOption.findUnique({
      where: { id: parseInt(lens_option_id) }
    });

    if (!lensOption) {
      return error(res, 'Lens option not found', 404);
    }
  }

  // Verify lens finish exists if provided
  if (lens_finish_id) {
    const lensFinish = await prisma.lensFinish.findUnique({
      where: { id: parseInt(lens_finish_id) }
    });

    if (!lensFinish) {
      return error(res, 'Lens finish not found', 404);
    }
  }

  // Verify prescription lens type exists if provided
  if (prescription_lens_type_id) {
    const prescriptionLensType = await prisma.prescriptionLensType.findUnique({
      where: { id: parseInt(prescription_lens_type_id) }
    });

    if (!prescriptionLensType) {
      return error(res, 'Prescription lens type not found', 404);
    }
  }

  const color = await prisma.lensColor.create({
    data: {
      lens_option_id: lens_option_id ? parseInt(lens_option_id) : null,
      lens_finish_id: lens_finish_id ? parseInt(lens_finish_id) : null,
      prescription_lens_type_id: prescription_lens_type_id ? parseInt(prescription_lens_type_id) : null,
      name: trimmedName,
      color_code: trimmedColorCode,
      hex_code: hex_code ? String(hex_code).trim() || null : null,
      image_url: image_url ? String(image_url).trim() || null : null,
      price_adjustment: parseFloat(price_adjustment),
      is_active,
      sort_order: parseInt(sort_order)
    }
  });

  return success(res, 'Lens color created successfully', {
    color: formatLensColor(color)
  }, 201);
});

// @desc    Update lens color (Admin)
// @route   PUT /api/admin/lens-colors/:id
// @access  Private/Admin
exports.updateLensColor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['lens_option_id', 'lens_finish_id', 'prescription_lens_type_id', 'name', 'color_code', 'hex_code', 'image_url', 'price_adjustment', 'is_active', 'sort_order'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'price_adjustment') {
        updateData[field] = parseFloat(req.body[field]);
      } else if (field === 'sort_order' || field === 'lens_option_id' || field === 'lens_finish_id' || field === 'prescription_lens_type_id') {
        updateData[field] = req.body[field] ? parseInt(req.body[field]) : null;
      } else if (field === 'is_active') {
        updateData[field] = req.body[field] === true || req.body[field] === 'true';
      } else if (field === 'name' || field === 'color_code') {
        // Trim and validate name and color_code
        const trimmedValue = String(req.body[field]).trim();
        if (!trimmedValue) {
          return error(res, `${field === 'name' ? 'Name' : 'Color code'} cannot be empty`, 400);
        }
        updateData[field] = trimmedValue;
      } else if (field === 'hex_code' || field === 'image_url') {
        // Trim optional fields
        updateData[field] = req.body[field] ? String(req.body[field]).trim() || null : null;
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  // Validate that color belongs to only one parent
  const currentColor = await prisma.lensColor.findUnique({
    where: { id: parseInt(id) }
  });

  const finalLensOptionId = updateData.lens_option_id !== undefined ? updateData.lens_option_id : currentColor.lens_option_id;
  const finalLensFinishId = updateData.lens_finish_id !== undefined ? updateData.lens_finish_id : currentColor.lens_finish_id;
  const finalPrescriptionLensTypeId = updateData.prescription_lens_type_id !== undefined ? updateData.prescription_lens_type_id : currentColor.prescription_lens_type_id;

  const parentCount = [finalLensOptionId, finalLensFinishId, finalPrescriptionLensTypeId].filter(Boolean).length;
  if (parentCount > 1) {
    return error(res, 'Color can only belong to one parent (lens option, lens finish, or prescription lens type). Choose one.', 400);
  }

  const color = await prisma.lensColor.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Lens color updated successfully', {
    color: formatLensColor(color)
  });
});

// @desc    Delete lens color (Admin)
// @route   DELETE /api/admin/lens-colors/:id
// @access  Private/Admin
exports.deleteLensColor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const color = await prisma.lensColor.findUnique({
    where: { id: parseInt(id) }
  });

  if (!color) {
    return error(res, 'Lens color not found', 404);
  }

  await prisma.lensColor.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Lens color deleted successfully');
});

// ==================== LENS TREATMENTS - PUBLIC ====================

// @desc    Get all active lens treatments
// @route   GET /api/lens-treatments
// @access  Public
exports.getLensTreatments = asyncHandler(async (req, res) => {
  const { type } = req.query;

  const where = {
    is_active: true
  };

  if (type) {
    where.type = type;
  }

  const treatments = await prisma.lensTreatment.findMany({
    where,
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  return success(res, 'Lens treatments retrieved successfully', {
    treatments: treatments.map(formatLensTreatment),
    count: treatments.length
  });
});

// @desc    Get single lens treatment
// @route   GET /api/lens-treatments/:id
// @access  Public
exports.getLensTreatment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const treatment = await prisma.lensTreatment.findFirst({
    where: {
      id: parseInt(id),
      is_active: true
    }
  });

  if (!treatment) {
    return error(res, 'Lens treatment not found', 404);
  }

  return success(res, 'Lens treatment retrieved successfully', {
    treatment: formatLensTreatment(treatment)
  });
});

// ==================== LENS TREATMENTS - ADMIN ====================

// @desc    Get all lens treatments (Admin)
// @route   GET /api/admin/lens-treatments
// @access  Private/Admin
exports.getAllLensTreatments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (type) {
    where.type = type;
  }

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  const [treatments, total] = await Promise.all([
    prisma.lensTreatment.findMany({
      where,
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ],
      skip,
      take: parseInt(limit)
    }),
    prisma.lensTreatment.count({ where })
  ]);

  return success(res, 'Lens treatments retrieved successfully', {
    treatments: treatments.map(formatLensTreatment),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Create lens treatment (Admin)
// @route   POST /api/admin/lens-treatments
// @access  Private/Admin
exports.createLensTreatment = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    type,
    description,
    price = 0,
    icon,
    is_active = true,
    sort_order = 0
  } = req.body;

  if (!name || !type) {
    return error(res, 'Name and type are required', 400);
  }

  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const treatment = await prisma.lensTreatment.create({
    data: {
      name,
      slug: finalSlug,
      type,
      description: description || null,
      price: parseFloat(price),
      icon: icon || null,
      is_active,
      sort_order: parseInt(sort_order)
    }
  });

  return success(res, 'Lens treatment created successfully', {
    treatment: formatLensTreatment(treatment)
  }, 201);
});

// @desc    Update lens treatment (Admin)
// @route   PUT /api/admin/lens-treatments/:id
// @access  Private/Admin
exports.updateLensTreatment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['name', 'slug', 'type', 'description', 'price', 'icon', 'is_active', 'sort_order'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'price') {
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

  const treatment = await prisma.lensTreatment.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Lens treatment updated successfully', {
    treatment: formatLensTreatment(treatment)
  });
});

// @desc    Delete lens treatment (Admin)
// @route   DELETE /api/admin/lens-treatments/:id
// @access  Private/Admin
exports.deleteLensTreatment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const treatment = await prisma.lensTreatment.findUnique({
    where: { id: parseInt(id) }
  });

  if (!treatment) {
    return error(res, 'Lens treatment not found', 404);
  }

  await prisma.lensTreatment.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Lens treatment deleted successfully');
});

// ==================== LENS FINISHES - ADMIN ====================

// @desc    Get all lens finishes (Admin)
// @route   GET /api/admin/lens-finishes
// @access  Private/Admin
exports.getAllLensFinishes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, lensOptionId, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (lensOptionId) {
    where.lens_option_id = parseInt(lensOptionId);
  }

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  const [finishes, total] = await Promise.all([
    prisma.lensFinish.findMany({
      where,
      include: {
        lensOption: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        colors: {
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
    prisma.lensFinish.count({ where })
  ]);

  return success(res, 'Lens finishes retrieved successfully', {
    finishes: finishes.map(finish => ({
      ...formatLensFinish(finish),
      lensOption: {
        id: finish.lensOption.id,
        name: finish.lensOption.name,
        type: finish.lensOption.type
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

// @desc    Create lens finish (Admin)
// @route   POST /api/admin/lens-finishes
// @access  Private/Admin
exports.createLensFinish = asyncHandler(async (req, res) => {
  const {
    lens_option_id,
    name,
    slug,
    description,
    price_adjustment = 0,
    is_active = true,
    sort_order = 0
  } = req.body;

  if (!lens_option_id || !name) {
    return error(res, 'Lens option ID and name are required', 400);
  }

  // Verify lens option exists
  const lensOption = await prisma.lensOption.findUnique({
    where: { id: parseInt(lens_option_id) }
  });

  if (!lensOption) {
    return error(res, 'Lens option not found', 404);
  }

  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const finish = await prisma.lensFinish.create({
    data: {
      lens_option_id: parseInt(lens_option_id),
      name,
      slug: finalSlug,
      description: description || null,
      price_adjustment: parseFloat(price_adjustment),
      is_active,
      sort_order: parseInt(sort_order)
    },
    include: {
      lensOption: {
        select: {
          id: true,
          name: true,
          type: true
        }
      }
    }
  });

  return success(res, 'Lens finish created successfully', {
    finish: {
      ...formatLensFinish(finish),
      lensOption: {
        id: finish.lensOption.id,
        name: finish.lensOption.name,
        type: finish.lensOption.type
      }
    }
  }, 201);
});

// @desc    Update lens finish (Admin)
// @route   PUT /api/admin/lens-finishes/:id
// @access  Private/Admin
exports.updateLensFinish = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['name', 'slug', 'description', 'price_adjustment', 'is_active', 'sort_order'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'price_adjustment') {
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

  const finish = await prisma.lensFinish.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      lensOption: {
        select: {
          id: true,
          name: true,
          type: true
        }
      },
      colors: {
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  return success(res, 'Lens finish updated successfully', {
    finish: {
      ...formatLensFinish(finish),
      lensOption: {
        id: finish.lensOption.id,
        name: finish.lensOption.name,
        type: finish.lensOption.type
      }
    }
  });
});

// @desc    Delete lens finish (Admin)
// @route   DELETE /api/admin/lens-finishes/:id
// @access  Private/Admin
exports.deleteLensFinish = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const finish = await prisma.lensFinish.findUnique({
    where: { id: parseInt(id) }
  });

  if (!finish) {
    return error(res, 'Lens finish not found', 404);
  }

  await prisma.lensFinish.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Lens finish deleted successfully');
});

