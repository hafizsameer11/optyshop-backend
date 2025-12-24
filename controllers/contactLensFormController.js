const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// @desc    Get form configuration based on sub-sub-category
// @route   GET /api/contact-lens-forms/config/:sub_category_id
// @access  Public
exports.getFormConfig = asyncHandler(async (req, res) => {
  const { sub_category_id } = req.params;

  // Get the sub-sub-category
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(sub_category_id) },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!subCategory) {
    return error(res, 'Sub-sub-category not found', 404);
  }

  // Check if it's a sub-sub-category (has parent)
  if (!subCategory.parent_id) {
    return error(res, 'This is not a sub-sub-category', 400);
  }

  // Determine form type based on sub-sub-category name (case-insensitive)
  const subCategoryName = subCategory.name.toLowerCase();
  let formType = null;
  
  if (subCategoryName.includes('spherical') || subCategoryName === 'spherical') {
    formType = 'spherical';
  } else if (subCategoryName.includes('astigmatism') || subCategoryName === 'astigmatism') {
    formType = 'astigmatism';
  } else {
    return error(res, 'Unknown form type for this sub-sub-category', 400);
  }

  // Get form configuration
  let formConfig = {
    formType,
    subCategory: {
      id: subCategory.id,
      name: subCategory.name,
      slug: subCategory.slug
    }
  };

  if (formType === 'spherical') {
    // For Spherical: Return form structure (simple form with Qty, B.C, DIA)
    formConfig.formFields = {
      rightEye: {
        qty: { type: 'number', label: 'Qty', required: true, default: 1 },
        baseCurve: { type: 'number', label: 'Raggio Base (B.C)', required: true, step: 0.1 },
        diameter: { type: 'number', label: 'Diametro (DIA)', required: true, step: 0.1 }
      },
      leftEye: {
        qty: { type: 'number', label: 'Qty', required: true, default: 1 },
        baseCurve: { type: 'number', label: 'Raggio Base (B.C)', required: true, step: 0.1 },
        diameter: { type: 'number', label: 'Diametro (DIA)', required: true, step: 0.1 }
      }
    };
  } else if (formType === 'astigmatism') {
    // For Astigmatism: Get dropdown values from database
    const [powerValues, cylinderValues, axisValues] = await Promise.all([
      prisma.astigmatismDropdownValue.findMany({
        where: {
          field_type: 'power',
          is_active: true
        },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.astigmatismDropdownValue.findMany({
        where: {
          field_type: 'cylinder',
          is_active: true
        },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.astigmatismDropdownValue.findMany({
        where: {
          field_type: 'axis',
          is_active: true
        },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      })
    ]);

    formConfig.formFields = {
      rightEye: {
        qty: { type: 'number', label: 'Qty', required: true, default: 1 },
        baseCurve: { type: 'number', label: 'Raggio Base (B.C)', required: true, step: 0.1 },
        diameter: { type: 'number', label: 'Diametro (DIA)', required: true, step: 0.1 }
      },
      leftEye: {
        qty: { type: 'number', label: 'Qty', required: true, default: 1 },
        baseCurve: { type: 'number', label: 'Raggio Base (B.C)', required: true, step: 0.1 },
        diameter: { type: 'number', label: 'Diametro (DIA)', required: true, step: 0.1 },
        leftPower: {
          type: 'select',
          label: '* Occhio Sinistro PWR Power',
          required: true,
          options: powerValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        rightPower: {
          type: 'select',
          label: '* Occhio Destro PWR Power',
          required: true,
          options: powerValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        leftCylinder: {
          type: 'select',
          label: '* Cilindro (CYL) - Left',
          required: true,
          options: cylinderValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        rightCylinder: {
          type: 'select',
          label: '* Cilindro (CYL) - Right',
          required: true,
          options: cylinderValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        leftAxis: {
          type: 'select',
          label: '* Asse (AX) - Left',
          required: true,
          options: axisValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        rightAxis: {
          type: 'select',
          label: '* Asse (AX) - Right',
          required: true,
          options: axisValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        }
      }
    };

    formConfig.dropdownValues = {
      power: powerValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      cylinder: cylinderValues.map(v => ({ value: v.value, label: v.label || v.value })),
      axis: axisValues.map(v => ({ value: v.value, label: v.label || v.value }))
    };
  }

  return success(res, 'Form configuration retrieved successfully', formConfig);
});

// ==================== ADMIN ROUTES FOR SPHERICAL CONFIGURATIONS ====================

// @desc    Get all Spherical configurations
// @route   GET /api/admin/contact-lens-forms/spherical
// @access  Admin
exports.getSphericalConfigs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, sub_category_id } = req.query;
  const skip = (page - 1) * limit;

  const where = {
    configuration_type: 'spherical',
    is_active: true
  };

  if (sub_category_id) {
    where.sub_category_id = parseInt(sub_category_id);
  }

  const [configs, total] = await Promise.all([
    prisma.contactLensConfiguration.findMany({
      where,
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(skip)
    }),
    prisma.contactLensConfiguration.count({ where })
  ]);

  // Parse JSON fields
  const formattedConfigs = configs.map(config => ({
    ...config,
    right_qty: parseJsonField(config.right_qty),
    right_base_curve: parseJsonField(config.right_base_curve),
    right_diameter: parseJsonField(config.right_diameter),
    left_qty: parseJsonField(config.left_qty),
    left_base_curve: parseJsonField(config.left_base_curve),
    left_diameter: parseJsonField(config.left_diameter)
  }));

  return success(res, 'Spherical configurations retrieved successfully', {
    configs: formattedConfigs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Create Spherical configuration
// @route   POST /api/admin/contact-lens-forms/spherical
// @access  Admin
exports.createSphericalConfig = asyncHandler(async (req, res) => {
  const {
    name,
    sub_category_id,
    category_id,
    right_qty,
    right_base_curve,
    right_diameter,
    left_qty,
    left_base_curve,
    left_diameter,
    price,
    display_name
  } = req.body;

  // Validate required fields
  if (!name || !sub_category_id) {
    return error(res, 'Name and sub_category_id are required', 400);
  }

  // Verify sub-category exists and is a sub-sub-category
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(sub_category_id) }
  });

  if (!subCategory) {
    return error(res, 'Sub-sub-category not found', 404);
  }

  if (!subCategory.parent_id) {
    return error(res, 'This is not a sub-sub-category', 400);
  }

  // Create configuration
  const config = await prisma.contactLensConfiguration.create({
    data: {
      name,
      sub_category_id: parseInt(sub_category_id),
      category_id: category_id ? parseInt(category_id) : subCategory.category_id,
      configuration_type: 'spherical',
      right_qty: Array.isArray(right_qty) ? JSON.stringify(right_qty) : JSON.stringify([right_qty || 1]),
      right_base_curve: Array.isArray(right_base_curve) ? JSON.stringify(right_base_curve) : JSON.stringify([right_base_curve]),
      right_diameter: Array.isArray(right_diameter) ? JSON.stringify(right_diameter) : JSON.stringify([right_diameter]),
      left_qty: Array.isArray(left_qty) ? JSON.stringify(left_qty) : JSON.stringify([left_qty || 1]),
      left_base_curve: Array.isArray(left_base_curve) ? JSON.stringify(left_base_curve) : JSON.stringify([left_base_curve]),
      left_diameter: Array.isArray(left_diameter) ? JSON.stringify(left_diameter) : JSON.stringify([left_diameter]),
      price: price ? parseFloat(price) : null,
      display_name: display_name || name
    },
    include: {
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  return success(res, 'Spherical configuration created successfully', {
    config: {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter)
    }
  }, 201);
});

// @desc    Update Spherical configuration
// @route   PUT /api/admin/contact-lens-forms/spherical/:id
// @access  Admin
exports.updateSphericalConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    right_qty,
    right_base_curve,
    right_diameter,
    left_qty,
    left_base_curve,
    left_diameter,
    price,
    display_name,
    is_active
  } = req.body;

  // Check if config exists
  const existingConfig = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingConfig) {
    return error(res, 'Configuration not found', 404);
  }

  if (existingConfig.configuration_type !== 'spherical') {
    return error(res, 'This is not a Spherical configuration', 400);
  }

  // Prepare update data
  const updateData = {};
  if (name) updateData.name = name;
  if (display_name) updateData.display_name = display_name;
  if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (right_qty !== undefined) {
    updateData.right_qty = Array.isArray(right_qty) ? JSON.stringify(right_qty) : JSON.stringify([right_qty]);
  }
  if (right_base_curve !== undefined) {
    updateData.right_base_curve = Array.isArray(right_base_curve) ? JSON.stringify(right_base_curve) : JSON.stringify([right_base_curve]);
  }
  if (right_diameter !== undefined) {
    updateData.right_diameter = Array.isArray(right_diameter) ? JSON.stringify(right_diameter) : JSON.stringify([right_diameter]);
  }
  if (left_qty !== undefined) {
    updateData.left_qty = Array.isArray(left_qty) ? JSON.stringify(left_qty) : JSON.stringify([left_qty]);
  }
  if (left_base_curve !== undefined) {
    updateData.left_base_curve = Array.isArray(left_base_curve) ? JSON.stringify(left_base_curve) : JSON.stringify([left_base_curve]);
  }
  if (left_diameter !== undefined) {
    updateData.left_diameter = Array.isArray(left_diameter) ? JSON.stringify(left_diameter) : JSON.stringify([left_diameter]);
  }

  const config = await prisma.contactLensConfiguration.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  return success(res, 'Spherical configuration updated successfully', {
    config: {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter)
    }
  });
});

// @desc    Delete Spherical configuration
// @route   DELETE /api/admin/contact-lens-forms/spherical/:id
// @access  Admin
exports.deleteSphericalConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const config = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!config) {
    return error(res, 'Configuration not found', 404);
  }

  if (config.configuration_type !== 'spherical') {
    return error(res, 'This is not a Spherical configuration', 400);
  }

  await prisma.contactLensConfiguration.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Spherical configuration deleted successfully');
});

// ==================== ADMIN ROUTES FOR ASTIGMATISM DROPDOWN VALUES ====================

// @desc    Get all Astigmatism dropdown values
// @route   GET /api/admin/contact-lens-forms/astigmatism/dropdown-values
// @access  Admin
exports.getAstigmatismDropdownValues = asyncHandler(async (req, res) => {
  const { field_type, eye_type } = req.query;

  const where = { is_active: true };
  if (field_type) {
    where.field_type = field_type;
  }
  if (eye_type) {
    where.eye_type = eye_type;
  }

  const values = await prisma.astigmatismDropdownValue.findMany({
    where,
    orderBy: [
      { field_type: 'asc' },
      { sort_order: 'asc' },
      { value: 'asc' }
    ]
  });

  // Group by field type
  const grouped = {
    power: values.filter(v => v.field_type === 'power'),
    cylinder: values.filter(v => v.field_type === 'cylinder'),
    axis: values.filter(v => v.field_type === 'axis')
  };

  return success(res, 'Astigmatism dropdown values retrieved successfully', {
    values,
    grouped
  });
});

// @desc    Create Astigmatism dropdown value
// @route   POST /api/admin/contact-lens-forms/astigmatism/dropdown-values
// @access  Admin
exports.createAstigmatismDropdownValue = asyncHandler(async (req, res) => {
  const { field_type, value, label, eye_type, sort_order } = req.body;

  // Validate required fields
  if (!field_type || !value) {
    return error(res, 'field_type and value are required', 400);
  }

  // Validate field_type
  if (!['power', 'cylinder', 'axis'].includes(field_type)) {
    return error(res, 'field_type must be one of: power, cylinder, axis', 400);
  }

  // Validate eye_type if provided
  if (eye_type && !['left', 'right', 'both'].includes(eye_type)) {
    return error(res, 'eye_type must be one of: left, right, both', 400);
  }

  const dropdownValue = await prisma.astigmatismDropdownValue.create({
    data: {
      field_type,
      value: String(value),
      label: label || null,
      eye_type: eye_type || null,
      sort_order: sort_order || 0
    }
  });

  return success(res, 'Astigmatism dropdown value created successfully', {
    value: dropdownValue
  }, 201);
});

// @desc    Update Astigmatism dropdown value
// @route   PUT /api/admin/contact-lens-forms/astigmatism/dropdown-values/:id
// @access  Admin
exports.updateAstigmatismDropdownValue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { value, label, eye_type, sort_order, is_active } = req.body;

  // Check if value exists
  const existingValue = await prisma.astigmatismDropdownValue.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingValue) {
    return error(res, 'Dropdown value not found', 404);
  }

  // Prepare update data
  const updateData = {};
  if (value !== undefined) updateData.value = String(value);
  if (label !== undefined) updateData.label = label;
  if (eye_type !== undefined) {
    if (eye_type && !['left', 'right', 'both'].includes(eye_type)) {
      return error(res, 'eye_type must be one of: left, right, both', 400);
    }
    updateData.eye_type = eye_type || null;
  }
  if (sort_order !== undefined) updateData.sort_order = sort_order;
  if (is_active !== undefined) updateData.is_active = is_active;

  const dropdownValue = await prisma.astigmatismDropdownValue.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Astigmatism dropdown value updated successfully', {
    value: dropdownValue
  });
});

// @desc    Delete Astigmatism dropdown value
// @route   DELETE /api/admin/contact-lens-forms/astigmatism/dropdown-values/:id
// @access  Admin
exports.deleteAstigmatismDropdownValue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const dropdownValue = await prisma.astigmatismDropdownValue.findUnique({
    where: { id: parseInt(id) }
  });

  if (!dropdownValue) {
    return error(res, 'Dropdown value not found', 404);
  }

  await prisma.astigmatismDropdownValue.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Astigmatism dropdown value deleted successfully');
});

// ==================== WEBSITE/PUBLIC ROUTES ====================

// @desc    Get Astigmatism dropdown values (public)
// @route   GET /api/contact-lens-forms/astigmatism/dropdown-values
// @access  Public
exports.getAstigmatismDropdownValuesPublic = asyncHandler(async (req, res) => {
  const { field_type, eye_type } = req.query;

  const where = { is_active: true };
  if (field_type) {
    where.field_type = field_type;
  }
  if (eye_type) {
    where.eye_type = eye_type;
  }

  const values = await prisma.astigmatismDropdownValue.findMany({
    where,
    orderBy: [
      { field_type: 'asc' },
      { sort_order: 'asc' },
      { value: 'asc' }
    ]
  });

  // Group by field type
  const grouped = {
    power: values.filter(v => v.field_type === 'power'),
    cylinder: values.filter(v => v.field_type === 'cylinder'),
    axis: values.filter(v => v.field_type === 'axis')
  };

  return success(res, 'Astigmatism dropdown values retrieved successfully', {
    values,
    grouped
  });
});

// @desc    Get Spherical configurations (public)
// @route   GET /api/contact-lens-forms/spherical
// @access  Public
exports.getSphericalConfigsPublic = asyncHandler(async (req, res) => {
  const { sub_category_id } = req.query;

  const where = {
    configuration_type: 'spherical',
    is_active: true
  };

  if (sub_category_id) {
    where.sub_category_id = parseInt(sub_category_id);
  }

  const configs = await prisma.contactLensConfiguration.findMany({
    where,
    include: {
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: { sort_order: 'asc' }
  });

  // Parse JSON fields
  const formattedConfigs = configs.map(config => ({
    id: config.id,
    name: config.name,
    display_name: config.display_name,
    price: config.price,
    subCategory: config.subCategory,
    right_qty: parseJsonField(config.right_qty),
    right_base_curve: parseJsonField(config.right_base_curve),
    right_diameter: parseJsonField(config.right_diameter),
    left_qty: parseJsonField(config.left_qty),
    left_base_curve: parseJsonField(config.left_base_curve),
    left_diameter: parseJsonField(config.left_diameter)
  }));

  return success(res, 'Spherical configurations retrieved successfully', {
    configs: formattedConfigs
  });
});

// ==================== CHECKOUT ROUTES ====================

// @desc    Add contact lens to cart (checkout)
// @route   POST /api/contact-lens-forms/checkout
// @access  Private
exports.addContactLensToCart = asyncHandler(async (req, res) => {
  const {
    product_id,
    sub_category_id,
    form_type, // 'spherical' or 'astigmatism'
    // Spherical form data
    right_qty,
    right_base_curve,
    right_diameter,
    left_qty,
    left_base_curve,
    left_diameter,
    // Astigmatism form data
    left_power,
    right_power,
    left_cylinder,
    right_cylinder,
    left_axis,
    right_axis
  } = req.body;

  // Validate required fields
  if (!product_id) {
    return error(res, 'Product ID is required', 400);
  }

  if (!form_type || !['spherical', 'astigmatism'].includes(form_type)) {
    return error(res, 'Form type must be either "spherical" or "astigmatism"', 400);
  }

  // Get or create cart
  let cart = await prisma.cart.findUnique({ where: { user_id: req.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { user_id: req.user.id } });
  }

  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id: parseInt(product_id) } });
  if (!product) {
    return error(res, 'Product not found', 404);
  }

  // Prepare contact lens data
  const contactLensData = {
    contact_lens_right_qty: right_qty ? parseInt(right_qty) : 1,
    contact_lens_right_base_curve: right_base_curve ? parseFloat(right_base_curve) : null,
    contact_lens_right_diameter: right_diameter ? parseFloat(right_diameter) : null,
    contact_lens_left_qty: left_qty ? parseInt(left_qty) : 1,
    contact_lens_left_base_curve: left_base_curve ? parseFloat(left_base_curve) : null,
    contact_lens_left_diameter: left_diameter ? parseFloat(left_diameter) : null
  };

  // Add astigmatism fields if form type is astigmatism
  if (form_type === 'astigmatism') {
    contactLensData.contact_lens_left_power = left_power ? parseFloat(left_power) : null;
    contactLensData.contact_lens_right_power = right_power ? parseFloat(right_power) : null;
    // Note: CartItem schema doesn't have separate left/right cylinder and axis fields
    // These would need to be stored in customization field as JSON
    const astigmatismData = {
      left_cylinder: left_cylinder ? parseFloat(left_cylinder) : null,
      right_cylinder: right_cylinder ? parseFloat(right_cylinder) : null,
      left_axis: left_axis ? parseInt(left_axis) : null,
      right_axis: right_axis ? parseInt(right_axis) : null
    };
    contactLensData.customization = JSON.stringify(astigmatismData);
  }

  // Calculate quantity (sum of left and right)
  const quantity = (contactLensData.contact_lens_right_qty || 0) + (contactLensData.contact_lens_left_qty || 0);

  // Check stock
  if (product.stock_quantity < quantity) {
    return error(res, 'Insufficient stock', 400);
  }

  // Create cart item
  const cartItem = await prisma.cartItem.create({
    data: {
      cart_id: cart.id,
      product_id: parseInt(product_id),
      quantity: quantity,
      unit_price: product.price,
      ...contactLensData
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true
        }
      }
    }
  });

  // Parse customization for response
  const parsedItem = {
    ...cartItem,
    customization: cartItem.customization ? JSON.parse(cartItem.customization) : null
  };

  return success(res, 'Contact lens added to cart successfully', {
    item: parsedItem
  }, 201);
});

// Helper function to parse JSON fields
const parseJsonField = (value) => {
  if (!value) return null;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (e) {
    return value;
  }
};

