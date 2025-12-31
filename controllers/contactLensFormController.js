const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// Helper function to parse JSON fields
const parseJsonField = (value) => {
  if (!value) return null;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (e) {
    return value;
  }
};

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
    // For Spherical: Get Qty, Base Curve, Diameter from astigmatism dropdown values
    // But get Power values from Spherical configurations themselves
    const [qtyValues, baseCurveValues, diameterValues, sphericalConfigs] = await Promise.all([
      prisma.astigmatismDropdownValue.findMany({
        where: { field_type: 'qty', is_active: true },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.astigmatismDropdownValue.findMany({
        where: { field_type: 'base_curve', is_active: true },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.astigmatismDropdownValue.findMany({
        where: { field_type: 'diameter', is_active: true },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.contactLensConfiguration.findMany({
        where: {
          configuration_type: 'spherical',
          sub_category_id: parseInt(sub_category_id),
          is_active: true
        },
        select: {
          right_power: true,
          left_power: true
        }
      })
    ]);

    // Extract unique power values from spherical configurations
    const powerValueSet = new Set();
    sphericalConfigs.forEach(config => {
      const rightPower = parseJsonField(config.right_power);
      const leftPower = parseJsonField(config.left_power);
      
      if (Array.isArray(rightPower)) {
        rightPower.forEach(val => {
          if (val !== null && val !== undefined) {
            powerValueSet.add(String(val));
          }
        });
      }
      if (Array.isArray(leftPower)) {
        leftPower.forEach(val => {
          if (val !== null && val !== undefined) {
            powerValueSet.add(String(val));
          }
        });
      }
    });

    // Convert power values to dropdown format (sorted)
    const powerValues = Array.from(powerValueSet)
      .sort((a, b) => {
        // Sort numerically if possible, otherwise alphabetically
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      })
      .map(value => ({
        id: null, // Not from database, so no ID
        field_type: 'power',
        value: value,
        label: value,
        eye_type: null, // Can be used for both eyes
        is_active: true,
        sort_order: 0,
        created_at: null,
        updated_at: null
      }));

    // For Spherical: Return form structure with ALL fields as dropdowns
    formConfig.formFields = {
      rightEye: {
        qty: {
          type: 'select',
          label: 'Qty',
          required: true,
          options: qtyValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        baseCurve: {
          type: 'select',
          label: 'Raggio Base (B.C)',
          required: true,
          options: baseCurveValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        diameter: {
          type: 'select',
          label: 'Diametro (DIA)',
          required: true,
          options: diameterValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        power: {
          type: 'select',
          label: '* Power (PWR)',
          required: true,
          options: powerValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        }
      },
      leftEye: {
        qty: {
          type: 'select',
          label: 'Qty',
          required: true,
          options: qtyValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        baseCurve: {
          type: 'select',
          label: 'Raggio Base (B.C)',
          required: true,
          options: baseCurveValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        diameter: {
          type: 'select',
          label: 'Diametro (DIA)',
          required: true,
          options: diameterValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        power: {
          type: 'select',
          label: '* Power (PWR)',
          required: true,
          options: powerValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        }
      }
    };

    formConfig.dropdownValues = {
      qty: qtyValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      base_curve: baseCurveValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      diameter: diameterValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      power: powerValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type }))
    };
  } else if (formType === 'astigmatism') {
    // For Astigmatism: Get ALL dropdown values from database (Qty, Base Curve, Diameter, Power, Cylinder, Axis)
    const [qtyValues, baseCurveValues, diameterValues, powerValues, cylinderValues, axisValues] = await Promise.all([
      prisma.astigmatismDropdownValue.findMany({
        where: { field_type: 'qty', is_active: true },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.astigmatismDropdownValue.findMany({
        where: { field_type: 'base_curve', is_active: true },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.astigmatismDropdownValue.findMany({
        where: { field_type: 'diameter', is_active: true },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.astigmatismDropdownValue.findMany({
        where: { field_type: 'power', is_active: true },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.astigmatismDropdownValue.findMany({
        where: { field_type: 'cylinder', is_active: true },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.astigmatismDropdownValue.findMany({
        where: { field_type: 'axis', is_active: true },
        orderBy: [{ sort_order: 'asc' }, { value: 'asc' }]
      })
    ]);

    formConfig.formFields = {
      rightEye: {
        qty: {
          type: 'select',
          label: 'Qty',
          required: true,
          options: qtyValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        baseCurve: {
          type: 'select',
          label: 'Raggio Base (B.C)',
          required: true,
          options: baseCurveValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        diameter: {
          type: 'select',
          label: 'Diametro (DIA)',
          required: true,
          options: diameterValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        }
      },
      leftEye: {
        qty: {
          type: 'select',
          label: 'Qty',
          required: true,
          options: qtyValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        baseCurve: {
          type: 'select',
          label: 'Raggio Base (B.C)',
          required: true,
          options: baseCurveValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        diameter: {
          type: 'select',
          label: 'Diametro (DIA)',
          required: true,
          options: diameterValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
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
      qty: qtyValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      base_curve: baseCurveValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      diameter: diameterValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      power: powerValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      cylinder: cylinderValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      axis: axisValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type }))
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
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            price: true
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
    right_power: parseJsonField(config.right_power),
    left_qty: parseJsonField(config.left_qty),
    left_base_curve: parseJsonField(config.left_base_curve),
    left_diameter: parseJsonField(config.left_diameter),
    left_power: parseJsonField(config.left_power)
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
    product_id,
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    price,
    display_name,
    copy_right_to_left, // New flag: if true, copy right eye values to left eye
    same_for_both_eyes // Alternative flag name for same functionality
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

  // Validate product_id if provided (must be a contact lens product)
  let productId = null;
  if (product_id) {
    productId = parseInt(product_id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        subCategory: true
      }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    if (product.product_type !== 'contact_lens') {
      return error(res, 'Only contact lens products can be assigned to configurations', 400);
    }

    // Verify product belongs to the same category/subcategory hierarchy
    if (product.category_id !== subCategory.category_id) {
      return error(res, 'Product category does not match the configuration category', 400);
    }
  }

  // Determine if we should copy right to left
  const shouldCopyRightToLeft = copy_right_to_left === true || same_for_both_eyes === true;

  // Prepare left eye values - copy from right if flag is set, otherwise use provided values
  let finalLeftQty = left_qty;
  let finalLeftBaseCurve = left_base_curve;
  let finalLeftDiameter = left_diameter;
  let finalLeftPower = left_power;

  if (shouldCopyRightToLeft) {
    // Copy right eye values to left eye
    finalLeftQty = right_qty;
    finalLeftBaseCurve = right_base_curve;
    finalLeftDiameter = right_diameter;
    finalLeftPower = right_power;
  }

  // Create configuration
  const config = await prisma.contactLensConfiguration.create({
    data: {
      name,
      sub_category_id: parseInt(sub_category_id),
      category_id: category_id ? parseInt(category_id) : subCategory.category_id,
      product_id: productId,
      configuration_type: 'spherical',
      right_qty: right_qty !== undefined ? (Array.isArray(right_qty) ? JSON.stringify(right_qty) : JSON.stringify([right_qty || 1])) : JSON.stringify([1]),
      right_base_curve: right_base_curve !== undefined ? (Array.isArray(right_base_curve) ? JSON.stringify(right_base_curve) : JSON.stringify([right_base_curve])) : null,
      right_diameter: right_diameter !== undefined ? (Array.isArray(right_diameter) ? JSON.stringify(right_diameter) : JSON.stringify([right_diameter])) : null,
      right_power: right_power !== undefined ? (Array.isArray(right_power) ? JSON.stringify(right_power) : JSON.stringify([right_power])) : null,
      left_qty: finalLeftQty !== undefined ? (Array.isArray(finalLeftQty) ? JSON.stringify(finalLeftQty) : JSON.stringify([finalLeftQty || 1])) : null,
      left_base_curve: finalLeftBaseCurve !== undefined ? (Array.isArray(finalLeftBaseCurve) ? JSON.stringify(finalLeftBaseCurve) : JSON.stringify([finalLeftBaseCurve])) : null,
      left_diameter: finalLeftDiameter !== undefined ? (Array.isArray(finalLeftDiameter) ? JSON.stringify(finalLeftDiameter) : JSON.stringify([finalLeftDiameter])) : null,
      left_power: finalLeftPower !== undefined ? (Array.isArray(finalLeftPower) ? JSON.stringify(finalLeftPower) : JSON.stringify([finalLeftPower])) : null,
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
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true
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
      left_diameter: parseJsonField(config.left_diameter),
      right_power: parseJsonField(config.right_power),
      left_power: parseJsonField(config.left_power)
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
    product_id,
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    price,
    display_name,
    is_active,
    copy_right_to_left, // New flag: if true, copy right eye values to left eye
    same_for_both_eyes // Alternative flag name for same functionality
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

  // Determine if we should copy right to left
  const shouldCopyRightToLeft = copy_right_to_left === true || same_for_both_eyes === true;

  // Prepare update data
  const updateData = {};

  // Validate product_id if provided (must be a contact lens product)
  if (product_id !== undefined) {
    if (product_id === null || product_id === '') {
      updateData.product_id = null;
    } else {
      const productId = parseInt(product_id);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          subCategory: true
        }
      });

      if (!product) {
        return error(res, 'Product not found', 404);
      }

      if (product.product_type !== 'contact_lens') {
        return error(res, 'Only contact lens products can be assigned to configurations', 400);
      }

      // Verify product belongs to the same category/subcategory hierarchy
      if (product.category_id !== existingConfig.category_id) {
        return error(res, 'Product category does not match the configuration category', 400);
      }

      updateData.product_id = productId;
    }
  }
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
  if (right_power !== undefined) {
    updateData.right_power = Array.isArray(right_power) ? JSON.stringify(right_power) : JSON.stringify([right_power]);
  }

  // Handle left eye values - copy from right if flag is set
  if (shouldCopyRightToLeft) {
    // Use right eye values for left eye (use updated right values if provided, otherwise use existing)
    const rightQtyToUse = right_qty !== undefined ? right_qty : parseJsonField(existingConfig.right_qty);
    const rightBaseCurveToUse = right_base_curve !== undefined ? right_base_curve : parseJsonField(existingConfig.right_base_curve);
    const rightDiameterToUse = right_diameter !== undefined ? right_diameter : parseJsonField(existingConfig.right_diameter);
    const rightPowerToUse = right_power !== undefined ? right_power : parseJsonField(existingConfig.right_power);

    updateData.left_qty = Array.isArray(rightQtyToUse) ? JSON.stringify(rightQtyToUse) : JSON.stringify([rightQtyToUse || 1]);
    updateData.left_base_curve = Array.isArray(rightBaseCurveToUse) ? JSON.stringify(rightBaseCurveToUse) : JSON.stringify([rightBaseCurveToUse]);
    updateData.left_diameter = Array.isArray(rightDiameterToUse) ? JSON.stringify(rightDiameterToUse) : JSON.stringify([rightDiameterToUse]);
    updateData.left_power = Array.isArray(rightPowerToUse) ? JSON.stringify(rightPowerToUse) : JSON.stringify([rightPowerToUse]);
  } else {
    // Use provided left eye values
    if (left_qty !== undefined) {
      updateData.left_qty = Array.isArray(left_qty) ? JSON.stringify(left_qty) : JSON.stringify([left_qty]);
    }
    if (left_base_curve !== undefined) {
      updateData.left_base_curve = Array.isArray(left_base_curve) ? JSON.stringify(left_base_curve) : JSON.stringify([left_base_curve]);
    }
    if (left_diameter !== undefined) {
      updateData.left_diameter = Array.isArray(left_diameter) ? JSON.stringify(left_diameter) : JSON.stringify([left_diameter]);
    }
    if (left_power !== undefined) {
      updateData.left_power = Array.isArray(left_power) ? JSON.stringify(left_power) : JSON.stringify([left_power]);
    }
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
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true
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
      left_diameter: parseJsonField(config.left_diameter),
      right_power: parseJsonField(config.right_power),
      left_power: parseJsonField(config.left_power)
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

// ==================== ADMIN ROUTES FOR ASTIGMATISM CONFIGURATIONS ====================

// @desc    Get all Astigmatism configurations
// @route   GET /api/admin/contact-lens-forms/astigmatism
// @access  Admin
exports.getAstigmatismConfigs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, sub_category_id } = req.query;
  const skip = (page - 1) * limit;

  const where = {
    configuration_type: 'astigmatism',
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
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            price: true
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
    right_power: parseJsonField(config.right_power),
    right_cylinder: parseJsonField(config.right_cylinder),
    right_axis: parseJsonField(config.right_axis),
    left_qty: parseJsonField(config.left_qty),
    left_base_curve: parseJsonField(config.left_base_curve),
    left_diameter: parseJsonField(config.left_diameter),
    left_power: parseJsonField(config.left_power),
    left_cylinder: parseJsonField(config.left_cylinder),
    left_axis: parseJsonField(config.left_axis)
  }));

  return success(res, 'Astigmatism configurations retrieved successfully', {
    configs: formattedConfigs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Create Astigmatism configuration
// @route   POST /api/admin/contact-lens-forms/astigmatism
// @access  Admin
exports.createAstigmatismConfig = asyncHandler(async (req, res) => {
  const {
    name,
    sub_category_id,
    category_id,
    product_id,
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    right_cylinder,
    right_axis,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    left_cylinder,
    left_axis,
    price,
    display_name,
    copy_right_to_left, // New flag: if true, copy right eye values to left eye
    same_for_both_eyes // Alternative flag name for same functionality
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

  // Validate product_id if provided (must be a contact lens product)
  let productId = null;
  if (product_id) {
    productId = parseInt(product_id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        subCategory: true
      }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    if (product.product_type !== 'contact_lens') {
      return error(res, 'Only contact lens products can be assigned to configurations', 400);
    }

    // Verify product belongs to the same category/subcategory hierarchy
    if (product.category_id !== subCategory.category_id) {
      return error(res, 'Product category does not match the configuration category', 400);
    }
  }

  // Determine if we should copy right to left
  const shouldCopyRightToLeft = copy_right_to_left === true || same_for_both_eyes === true;

  // Prepare left eye values - copy from right if flag is set, otherwise use provided values
  let finalLeftQty = left_qty;
  let finalLeftBaseCurve = left_base_curve;
  let finalLeftDiameter = left_diameter;
  let finalLeftPower = left_power;
  let finalLeftCylinder = left_cylinder;
  let finalLeftAxis = left_axis;

  if (shouldCopyRightToLeft) {
    // Copy right eye values to left eye
    finalLeftQty = right_qty;
    finalLeftBaseCurve = right_base_curve;
    finalLeftDiameter = right_diameter;
    finalLeftPower = right_power;
    finalLeftCylinder = right_cylinder;
    finalLeftAxis = right_axis;
  }

  // Create configuration
  const config = await prisma.contactLensConfiguration.create({
    data: {
      name,
      sub_category_id: parseInt(sub_category_id),
      category_id: category_id ? parseInt(category_id) : subCategory.category_id,
      product_id: productId,
      configuration_type: 'astigmatism',
      right_qty: Array.isArray(right_qty) ? JSON.stringify(right_qty) : JSON.stringify([right_qty || 1]),
      right_base_curve: Array.isArray(right_base_curve) ? JSON.stringify(right_base_curve) : JSON.stringify([right_base_curve]),
      right_diameter: Array.isArray(right_diameter) ? JSON.stringify(right_diameter) : JSON.stringify([right_diameter]),
      right_power: Array.isArray(right_power) ? JSON.stringify(right_power) : JSON.stringify([right_power]),
      right_cylinder: right_cylinder !== undefined ? (Array.isArray(right_cylinder) ? JSON.stringify(right_cylinder) : JSON.stringify([right_cylinder])) : null,
      right_axis: right_axis !== undefined ? (Array.isArray(right_axis) ? JSON.stringify(right_axis) : JSON.stringify([right_axis])) : null,
      left_qty: finalLeftQty !== undefined ? (Array.isArray(finalLeftQty) ? JSON.stringify(finalLeftQty) : JSON.stringify([finalLeftQty || 1])) : null,
      left_base_curve: finalLeftBaseCurve !== undefined ? (Array.isArray(finalLeftBaseCurve) ? JSON.stringify(finalLeftBaseCurve) : JSON.stringify([finalLeftBaseCurve])) : null,
      left_diameter: finalLeftDiameter !== undefined ? (Array.isArray(finalLeftDiameter) ? JSON.stringify(finalLeftDiameter) : JSON.stringify([finalLeftDiameter])) : null,
      left_power: finalLeftPower !== undefined ? (Array.isArray(finalLeftPower) ? JSON.stringify(finalLeftPower) : JSON.stringify([finalLeftPower])) : null,
      left_cylinder: finalLeftCylinder !== undefined ? (Array.isArray(finalLeftCylinder) ? JSON.stringify(finalLeftCylinder) : JSON.stringify([finalLeftCylinder])) : null,
      left_axis: finalLeftAxis !== undefined ? (Array.isArray(finalLeftAxis) ? JSON.stringify(finalLeftAxis) : JSON.stringify([finalLeftAxis])) : null,
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
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true
        }
      }
    }
  });

  return success(res, 'Astigmatism configuration created successfully', {
    config: {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      right_power: parseJsonField(config.right_power),
      right_cylinder: parseJsonField(config.right_cylinder),
      right_axis: parseJsonField(config.right_axis),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      left_power: parseJsonField(config.left_power),
      left_cylinder: parseJsonField(config.left_cylinder),
      left_axis: parseJsonField(config.left_axis)
    }
  }, 201);
});

// @desc    Update Astigmatism configuration
// @route   PUT /api/admin/contact-lens-forms/astigmatism/:id
// @access  Admin
exports.updateAstigmatismConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    product_id,
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    right_cylinder,
    right_axis,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    left_cylinder,
    left_axis,
    price,
    display_name,
    is_active,
    copy_right_to_left, // New flag: if true, copy right eye values to left eye
    same_for_both_eyes // Alternative flag name for same functionality
  } = req.body;

  // Check if config exists
  const existingConfig = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingConfig) {
    return error(res, 'Configuration not found', 404);
  }

  if (existingConfig.configuration_type !== 'astigmatism') {
    return error(res, 'This is not an Astigmatism configuration', 400);
  }

  // Determine if we should copy right to left
  const shouldCopyRightToLeft = copy_right_to_left === true || same_for_both_eyes === true;

  // Prepare update data
  const updateData = {};

  // Validate product_id if provided (must be a contact lens product)
  if (product_id !== undefined) {
    if (product_id === null || product_id === '') {
      updateData.product_id = null;
    } else {
      const productId = parseInt(product_id);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          subCategory: true
        }
      });

      if (!product) {
        return error(res, 'Product not found', 404);
      }

      if (product.product_type !== 'contact_lens') {
        return error(res, 'Only contact lens products can be assigned to configurations', 400);
      }

      // Verify product belongs to the same category/subcategory hierarchy
      if (product.category_id !== existingConfig.category_id) {
        return error(res, 'Product category does not match the configuration category', 400);
      }

      updateData.product_id = productId;
    }
  }
  if (name) updateData.name = name;
  if (display_name) updateData.display_name = display_name;
  if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
  if (is_active !== undefined) updateData.is_active = is_active;

  // Handle right eye fields
  const rightFields = ['right_qty', 'right_base_curve', 'right_diameter', 'right_power', 'right_cylinder', 'right_axis'];
  rightFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = Array.isArray(req.body[field]) ? JSON.stringify(req.body[field]) : JSON.stringify([req.body[field]]);
    }
  });

  // Handle left eye fields - copy from right if flag is set
  if (shouldCopyRightToLeft) {
    // Use right eye values for left eye (use updated right values if provided, otherwise use existing)
    const rightQtyToUse = right_qty !== undefined ? right_qty : parseJsonField(existingConfig.right_qty);
    const rightBaseCurveToUse = right_base_curve !== undefined ? right_base_curve : parseJsonField(existingConfig.right_base_curve);
    const rightDiameterToUse = right_diameter !== undefined ? right_diameter : parseJsonField(existingConfig.right_diameter);
    const rightPowerToUse = right_power !== undefined ? right_power : parseJsonField(existingConfig.right_power);
    const rightCylinderToUse = right_cylinder !== undefined ? right_cylinder : parseJsonField(existingConfig.right_cylinder);
    const rightAxisToUse = right_axis !== undefined ? right_axis : parseJsonField(existingConfig.right_axis);

    updateData.left_qty = Array.isArray(rightQtyToUse) ? JSON.stringify(rightQtyToUse) : JSON.stringify([rightQtyToUse || 1]);
    updateData.left_base_curve = Array.isArray(rightBaseCurveToUse) ? JSON.stringify(rightBaseCurveToUse) : JSON.stringify([rightBaseCurveToUse]);
    updateData.left_diameter = Array.isArray(rightDiameterToUse) ? JSON.stringify(rightDiameterToUse) : JSON.stringify([rightDiameterToUse]);
    updateData.left_power = Array.isArray(rightPowerToUse) ? JSON.stringify(rightPowerToUse) : JSON.stringify([rightPowerToUse]);
    updateData.left_cylinder = Array.isArray(rightCylinderToUse) ? JSON.stringify(rightCylinderToUse) : JSON.stringify([rightCylinderToUse]);
    updateData.left_axis = Array.isArray(rightAxisToUse) ? JSON.stringify(rightAxisToUse) : JSON.stringify([rightAxisToUse]);
  } else {
    // Use provided left eye values
    const leftFields = ['left_qty', 'left_base_curve', 'left_diameter', 'left_power', 'left_cylinder', 'left_axis'];
    leftFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = Array.isArray(req.body[field]) ? JSON.stringify(req.body[field]) : JSON.stringify([req.body[field]]);
      }
    });
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
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true
        }
      }
    }
  });

  return success(res, 'Astigmatism configuration updated successfully', {
    config: {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      right_power: parseJsonField(config.right_power),
      right_cylinder: parseJsonField(config.right_cylinder),
      right_axis: parseJsonField(config.right_axis),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      left_power: parseJsonField(config.left_power),
      left_cylinder: parseJsonField(config.left_cylinder),
      left_axis: parseJsonField(config.left_axis)
    }
  });
});

// @desc    Delete Astigmatism configuration
// @route   DELETE /api/admin/contact-lens-forms/astigmatism/:id
// @access  Admin
exports.deleteAstigmatismConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const config = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!config) {
    return error(res, 'Configuration not found', 404);
  }

  if (config.configuration_type !== 'astigmatism') {
    return error(res, 'This is not an Astigmatism configuration', 400);
  }

  await prisma.contactLensConfiguration.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Astigmatism configuration deleted successfully');
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
  if (!['qty', 'base_curve', 'diameter', 'power', 'cylinder', 'axis'].includes(field_type)) {
    return error(res, 'field_type must be one of: qty, base_curve, diameter, power, cylinder, axis', 400);
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
    right_power: parseJsonField(config.right_power),
    left_qty: parseJsonField(config.left_qty),
    left_base_curve: parseJsonField(config.left_base_curve),
    left_diameter: parseJsonField(config.left_diameter),
    left_power: parseJsonField(config.left_power)
  }));

  return success(res, 'Spherical configurations retrieved successfully', {
    configs: formattedConfigs
  });
});

// @desc    Get Astigmatism configurations (public)
// @route   GET /api/contact-lens-forms/astigmatism
// @access  Public
exports.getAstigmatismConfigsPublic = asyncHandler(async (req, res) => {
  const { sub_category_id } = req.query;

  const where = {
    configuration_type: 'astigmatism',
    is_active: true
  };

  if (sub_category_id) {
    where.sub_category_id = parseInt(sub_category_id);
  }

  const configs = await prisma.contactLensConfiguration.findMany({
    where,
    select: {
      id: true,
      name: true,
      display_name: true,
      price: true,
      right_qty: true,
      right_base_curve: true,
      right_diameter: true,
      right_power: true,
      right_cylinder: true,
      right_axis: true,
      left_qty: true,
      left_base_curve: true,
      left_diameter: true,
      left_power: true,
      left_cylinder: true,
      left_axis: true,
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
    right_power: parseJsonField(config.right_power),
    right_cylinder: parseJsonField(config.right_cylinder),
    right_axis: parseJsonField(config.right_axis),
    left_qty: parseJsonField(config.left_qty),
    left_base_curve: parseJsonField(config.left_base_curve),
    left_diameter: parseJsonField(config.left_diameter),
    left_power: parseJsonField(config.left_power),
    left_cylinder: parseJsonField(config.left_cylinder),
    left_axis: parseJsonField(config.left_axis)
  }));

  return success(res, 'Astigmatism configurations retrieved successfully', {
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
    // Common form data (both Spherical and Astigmatism)
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    // Astigmatism form data only
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

  // Prepare contact lens data (common for both Spherical and Astigmatism)
  // All values come from dropdowns as strings, so we parse them carefully
  const parseNum = (val, type = 'float') => {
    if (val === undefined || val === null || val === '') return null;
    const parsed = type === 'int' ? parseInt(String(val)) : parseFloat(String(val));
    return isNaN(parsed) ? null : parsed;
  };

  const contactLensData = {
    contact_lens_right_qty: parseNum(right_qty, 'int') || 1,
    contact_lens_right_base_curve: parseNum(right_base_curve),
    contact_lens_right_diameter: parseNum(right_diameter),
    contact_lens_right_power: parseNum(right_power),
    contact_lens_left_qty: parseNum(left_qty, 'int') || 1,
    contact_lens_left_base_curve: parseNum(left_base_curve),
    contact_lens_left_diameter: parseNum(left_diameter),
    contact_lens_left_power: parseNum(left_power)
  };

  // Add astigmatism-specific fields if form type is astigmatism
  if (form_type === 'astigmatism') {
    // Note: CartItem schema doesn't have separate left/right cylinder and axis fields
    // These are stored in customization field as JSON
    // All values come from dropdowns as strings
    const astigmatismData = {
      left_cylinder: parseNum(left_cylinder),
      right_cylinder: parseNum(right_cylinder),
      left_axis: parseNum(left_axis, 'int'),
      right_axis: parseNum(right_axis, 'int')
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

  // Parse customization and images for response
  let productImages = cartItem.product.images;
  if (productImages) {
    try {
      productImages = typeof productImages === 'string' ? JSON.parse(productImages) : productImages;
      if (!Array.isArray(productImages)) {
        productImages = productImages ? [productImages] : [];
      }
    } catch (e) {
      productImages = [];
    }
  } else {
    productImages = [];
  }

  const parsedItem = {
    ...cartItem,
    customization: cartItem.customization ? JSON.parse(cartItem.customization) : null,
    product: {
      ...cartItem.product,
      images: productImages
    }
  };

  // Return success response (using 200 instead of 201 for consistency with frontend expectations)
  return success(res, 'Contact lens added to cart successfully', {
    item: parsedItem
  }, 200);
});

// @desc    Get contact lens products for admin (filtered by category/subcategory hierarchy)
// @route   GET /api/admin/contact-lens-forms/products
// @access  Admin
exports.getContactLensProducts = asyncHandler(async (req, res) => {
  const { category_id, sub_category_id, sub_sub_category_id } = req.query;

  // Build where clause - only contact lens products
  const where = {
    product_type: 'contact_lens',
    is_active: true
  };

  // Filter by category if provided
  if (category_id) {
    where.category_id = parseInt(category_id);
  }

  // Filter by subcategory (can be parent or child)
  if (sub_category_id) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(sub_category_id) },
      include: {
        children: {
          select: { id: true }
        }
      }
    });

    if (subCategory) {
      // If it has children, include products from both parent and children
      if (subCategory.children && subCategory.children.length > 0) {
        const subcategoryIds = [subCategory.id, ...subCategory.children.map(c => c.id)];
        where.sub_category_id = { in: subcategoryIds };
      } else {
        where.sub_category_id = subCategory.id;
      }
    }
  }

  // Filter by sub-sub-category (must be a child subcategory)
  if (sub_sub_category_id) {
    const subSubCategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(sub_sub_category_id) }
    });

    if (subSubCategory && subSubCategory.parent_id) {
      where.sub_category_id = subSubCategory.id;
    } else if (subSubCategory) {
      return error(res, 'The provided sub_sub_category_id is not a sub-sub-category (it does not have a parent)', 400);
    }
  }

  // Get products with category and subcategory info
  const products = await prisma.product.findMany({
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
          slug: true,
          parent_id: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Format products
  const formattedProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price.toString(),
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug
    } : null,
    subcategory: product.subCategory ? {
      id: product.subCategory.id,
      name: product.subCategory.name,
      slug: product.subCategory.slug,
      parent_id: product.subCategory.parent_id,
      parent: product.subCategory.parent ? {
        id: product.subCategory.parent.id,
        name: product.subCategory.parent.name,
        slug: product.subCategory.parent.slug
      } : null
    } : null
  }));

  return success(res, 'Contact lens products retrieved successfully', {
    products: formattedProducts,
    total: formattedProducts.length
  });
});

