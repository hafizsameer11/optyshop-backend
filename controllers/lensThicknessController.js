const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// Helper function to format lens thickness material
const formatLensThicknessMaterial = (material) => ({
  id: material.id,
  name: material.name,
  slug: material.slug,
  description: material.description,
  price: parseFloat(material.price),
  isActive: material.is_active,
  sortOrder: material.sort_order,
  createdAt: material.created_at,
  updatedAt: material.updated_at
});

// Helper function to format lens thickness option
const formatLensThicknessOption = (option) => ({
  id: option.id,
  name: option.name,
  slug: option.slug,
  description: option.description,
  thicknessValue: option.thickness_value ? parseFloat(option.thickness_value) : null,
  isActive: option.is_active,
  sortOrder: option.sort_order,
  createdAt: option.created_at,
  updatedAt: option.updated_at
});

// ==================== LENS THICKNESS MATERIALS - PUBLIC ====================

// @desc    Get all active lens thickness materials
// @route   GET /api/lens-thickness-materials
// @access  Public
exports.getLensThicknessMaterials = asyncHandler(async (req, res) => {
  const materials = await prisma.lensThicknessMaterial.findMany({
    where: { is_active: true },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  return success(res, 'Lens thickness materials retrieved successfully', {
    materials: materials.map(formatLensThicknessMaterial),
    count: materials.length
  });
});

// @desc    Get single lens thickness material
// @route   GET /api/lens-thickness-materials/:id
// @access  Public
exports.getLensThicknessMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const material = await prisma.lensThicknessMaterial.findFirst({
    where: {
      id: parseInt(id),
      is_active: true
    }
  });

  if (!material) {
    return error(res, 'Lens thickness material not found', 404);
  }

  return success(res, 'Lens thickness material retrieved successfully', {
    material: formatLensThicknessMaterial(material)
  });
});

// ==================== LENS THICKNESS MATERIALS - ADMIN ====================

// @desc    Get all lens thickness materials (Admin)
// @route   GET /api/admin/lens-thickness-materials
// @access  Private/Admin
exports.getAllLensThicknessMaterials = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  const [materials, total] = await Promise.all([
    prisma.lensThicknessMaterial.findMany({
      where,
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ],
      skip,
      take: parseInt(limit)
    }),
    prisma.lensThicknessMaterial.count({ where })
  ]);

  return success(res, 'Lens thickness materials retrieved successfully', {
    materials: materials.map(formatLensThicknessMaterial),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Create lens thickness material (Admin)
// @route   POST /api/admin/lens-thickness-materials
// @access  Private/Admin
exports.createLensThicknessMaterial = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    price = 0,
    is_active = true,
    sort_order = 0
  } = req.body;

  if (!name) {
    return error(res, 'Name is required', 400);
  }

  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const material = await prisma.lensThicknessMaterial.create({
    data: {
      name,
      slug: finalSlug,
      description: description || null,
      price: parseFloat(price),
      is_active,
      sort_order: parseInt(sort_order)
    }
  });

  return success(res, 'Lens thickness material created successfully', {
    material: formatLensThicknessMaterial(material)
  }, 201);
});

// @desc    Update lens thickness material (Admin)
// @route   PUT /api/admin/lens-thickness-materials/:id
// @access  Private/Admin
exports.updateLensThicknessMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['name', 'slug', 'description', 'price', 'is_active', 'sort_order'];
  
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

  const material = await prisma.lensThicknessMaterial.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Lens thickness material updated successfully', {
    material: formatLensThicknessMaterial(material)
  });
});

// @desc    Delete lens thickness material (Admin)
// @route   DELETE /api/admin/lens-thickness-materials/:id
// @access  Private/Admin
exports.deleteLensThicknessMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const material = await prisma.lensThicknessMaterial.findUnique({
    where: { id: parseInt(id) }
  });

  if (!material) {
    return error(res, 'Lens thickness material not found', 404);
  }

  await prisma.lensThicknessMaterial.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Lens thickness material deleted successfully');
});

// ==================== LENS THICKNESS OPTIONS - PUBLIC ====================

// @desc    Get all active lens thickness options
// @route   GET /api/lens-thickness-options
// @access  Public
exports.getLensThicknessOptions = asyncHandler(async (req, res) => {
  const options = await prisma.lensThicknessOption.findMany({
    where: { is_active: true },
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'asc' }
    ]
  });

  return success(res, 'Lens thickness options retrieved successfully', {
    options: options.map(formatLensThicknessOption),
    count: options.length
  });
});

// @desc    Get single lens thickness option
// @route   GET /api/lens-thickness-options/:id
// @access  Public
exports.getLensThicknessOption = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const option = await prisma.lensThicknessOption.findFirst({
    where: {
      id: parseInt(id),
      is_active: true
    }
  });

  if (!option) {
    return error(res, 'Lens thickness option not found', 404);
  }

  return success(res, 'Lens thickness option retrieved successfully', {
    option: formatLensThicknessOption(option)
  });
});

// ==================== LENS THICKNESS OPTIONS - ADMIN ====================

// @desc    Get all lens thickness options (Admin)
// @route   GET /api/admin/lens-thickness-options
// @access  Private/Admin
exports.getAllLensThicknessOptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (isActive !== undefined) {
    where.is_active = isActive === 'true';
  }

  const [options, total] = await Promise.all([
    prisma.lensThicknessOption.findMany({
      where,
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'asc' }
      ],
      skip,
      take: parseInt(limit)
    }),
    prisma.lensThicknessOption.count({ where })
  ]);

  return success(res, 'Lens thickness options retrieved successfully', {
    options: options.map(formatLensThicknessOption),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Create lens thickness option (Admin)
// @route   POST /api/admin/lens-thickness-options
// @access  Private/Admin
exports.createLensThicknessOption = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    description,
    thickness_value,
    is_active = true,
    sort_order = 0
  } = req.body;

  if (!name) {
    return error(res, 'Name is required', 400);
  }

  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const option = await prisma.lensThicknessOption.create({
    data: {
      name,
      slug: finalSlug,
      description: description || null,
      thickness_value: thickness_value ? parseFloat(thickness_value) : null,
      is_active,
      sort_order: parseInt(sort_order)
    }
  });

  return success(res, 'Lens thickness option created successfully', {
    option: formatLensThicknessOption(option)
  }, 201);
});

// @desc    Update lens thickness option (Admin)
// @route   PUT /api/admin/lens-thickness-options/:id
// @access  Private/Admin
exports.updateLensThicknessOption = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {};

  const allowedFields = ['name', 'slug', 'description', 'thickness_value', 'is_active', 'sort_order'];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'thickness_value') {
        updateData[field] = req.body[field] ? parseFloat(req.body[field]) : null;
      } else if (field === 'sort_order') {
        updateData[field] = parseInt(req.body[field]);
      } else if (field === 'is_active') {
        updateData[field] = req.body[field] === true || req.body[field] === 'true';
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  const option = await prisma.lensThicknessOption.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Lens thickness option updated successfully', {
    option: formatLensThicknessOption(option)
  });
});

// @desc    Delete lens thickness option (Admin)
// @route   DELETE /api/admin/lens-thickness-options/:id
// @access  Private/Admin
exports.deleteLensThicknessOption = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const option = await prisma.lensThicknessOption.findUnique({
    where: { id: parseInt(id) }
  });

  if (!option) {
    return error(res, 'Lens thickness option not found', 404);
  }

  await prisma.lensThicknessOption.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Lens thickness option deleted successfully');
});

