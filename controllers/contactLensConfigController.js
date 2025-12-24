const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { success, error } = require("../utils/response");
const { uploadToS3 } = require("../config/aws");

// Helper function to normalize input to array
const normalizeToArray = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (Array.isArray(value)) {
    return value.filter(v => v !== null && v !== undefined && v !== '');
  }
  // If single value, convert to array
  return [value];
};

// Helper function to validate and convert array of numbers
const validateNumberArray = (arr, fieldName, allowDecimals = true) => {
  if (!arr || arr.length === 0) return null;
  const parsed = arr.map(val => {
    const num = allowDecimals ? parseFloat(val) : parseInt(val);
    if (isNaN(num)) {
      throw new Error(`${fieldName} contains invalid number: ${val}`);
    }
    return num;
  });
  return parsed.length > 0 ? parsed : null;
};

// Helper function to store array as JSON string
const storeArrayAsJSON = (arr) => {
  if (!arr || arr.length === 0) return null;
  return JSON.stringify(arr);
};

// Helper function to parse JSON string to array
const parseJSONArray = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// @desc    Create contact lens configuration
// @route   POST /api/admin/contact-lens-configs
// @access  Private/Admin
exports.createContactLensConfig = asyncHandler(async (req, res) => {
  const {
    // Product-like fields
    name,
    slug,
    sku,
    description,
    short_description,
    price,
    compare_at_price,
    cost_price,
    stock_quantity,
    stock_status,
    frame_shape,
    frame_material,
    frame_color,
    gender,
    lens_type, // Lens type enum
    // Category relationships
    category_id,
    sub_category_id,
    product_id,
    configuration_type, // 'spherical' or 'astigmatism'
    spherical_lens_type, // For spherical (e.g., "Daily", "Monthly")
    // Parameter fields - right eye
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    right_cylinder,
    right_axis,
    // Parameter fields - left eye
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    left_cylinder,
    left_axis,
    display_name,
    is_active,
    sort_order
  } = req.body;

  // Validate configuration_type
  if (!configuration_type || !['spherical', 'astigmatism'].includes(configuration_type)) {
    return error(res, "configuration_type must be 'spherical' or 'astigmatism'", 400);
  }

  // Validate name (required)
  if (!name || name.trim() === '') {
    return error(res, "name is required", 400);
  }

  // Validate display_name (required for dropdown)
  if (!display_name || display_name.trim() === '') {
    return error(res, "display_name is required", 400);
  }

  // IMPORTANT: Contact lens configurations MUST be linked to a sub-subcategory (not category or top-level subcategory)
  // The sub-subcategory must have a parent (parent_id is not null)
  // This ensures we're working with "Spherical" or "Astigmatism" sub-subcategories
  if (!sub_category_id) {
    return error(res, "sub_category_id is required. Contact lens configurations must be linked to a sub-subcategory (not a category or top-level subcategory).", 400);
  }

  // Normalize parameter fields to arrays
  const rightQtyArr = normalizeToArray(right_qty);
  const rightBaseCurveArr = normalizeToArray(right_base_curve);
  const rightDiameterArr = normalizeToArray(right_diameter);
  const rightPowerArr = normalizeToArray(right_power);
  const rightCylinderArr = normalizeToArray(right_cylinder);
  const rightAxisArr = normalizeToArray(right_axis);
  const leftQtyArr = normalizeToArray(left_qty);
  const leftBaseCurveArr = normalizeToArray(left_base_curve);
  const leftDiameterArr = normalizeToArray(left_diameter);
  const leftPowerArr = normalizeToArray(left_power);
  const leftCylinderArr = normalizeToArray(left_cylinder);
  const leftAxisArr = normalizeToArray(left_axis);

  // Validate spherical configuration
  if (configuration_type === 'spherical') {
    // At least one eye must have power
    if ((!rightPowerArr || rightPowerArr.length === 0) && (!leftPowerArr || leftPowerArr.length === 0)) {
      return error(res, "At least one eye (right or left) must have power for spherical configurations", 400);
    }

    // If right eye has power, validate required fields
    if (rightPowerArr && rightPowerArr.length > 0) {
      if (!rightBaseCurveArr || rightBaseCurveArr.length === 0 || !rightDiameterArr || rightDiameterArr.length === 0) {
        return error(res, "right_base_curve and right_diameter are required when right_power is provided", 400);
      }
    }

    // If left eye has power, validate required fields
    if (leftPowerArr && leftPowerArr.length > 0) {
      if (!leftBaseCurveArr || leftBaseCurveArr.length === 0 || !leftDiameterArr || leftDiameterArr.length === 0) {
        return error(res, "left_base_curve and left_diameter are required when left_power is provided", 400);
      }
    }

    // Spherical should not have cylinder or axis
    if ((rightCylinderArr && rightCylinderArr.length > 0) || (rightAxisArr && rightAxisArr.length > 0) || 
        (leftCylinderArr && leftCylinderArr.length > 0) || (leftAxisArr && leftAxisArr.length > 0)) {
      return error(res, "Spherical configurations should not include cylinder or axis fields. Use astigmatism type for those.", 400);
    }
  }

  // Validate astigmatism configuration
  if (configuration_type === 'astigmatism') {
    // At least one eye must have power
    if ((!rightPowerArr || rightPowerArr.length === 0) && (!leftPowerArr || leftPowerArr.length === 0)) {
      return error(res, "At least one eye (right or left) must have power for astigmatism configurations", 400);
    }

    // If right eye has power, validate required fields
    if (rightPowerArr && rightPowerArr.length > 0) {
      if (!rightBaseCurveArr || rightBaseCurveArr.length === 0 || !rightDiameterArr || rightDiameterArr.length === 0) {
        return error(res, "right_base_curve and right_diameter are required when right_power is provided", 400);
      }
      // For astigmatism, if cylinder is provided, axis must also be provided
      if (rightCylinderArr && rightCylinderArr.length > 0 && (!rightAxisArr || rightAxisArr.length === 0)) {
        return error(res, "right_axis is required when right_cylinder is provided", 400);
      }
    }

    // If left eye has power, validate required fields
    if (leftPowerArr && leftPowerArr.length > 0) {
      if (!leftBaseCurveArr || leftBaseCurveArr.length === 0 || !leftDiameterArr || leftDiameterArr.length === 0) {
        return error(res, "left_base_curve and left_diameter are required when left_power is provided", 400);
      }
      // For astigmatism, if cylinder is provided, axis must also be provided
      if (leftCylinderArr && leftCylinderArr.length > 0 && (!leftAxisArr || leftAxisArr.length === 0)) {
        return error(res, "left_axis is required when left_cylinder is provided", 400);
      }
    }
  }

  // Verify product exists if product_id is provided
  if (product_id) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(product_id) },
      select: { id: true, name: true, product_type: true }
    });
    if (!product) {
      return error(res, `Product with ID ${product_id} not found`, 404);
    }
    // Optionally validate that product is a contact lens type
    if (product.product_type !== 'contact_lens') {
      console.warn(`⚠️  Product ${product.id} is not of type 'contact_lens' (current type: ${product.product_type})`);
    }
  }

  // Verify subcategory exists and is a sub-subcategory (MUST have parent_id)
  const subcategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(sub_category_id) },
    include: {
      parent: {
        select: { id: true, name: true, slug: true }
      },
      category: {
        select: { id: true, name: true, slug: true }
      }
    }
  });

  if (!subcategory) {
    return error(res, `SubCategory with ID ${sub_category_id} not found`, 404);
  }

  // STRICT VALIDATION: Must be a sub-subcategory (has parent_id)
  if (!subcategory.parent_id) {
    return error(res, "Contact lens configurations can ONLY be created for sub-subcategories. The provided subcategory is a top-level subcategory (has no parent). Please select a sub-subcategory that belongs to a parent subcategory.", 400);
  }

  // Validate that the sub-subcategory name matches the configuration type
  const subcategoryNameLower = subcategory.name.toLowerCase();
  const isSpherical = subcategoryNameLower.includes('spherical') || 
                     subcategoryNameLower.includes('sferiche') ||
                     subcategoryNameLower.includes('sferica');
  const isAstigmatism = subcategoryNameLower.includes('astigmatism') || 
                       subcategoryNameLower.includes('astigmatismo') ||
                       subcategoryNameLower.includes('toric') ||
                       subcategoryNameLower.includes('torica');

  if (configuration_type === 'spherical' && !isSpherical) {
    return error(res, `Configuration type is "spherical" but the sub-subcategory "${subcategory.name}" does not appear to be a spherical type. Please select a sub-subcategory with "spherical", "sferiche", or "sferica" in its name.`, 400);
  }

  if (configuration_type === 'astigmatism' && !isAstigmatism) {
    return error(res, `Configuration type is "astigmatism" but the sub-subcategory "${subcategory.name}" does not appear to be an astigmatism type. Please select a sub-subcategory with "astigmatism", "astigmatismo", "toric", or "torica" in its name.`, 400);
  }

  // Set category_id from the subcategory's category (for consistency)
  const finalCategoryId = subcategory.category_id;
  if (category_id && parseInt(category_id) !== finalCategoryId) {
    return error(res, `SubCategory belongs to category "${subcategory.category.name}" (ID: ${finalCategoryId}), but category_id ${category_id} was provided. The category_id will be automatically set from the subcategory.`, 400);
  }

  // Handle image uploads if present
  let imagesArray = [];
  if (req.files && req.files.images) {
    try {
      for (const file of req.files.images) {
        const url = await uploadToS3(file, "contact-lens-configs");
        imagesArray.push(url);
      }
    } catch (uploadError) {
      console.error("Image upload error:", uploadError);
      return error(res, `Image upload failed: ${uploadError.message}`, 500);
    }
  }

  // Handle color-specific image uploads
  let colorImagesData = [];
  if (req.files && Object.keys(req.files).some(key => key.startsWith('color_images_'))) {
    try {
      const colorImageFiles = {};
      Object.keys(req.files).forEach(key => {
        if (key.startsWith('color_images_')) {
          const colorName = key.replace('color_images_', '');
          if (!colorImageFiles[colorName]) {
            colorImageFiles[colorName] = [];
          }
          const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
          files.forEach(file => colorImageFiles[colorName].push(file));
        }
      });

      const colorImagesMap = {};
      for (const [colorName, files] of Object.entries(colorImageFiles)) {
        const imageUrls = [];
        for (const file of files) {
          const url = await uploadToS3(file, `contact-lens-configs/colors/${colorName}`);
          imageUrls.push(url);
        }
        colorImagesMap[colorName] = imageUrls;
      }

      colorImagesData = Object.entries(colorImagesMap).map(([color, images]) => ({
        color,
        images: Array.isArray(images) ? images : [images]
      }));
    } catch (uploadError) {
      console.error("Color image upload error:", uploadError);
      return error(res, `Color image upload failed: ${uploadError.message}`, 500);
    }
  }

  // Generate slug if not provided
  let finalSlug = slug;
  if (!finalSlug || finalSlug.trim() === '') {
    finalSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    // Check if slug exists and make it unique
    let counter = 1;
    let uniqueSlug = finalSlug;
    while (true) {
      const existing = await prisma.contactLensConfiguration.findFirst({
        where: { slug: uniqueSlug }
      });
      if (!existing) break;
      uniqueSlug = `${finalSlug}-${counter}`;
      counter++;
    }
    finalSlug = uniqueSlug;
  } else {
    // Check if slug is unique
    const existing = await prisma.contactLensConfiguration.findFirst({
      where: { slug: finalSlug }
    });
    if (existing) {
      return error(res, `A configuration with slug "${finalSlug}" already exists. Please use a different slug.`, 400);
    }
  }

  // Check if SKU already exists (if provided)
  if (sku) {
    const existingSku = await prisma.contactLensConfiguration.findFirst({
      where: { sku: sku.trim() }
    });
    if (existingSku) {
      return error(res, `A configuration with SKU "${sku}" already exists. SKU must be unique.`, 400);
    }
  }

  // Prepare configuration data
  const configData = {
    name: name.trim(),
    slug: finalSlug,
    display_name: display_name.trim(),
    configuration_type,
    is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : true,
    sort_order: parseInt(sort_order) || 0
  };

  // Add optional product-like fields
  if (sku) configData.sku = sku.trim();
  if (description) configData.description = description.trim();
  if (short_description) configData.short_description = short_description.trim();
  if (price !== undefined) configData.price = parseFloat(price);
  if (compare_at_price !== undefined) configData.compare_at_price = parseFloat(compare_at_price);
  if (cost_price !== undefined) configData.cost_price = parseFloat(cost_price);
  if (stock_quantity !== undefined) configData.stock_quantity = parseInt(stock_quantity) || 0;
  if (stock_status) {
    const validStatuses = ['in_stock', 'out_of_stock', 'backorder'];
    if (validStatuses.includes(stock_status)) {
      configData.stock_status = stock_status;
    }
  }
  if (frame_shape) {
    const validShapes = ['round', 'square', 'oval', 'cat_eye', 'aviator', 'rectangle', 'wayfarer', 'geometric'];
    if (validShapes.includes(frame_shape)) {
      configData.frame_shape = frame_shape;
    }
  }
  if (frame_material) {
    const validMaterials = ['acetate', 'metal', 'tr90', 'titanium', 'wood', 'mixed'];
    if (validMaterials.includes(frame_material)) {
      configData.frame_material = frame_material;
    }
  }
  if (frame_color) configData.frame_color = frame_color.trim();
  if (gender) {
    const validGenders = ['men', 'women', 'unisex', 'kids'];
    if (validGenders.includes(gender)) {
      configData.gender = gender;
    }
  }
  if (lens_type) {
    const validLensTypes = ['prescription', 'sunglasses', 'reading', 'computer', 'photochromic', 'plastic', 'glass', 'polycarbonate', 'trivex', 'high_index'];
    if (validLensTypes.includes(lens_type)) {
      configData.lens_type = lens_type;
    }
  }

  // Add images
  if (imagesArray.length > 0) {
    configData.images = JSON.stringify(imagesArray);
  }
  if (colorImagesData.length > 0) {
    configData.color_images = JSON.stringify(colorImagesData);
  }

  // Add category relationships
  // Always set category_id from the subcategory's category
  configData.category_id = finalCategoryId;
  configData.sub_category_id = parseInt(sub_category_id);
  
  // Optional product_id link
  if (product_id) {
    configData.product_id = parseInt(product_id);
  }

  // Add type-specific fields - convert arrays to JSON strings
  try {
    // Spherical: Qty, Base Curve, Diameter, Power (no cylinder/axis)
    // Astigmatism: All fields including cylinder and axis
    // Both types support multiple selections (arrays)
    
    if (rightQtyArr && rightQtyArr.length > 0) {
      const validated = validateNumberArray(rightQtyArr, 'right_qty', false);
      if (validated) configData.right_qty = storeArrayAsJSON(validated);
    }
    if (rightBaseCurveArr && rightBaseCurveArr.length > 0) {
      const validated = validateNumberArray(rightBaseCurveArr, 'right_base_curve', true);
      if (validated) configData.right_base_curve = storeArrayAsJSON(validated);
    }
    if (rightDiameterArr && rightDiameterArr.length > 0) {
      const validated = validateNumberArray(rightDiameterArr, 'right_diameter', true);
      if (validated) configData.right_diameter = storeArrayAsJSON(validated);
    }
    if (rightPowerArr && rightPowerArr.length > 0) {
      const validated = validateNumberArray(rightPowerArr, 'right_power', true);
      if (validated) configData.right_power = storeArrayAsJSON(validated);
    }
    if (leftQtyArr && leftQtyArr.length > 0) {
      const validated = validateNumberArray(leftQtyArr, 'left_qty', false);
      if (validated) configData.left_qty = storeArrayAsJSON(validated);
    }
    if (leftBaseCurveArr && leftBaseCurveArr.length > 0) {
      const validated = validateNumberArray(leftBaseCurveArr, 'left_base_curve', true);
      if (validated) configData.left_base_curve = storeArrayAsJSON(validated);
    }
    if (leftDiameterArr && leftDiameterArr.length > 0) {
      const validated = validateNumberArray(leftDiameterArr, 'left_diameter', true);
      if (validated) configData.left_diameter = storeArrayAsJSON(validated);
    }
    if (leftPowerArr && leftPowerArr.length > 0) {
      const validated = validateNumberArray(leftPowerArr, 'left_power', true);
      if (validated) configData.left_power = storeArrayAsJSON(validated);
    }
    
    // Astigmatism-only fields
    if (configuration_type === 'astigmatism') {
      if (rightCylinderArr && rightCylinderArr.length > 0) {
        const validated = validateNumberArray(rightCylinderArr, 'right_cylinder', true);
        if (validated) configData.right_cylinder = storeArrayAsJSON(validated);
      }
      if (rightAxisArr && rightAxisArr.length > 0) {
        const validated = validateNumberArray(rightAxisArr, 'right_axis', false);
        if (validated) configData.right_axis = storeArrayAsJSON(validated);
      }
      if (leftCylinderArr && leftCylinderArr.length > 0) {
        const validated = validateNumberArray(leftCylinderArr, 'left_cylinder', true);
        if (validated) configData.left_cylinder = storeArrayAsJSON(validated);
      }
      if (leftAxisArr && leftAxisArr.length > 0) {
        const validated = validateNumberArray(leftAxisArr, 'left_axis', false);
        if (validated) configData.left_axis = storeArrayAsJSON(validated);
      }
    }
    
    // Optional spherical_lens_type (e.g., "Daily", "Monthly")
    if (spherical_lens_type) configData.spherical_lens_type = spherical_lens_type.trim();
  } catch (validationError) {
    return error(res, validationError.message, 400);
  }

  // Create the configuration
  const configuration = await prisma.contactLensConfiguration.create({
    data: configData,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          product_type: true
        }
      },
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    }
  });

  return success(res, "Contact lens configuration created successfully", { configuration }, 201);
});

// @desc    Get all contact lens configurations
// @route   GET /api/admin/contact-lens-configs
// @access  Private/Admin
exports.getContactLensConfigs = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    product_id, 
    sub_category_id, 
    configuration_type,
    is_active,
    search 
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (product_id) {
    where.product_id = parseInt(product_id);
  }

  if (sub_category_id) {
    where.sub_category_id = parseInt(sub_category_id);
  }

  if (configuration_type) {
    where.configuration_type = configuration_type;
  }

  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  if (search) {
    where.OR = [
      { display_name: { contains: search } },
      { name: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } }
    ];
  }

  const [configurations, total] = await Promise.all([
    prisma.contactLensConfiguration.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: [
        { sort_order: 'asc' },
        { created_at: 'desc' }
      ],
      include: {
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
            product_type: true
          }
        },
        subCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    }),
    prisma.contactLensConfiguration.count({ where })
  ]);

  // Format parameter arrays for each configuration
  const formattedConfigs = configurations.map(config => ({
    ...config,
    right_qty: parseJSONArray(config.right_qty),
    right_base_curve: parseJSONArray(config.right_base_curve),
    right_diameter: parseJSONArray(config.right_diameter),
    right_power: parseJSONArray(config.right_power),
    right_cylinder: parseJSONArray(config.right_cylinder),
    right_axis: parseJSONArray(config.right_axis),
    left_qty: parseJSONArray(config.left_qty),
    left_base_curve: parseJSONArray(config.left_base_curve),
    left_diameter: parseJSONArray(config.left_diameter),
    left_power: parseJSONArray(config.left_power),
    left_cylinder: parseJSONArray(config.left_cylinder),
    left_axis: parseJSONArray(config.left_axis)
  }));

  return success(res, "Contact lens configurations retrieved successfully", {
    configurations: formattedConfigs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get contact lens configuration by ID
// @route   GET /api/admin/contact-lens-configs/:id
// @access  Private/Admin
exports.getContactLensConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const configuration = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) },
    include: {
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
          product_type: true
        }
      },
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    }
  });

  if (!configuration) {
    return error(res, "Contact lens configuration not found", 404);
  }

  // Format images
  let images = [];
  let colorImages = [];
  
  if (configuration.images) {
    try {
      images = typeof configuration.images === 'string' ? JSON.parse(configuration.images) : configuration.images;
      if (!Array.isArray(images)) images = images ? [images] : [];
    } catch (e) {
      images = [];
    }
  }
  
  if (configuration.color_images) {
    try {
      colorImages = typeof configuration.color_images === 'string' ? JSON.parse(configuration.color_images) : configuration.color_images;
      if (!Array.isArray(colorImages)) colorImages = colorImages ? [colorImages] : [];
    } catch (e) {
      colorImages = [];
    }
  }
  
  // Parse parameter arrays
  const formattedConfig = {
    ...configuration,
    images,
    image: images && images.length > 0 ? images[0] : null,
    color_images: colorImages,
    right_qty: parseJSONArray(configuration.right_qty),
    right_base_curve: parseJSONArray(configuration.right_base_curve),
    right_diameter: parseJSONArray(configuration.right_diameter),
    right_power: parseJSONArray(configuration.right_power),
    right_cylinder: parseJSONArray(configuration.right_cylinder),
    right_axis: parseJSONArray(configuration.right_axis),
    left_qty: parseJSONArray(configuration.left_qty),
    left_base_curve: parseJSONArray(configuration.left_base_curve),
    left_diameter: parseJSONArray(configuration.left_diameter),
    left_power: parseJSONArray(configuration.left_power),
    left_cylinder: parseJSONArray(configuration.left_cylinder),
    left_axis: parseJSONArray(configuration.left_axis)
  };

  return success(res, "Contact lens configuration retrieved successfully", { configuration: formattedConfig });
});

// @desc    Update contact lens configuration
// @route   PUT /api/admin/contact-lens-configs/:id
// @access  Private/Admin
exports.updateContactLensConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const configuration = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!configuration) {
    return error(res, "Contact lens configuration not found", 404);
  }

  // Handle image uploads if present
  if (req.files && req.files.images) {
    try {
      // Parse existing images
      let existingImages = [];
      if (configuration.images) {
        try {
          existingImages = typeof configuration.images === 'string' ? JSON.parse(configuration.images) : configuration.images;
          if (!Array.isArray(existingImages)) existingImages = existingImages ? [existingImages] : [];
        } catch (e) {
          existingImages = [];
        }
      }

      // Upload new images
      const imageUrls = [...existingImages];
      for (const file of req.files.images) {
        const url = await uploadToS3(file, "contact-lens-configs");
        imageUrls.push(url);
      }
      updateData.images = JSON.stringify(imageUrls);
    } catch (uploadError) {
      console.error("Image upload error:", uploadError);
      return error(res, `Image upload failed: ${uploadError.message}`, 500);
    }
  }

  // Handle color-specific image uploads
  if (req.files && Object.keys(req.files).some(key => key.startsWith('color_images_'))) {
    try {
      // Parse existing color images
      let existingColorImages = [];
      if (configuration.color_images) {
        try {
          existingColorImages = typeof configuration.color_images === 'string' ? JSON.parse(configuration.color_images) : configuration.color_images;
          if (!Array.isArray(existingColorImages)) existingColorImages = existingColorImages ? [existingColorImages] : [];
        } catch (e) {
          existingColorImages = [];
        }
      }

      // Process uploaded color images
      const colorImageFiles = {};
      Object.keys(req.files).forEach(key => {
        if (key.startsWith('color_images_')) {
          const colorName = key.replace('color_images_', '');
          if (!colorImageFiles[colorName]) {
            colorImageFiles[colorName] = [];
          }
          const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
          files.forEach(file => colorImageFiles[colorName].push(file));
        }
      });

      const colorImagesMap = {};
      // Keep existing color images
      existingColorImages.forEach(item => {
        if (item.color && item.images) {
          colorImagesMap[item.color] = Array.isArray(item.images) ? item.images : [item.images];
        }
      });

      // Upload new color images
      for (const [colorName, files] of Object.entries(colorImageFiles)) {
        const imageUrls = [];
        for (const file of files) {
          const url = await uploadToS3(file, `contact-lens-configs/colors/${colorName}`);
          imageUrls.push(url);
        }
        const existingUrls = colorImagesMap[colorName] || [];
        colorImagesMap[colorName] = [...existingUrls, ...imageUrls];
      }

      const colorImagesArray = Object.entries(colorImagesMap).map(([color, images]) => ({
        color,
        images: Array.isArray(images) ? images : [images]
      }));

      if (colorImagesArray.length > 0) {
        updateData.color_images = JSON.stringify(colorImagesArray);
      }
    } catch (uploadError) {
      console.error("Color image upload error:", uploadError);
      return error(res, `Color image upload failed: ${uploadError.message}`, 500);
    }
  }

  // Validate configuration_type if provided
  if (updateData.configuration_type && !['spherical', 'astigmatism'].includes(updateData.configuration_type)) {
    return error(res, "configuration_type must be 'spherical' or 'astigmatism'", 400);
  }

  // Normalize parameter fields to arrays for validation
  const rightQtyArr = updateData.right_qty !== undefined ? normalizeToArray(updateData.right_qty) : null;
  const rightBaseCurveArr = updateData.right_base_curve !== undefined ? normalizeToArray(updateData.right_base_curve) : null;
  const rightDiameterArr = updateData.right_diameter !== undefined ? normalizeToArray(updateData.right_diameter) : null;
  const rightPowerArr = updateData.right_power !== undefined ? normalizeToArray(updateData.right_power) : null;
  const rightCylinderArr = updateData.right_cylinder !== undefined ? normalizeToArray(updateData.right_cylinder) : null;
  const rightAxisArr = updateData.right_axis !== undefined ? normalizeToArray(updateData.right_axis) : null;
  const leftQtyArr = updateData.left_qty !== undefined ? normalizeToArray(updateData.left_qty) : null;
  const leftBaseCurveArr = updateData.left_base_curve !== undefined ? normalizeToArray(updateData.left_base_curve) : null;
  const leftDiameterArr = updateData.left_diameter !== undefined ? normalizeToArray(updateData.left_diameter) : null;
  const leftPowerArr = updateData.left_power !== undefined ? normalizeToArray(updateData.left_power) : null;
  const leftCylinderArr = updateData.left_cylinder !== undefined ? normalizeToArray(updateData.left_cylinder) : null;
  const leftAxisArr = updateData.left_axis !== undefined ? normalizeToArray(updateData.left_axis) : null;

  // Get existing values as arrays for comparison
  const existingRightPower = parseJSONArray(configuration.right_power);
  const existingRightBaseCurve = parseJSONArray(configuration.right_base_curve);
  const existingRightDiameter = parseJSONArray(configuration.right_diameter);
  const existingLeftPower = parseJSONArray(configuration.left_power);
  const existingLeftBaseCurve = parseJSONArray(configuration.left_base_curve);
  const existingLeftDiameter = parseJSONArray(configuration.left_diameter);
  const existingRightAxis = parseJSONArray(configuration.right_axis);
  const existingLeftAxis = parseJSONArray(configuration.left_axis);

  // Validate spherical configuration
  if (updateData.configuration_type === 'spherical' || configuration.configuration_type === 'spherical') {
    // Validate right eye if power is provided
    if (rightPowerArr !== null) {
      if (rightPowerArr && rightPowerArr.length > 0 && 
          (!rightBaseCurveArr || rightBaseCurveArr.length === 0 || !rightDiameterArr || rightDiameterArr.length === 0)) {
        // Check existing values
        if (!existingRightBaseCurve || existingRightBaseCurve.length === 0 || 
            !existingRightDiameter || existingRightDiameter.length === 0) {
          return error(res, "right_base_curve and right_diameter are required when right_power is provided", 400);
        }
      }
    }

    // Validate left eye if power is provided
    if (leftPowerArr !== null) {
      if (leftPowerArr && leftPowerArr.length > 0 && 
          (!leftBaseCurveArr || leftBaseCurveArr.length === 0 || !leftDiameterArr || leftDiameterArr.length === 0)) {
        if (!existingLeftBaseCurve || existingLeftBaseCurve.length === 0 || 
            !existingLeftDiameter || existingLeftDiameter.length === 0) {
          return error(res, "left_base_curve and left_diameter are required when left_power is provided", 400);
        }
      }
    }

    // Spherical should not have cylinder or axis
    if ((rightCylinderArr !== null && rightCylinderArr && rightCylinderArr.length > 0) || 
        (rightAxisArr !== null && rightAxisArr && rightAxisArr.length > 0) || 
        (leftCylinderArr !== null && leftCylinderArr && leftCylinderArr.length > 0) || 
        (leftAxisArr !== null && leftAxisArr && leftAxisArr.length > 0)) {
      // If trying to set cylinder/axis, clear them
      updateData.right_cylinder = null;
      updateData.right_axis = null;
      updateData.left_cylinder = null;
      updateData.left_axis = null;
    }
  }

  // Validate astigmatism configuration
  if (updateData.configuration_type === 'astigmatism' || configuration.configuration_type === 'astigmatism') {
    // Validate right eye if power is provided
    if (rightPowerArr !== null) {
      if (rightPowerArr && rightPowerArr.length > 0 && 
          (!rightBaseCurveArr || rightBaseCurveArr.length === 0 || !rightDiameterArr || rightDiameterArr.length === 0)) {
        // Check existing values
        if (!existingRightBaseCurve || existingRightBaseCurve.length === 0 || 
            !existingRightDiameter || existingRightDiameter.length === 0) {
          return error(res, "right_base_curve and right_diameter are required when right_power is provided", 400);
        }
      }
      // For astigmatism, if cylinder is provided, axis must also be provided
      if (rightCylinderArr !== null && rightCylinderArr && rightCylinderArr.length > 0 && 
          (!rightAxisArr || rightAxisArr.length === 0)) {
        if (!existingRightAxis || existingRightAxis.length === 0) {
          return error(res, "right_axis is required when right_cylinder is provided", 400);
        }
      }
    }

    // Validate left eye if power is provided
    if (leftPowerArr !== null) {
      if (leftPowerArr && leftPowerArr.length > 0 && 
          (!leftBaseCurveArr || leftBaseCurveArr.length === 0 || !leftDiameterArr || leftDiameterArr.length === 0)) {
        if (!existingLeftBaseCurve || existingLeftBaseCurve.length === 0 || 
            !existingLeftDiameter || existingLeftDiameter.length === 0) {
          return error(res, "left_base_curve and left_diameter are required when left_power is provided", 400);
        }
      }
      // For astigmatism, if cylinder is provided, axis must also be provided
      if (leftCylinderArr !== null && leftCylinderArr && leftCylinderArr.length > 0 && 
          (!leftAxisArr || leftAxisArr.length === 0)) {
        if (!existingLeftAxis || existingLeftAxis.length === 0) {
          return error(res, "left_axis is required when left_cylinder is provided", 400);
        }
      }
    }
  }

  // Verify product exists if product_id is being updated
  if (updateData.product_id !== undefined) {
    if (updateData.product_id === null || updateData.product_id === '') {
      updateData.product_id = null;
    } else {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(updateData.product_id) }
      });
      if (!product) {
        return error(res, `Product with ID ${updateData.product_id} not found`, 404);
      }
      updateData.product_id = parseInt(updateData.product_id);
    }
  }

  // Verify category exists if category_id is being updated
  if (updateData.category_id !== undefined) {
    if (updateData.category_id === null || updateData.category_id === '') {
      updateData.category_id = null;
    } else {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(updateData.category_id) }
      });
      if (!category) {
        return error(res, `Category with ID ${updateData.category_id} not found`, 404);
      }
      updateData.category_id = parseInt(updateData.category_id);
    }
  }

  // Verify subcategory exists if sub_category_id is being updated
  // MUST be a sub-subcategory (has parent_id)
  if (updateData.sub_category_id !== undefined) {
    if (updateData.sub_category_id === null || updateData.sub_category_id === '') {
      return error(res, "sub_category_id cannot be null. Contact lens configurations must be linked to a sub-subcategory.", 400);
    } else {
      const subcategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(updateData.sub_category_id) },
        include: { 
          category: { select: { id: true, name: true } },
          parent: { select: { id: true, name: true } }
        }
      });
      if (!subcategory) {
        return error(res, `SubCategory with ID ${updateData.sub_category_id} not found`, 404);
      }
      
      // STRICT VALIDATION: Must be a sub-subcategory (has parent_id)
      if (!subcategory.parent_id) {
        return error(res, "Contact lens configurations can ONLY be linked to sub-subcategories. The provided subcategory is a top-level subcategory (has no parent). Please select a sub-subcategory that belongs to a parent subcategory.", 400);
      }
      
      // Validate configuration type matches sub-subcategory name
      if (updateData.configuration_type) {
        const subcategoryNameLower = subcategory.name.toLowerCase();
        const isSpherical = subcategoryNameLower.includes('spherical') || 
                           subcategoryNameLower.includes('sferiche') ||
                           subcategoryNameLower.includes('sferica');
        const isAstigmatism = subcategoryNameLower.includes('astigmatism') || 
                             subcategoryNameLower.includes('astigmatismo') ||
                             subcategoryNameLower.includes('toric') ||
                             subcategoryNameLower.includes('torica');

        if (updateData.configuration_type === 'spherical' && !isSpherical) {
          return error(res, `Configuration type is "spherical" but the sub-subcategory "${subcategory.name}" does not appear to be a spherical type. Please select a sub-subcategory with "spherical", "sferiche", or "sferica" in its name.`, 400);
        }

        if (updateData.configuration_type === 'astigmatism' && !isAstigmatism) {
          return error(res, `Configuration type is "astigmatism" but the sub-subcategory "${subcategory.name}" does not appear to be an astigmatism type. Please select a sub-subcategory with "astigmatism", "astigmatismo", "toric", or "torica" in its name.`, 400);
        }
      }
      
      // Auto-set category_id from subcategory's category
      updateData.category_id = subcategory.category_id;
      
      // If category_id was also provided, validate they match
      if (updateData.category_id !== undefined && subcategory.category_id !== updateData.category_id) {
        return error(res, `SubCategory belongs to category "${subcategory.category.name}" (ID: ${subcategory.category_id}), but category_id ${updateData.category_id} was provided. The category_id will be automatically set from the subcategory.`, 400);
      }
      updateData.sub_category_id = parseInt(updateData.sub_category_id);
    }
  }

  // Handle product-like fields
  if (updateData.name !== undefined) updateData.name = updateData.name.trim();
  if (updateData.slug !== undefined) {
    if (updateData.slug === null || updateData.slug === '') {
      // Generate slug from name if slug is cleared
      if (updateData.name || configuration.name) {
        const nameToUse = updateData.name || configuration.name;
        updateData.slug = nameToUse
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
    } else {
      updateData.slug = updateData.slug.trim();
      // Check if slug is unique (excluding current config)
      const existing = await prisma.contactLensConfiguration.findFirst({
        where: { slug: updateData.slug, id: { not: parseInt(id) } }
      });
      if (existing) {
        return error(res, `A configuration with slug "${updateData.slug}" already exists. Please use a different slug.`, 400);
      }
    }
  }
  if (updateData.sku !== undefined) {
    if (updateData.sku === null || updateData.sku === '') {
      updateData.sku = null;
    } else {
      updateData.sku = updateData.sku.trim();
      // Check if SKU is unique (excluding current config)
      const existing = await prisma.contactLensConfiguration.findFirst({
        where: { sku: updateData.sku, id: { not: parseInt(id) } }
      });
      if (existing) {
        return error(res, `A configuration with SKU "${updateData.sku}" already exists. SKU must be unique.`, 400);
      }
    }
  }
  if (updateData.description !== undefined) updateData.description = updateData.description ? updateData.description.trim() : null;
  if (updateData.short_description !== undefined) updateData.short_description = updateData.short_description ? updateData.short_description.trim() : null;
  if (updateData.price !== undefined) updateData.price = updateData.price ? parseFloat(updateData.price) : null;
  if (updateData.compare_at_price !== undefined) updateData.compare_at_price = updateData.compare_at_price ? parseFloat(updateData.compare_at_price) : null;
  if (updateData.cost_price !== undefined) updateData.cost_price = updateData.cost_price ? parseFloat(updateData.cost_price) : null;
  if (updateData.stock_quantity !== undefined) updateData.stock_quantity = parseInt(updateData.stock_quantity) || 0;
  if (updateData.stock_status !== undefined) {
    const validStatuses = ['in_stock', 'out_of_stock', 'backorder'];
    if (validStatuses.includes(updateData.stock_status)) {
      // Keep the value
    } else if (updateData.stock_status === null || updateData.stock_status === '') {
      updateData.stock_status = 'in_stock'; // Default
    }
  }
  if (updateData.frame_shape !== undefined) {
    const validShapes = ['round', 'square', 'oval', 'cat_eye', 'aviator', 'rectangle', 'wayfarer', 'geometric'];
    if (validShapes.includes(updateData.frame_shape)) {
      // Keep the value
    } else if (updateData.frame_shape === null || updateData.frame_shape === '') {
      updateData.frame_shape = null;
    }
  }
  if (updateData.frame_material !== undefined) {
    const validMaterials = ['acetate', 'metal', 'tr90', 'titanium', 'wood', 'mixed'];
    if (validMaterials.includes(updateData.frame_material)) {
      // Keep the value
    } else if (updateData.frame_material === null || updateData.frame_material === '') {
      updateData.frame_material = null;
    }
  }
  if (updateData.frame_color !== undefined) updateData.frame_color = updateData.frame_color ? updateData.frame_color.trim() : null;
  if (updateData.gender !== undefined) {
    const validGenders = ['men', 'women', 'unisex', 'kids'];
    if (validGenders.includes(updateData.gender)) {
      // Keep the value
    }
  }
  if (updateData.lens_type !== undefined) {
    const validLensTypes = ['prescription', 'sunglasses', 'reading', 'computer', 'photochromic', 'plastic', 'glass', 'polycarbonate', 'trivex', 'high_index'];
    if (validLensTypes.includes(updateData.lens_type)) {
      // Keep the value
    } else if (updateData.lens_type === null || updateData.lens_type === '') {
      updateData.lens_type = null;
    }
  }
  if (updateData.spherical_lens_type !== undefined) updateData.spherical_lens_type = updateData.spherical_lens_type ? updateData.spherical_lens_type.trim() : null;
  if (updateData.display_name !== undefined) updateData.display_name = updateData.display_name.trim();

  // Convert parameter fields to JSON arrays
  try {
    if (rightQtyArr !== null) {
      if (rightQtyArr && rightQtyArr.length > 0) {
        const validated = validateNumberArray(rightQtyArr, 'right_qty', false);
        updateData.right_qty = validated ? storeArrayAsJSON(validated) : null;
      } else {
        updateData.right_qty = null;
      }
    }
    if (rightBaseCurveArr !== null) {
      if (rightBaseCurveArr && rightBaseCurveArr.length > 0) {
        const validated = validateNumberArray(rightBaseCurveArr, 'right_base_curve', true);
        updateData.right_base_curve = validated ? storeArrayAsJSON(validated) : null;
      } else {
        updateData.right_base_curve = null;
      }
    }
    if (rightDiameterArr !== null) {
      if (rightDiameterArr && rightDiameterArr.length > 0) {
        const validated = validateNumberArray(rightDiameterArr, 'right_diameter', true);
        updateData.right_diameter = validated ? storeArrayAsJSON(validated) : null;
      } else {
        updateData.right_diameter = null;
      }
    }
    if (rightPowerArr !== null) {
      if (rightPowerArr && rightPowerArr.length > 0) {
        const validated = validateNumberArray(rightPowerArr, 'right_power', true);
        updateData.right_power = validated ? storeArrayAsJSON(validated) : null;
      } else {
        updateData.right_power = null;
      }
    }
    if (leftQtyArr !== null) {
      if (leftQtyArr && leftQtyArr.length > 0) {
        const validated = validateNumberArray(leftQtyArr, 'left_qty', false);
        updateData.left_qty = validated ? storeArrayAsJSON(validated) : null;
      } else {
        updateData.left_qty = null;
      }
    }
    if (leftBaseCurveArr !== null) {
      if (leftBaseCurveArr && leftBaseCurveArr.length > 0) {
        const validated = validateNumberArray(leftBaseCurveArr, 'left_base_curve', true);
        updateData.left_base_curve = validated ? storeArrayAsJSON(validated) : null;
      } else {
        updateData.left_base_curve = null;
      }
    }
    if (leftDiameterArr !== null) {
      if (leftDiameterArr && leftDiameterArr.length > 0) {
        const validated = validateNumberArray(leftDiameterArr, 'left_diameter', true);
        updateData.left_diameter = validated ? storeArrayAsJSON(validated) : null;
      } else {
        updateData.left_diameter = null;
      }
    }
    if (leftPowerArr !== null) {
      if (leftPowerArr && leftPowerArr.length > 0) {
        const validated = validateNumberArray(leftPowerArr, 'left_power', true);
        updateData.left_power = validated ? storeArrayAsJSON(validated) : null;
      } else {
        updateData.left_power = null;
      }
    }
    
    // Astigmatism-only fields
    const configType = updateData.configuration_type || configuration.configuration_type;
    if (configType === 'astigmatism') {
      if (rightCylinderArr !== null) {
        if (rightCylinderArr && rightCylinderArr.length > 0) {
          const validated = validateNumberArray(rightCylinderArr, 'right_cylinder', true);
          updateData.right_cylinder = validated ? storeArrayAsJSON(validated) : null;
        } else {
          updateData.right_cylinder = null;
        }
      }
      if (rightAxisArr !== null) {
        if (rightAxisArr && rightAxisArr.length > 0) {
          const validated = validateNumberArray(rightAxisArr, 'right_axis', false);
          updateData.right_axis = validated ? storeArrayAsJSON(validated) : null;
        } else {
          updateData.right_axis = null;
        }
      }
      if (leftCylinderArr !== null) {
        if (leftCylinderArr && leftCylinderArr.length > 0) {
          const validated = validateNumberArray(leftCylinderArr, 'left_cylinder', true);
          updateData.left_cylinder = validated ? storeArrayAsJSON(validated) : null;
        } else {
          updateData.left_cylinder = null;
        }
      }
      if (leftAxisArr !== null) {
        if (leftAxisArr && leftAxisArr.length > 0) {
          const validated = validateNumberArray(leftAxisArr, 'left_axis', false);
          updateData.left_axis = validated ? storeArrayAsJSON(validated) : null;
        } else {
          updateData.left_axis = null;
        }
      }
    }
  } catch (validationError) {
    return error(res, validationError.message, 400);
  }
  
  if (updateData.sort_order !== undefined) updateData.sort_order = parseInt(updateData.sort_order) || 0;
  if (updateData.is_active !== undefined) updateData.is_active = updateData.is_active === 'true' || updateData.is_active === true;

  const updatedConfiguration = await prisma.contactLensConfiguration.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
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
          product_type: true
        }
      },
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    }
  });

  // Format images
  let images = [];
  let colorImages = [];
  
  if (updatedConfiguration.images) {
    try {
      images = typeof updatedConfiguration.images === 'string' ? JSON.parse(updatedConfiguration.images) : updatedConfiguration.images;
      if (!Array.isArray(images)) images = images ? [images] : [];
    } catch (e) {
      images = [];
    }
  }
  
  if (updatedConfiguration.color_images) {
    try {
      colorImages = typeof updatedConfiguration.color_images === 'string' ? JSON.parse(updatedConfiguration.color_images) : updatedConfiguration.color_images;
      if (!Array.isArray(colorImages)) colorImages = colorImages ? [colorImages] : [];
    } catch (e) {
      colorImages = [];
    }
  }
  
  const formattedConfig = {
    ...updatedConfiguration,
    images,
    image: images && images.length > 0 ? images[0] : null,
    color_images: colorImages,
    right_qty: parseJSONArray(updatedConfiguration.right_qty),
    right_base_curve: parseJSONArray(updatedConfiguration.right_base_curve),
    right_diameter: parseJSONArray(updatedConfiguration.right_diameter),
    right_power: parseJSONArray(updatedConfiguration.right_power),
    right_cylinder: parseJSONArray(updatedConfiguration.right_cylinder),
    right_axis: parseJSONArray(updatedConfiguration.right_axis),
    left_qty: parseJSONArray(updatedConfiguration.left_qty),
    left_base_curve: parseJSONArray(updatedConfiguration.left_base_curve),
    left_diameter: parseJSONArray(updatedConfiguration.left_diameter),
    left_power: parseJSONArray(updatedConfiguration.left_power),
    left_cylinder: parseJSONArray(updatedConfiguration.left_cylinder),
    left_axis: parseJSONArray(updatedConfiguration.left_axis)
  };

  return success(res, "Contact lens configuration updated successfully", { configuration: formattedConfig });
});

// @desc    Delete contact lens configuration
// @route   DELETE /api/admin/contact-lens-configs/:id
// @access  Private/Admin
exports.deleteContactLensConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const configuration = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!configuration) {
    return error(res, "Contact lens configuration not found", 404);
  }

  await prisma.contactLensConfiguration.delete({
    where: { id: parseInt(id) }
  });

  return success(res, "Contact lens configuration deleted successfully");
});

// @desc    Get contact lens configurations for frontend (by product or subcategory)
// @route   GET /api/contact-lens-configs
// @access  Public
exports.getContactLensConfigsForFrontend = asyncHandler(async (req, res) => {
  const { product_id, category_id, sub_category_id, configuration_type } = req.query;

  if (!product_id && !category_id && !sub_category_id) {
    return error(res, "At least one of product_id, category_id, or sub_category_id must be provided", 400);
  }

  const where = {
    is_active: true
  };

  if (product_id) {
    where.product_id = parseInt(product_id);
  }

  if (category_id) {
    where.category_id = parseInt(category_id);
  }

  if (sub_category_id) {
    where.sub_category_id = parseInt(sub_category_id);
  }

  if (configuration_type) {
    where.configuration_type = configuration_type;
  }

  const configurations = await prisma.contactLensConfiguration.findMany({
    where,
    orderBy: [
      { sort_order: 'asc' },
      { display_name: 'asc' }
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      description: true,
      short_description: true,
      price: true,
      compare_at_price: true,
      cost_price: true,
      stock_quantity: true,
      stock_status: true,
      images: true,
      color_images: true,
      frame_shape: true,
      frame_material: true,
      frame_color: true,
      gender: true,
      lens_type: true,
      configuration_type: true,
      spherical_lens_type: true,
      display_name: true,
      category_id: true,
      sub_category_id: true,
      product_id: true,
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
      left_axis: true
    }
  });

  // Format images for each configuration
  const formattedConfigs = configurations.map(config => {
    let images = [];
    let colorImages = [];
    
    if (config.images) {
      try {
        images = typeof config.images === 'string' ? JSON.parse(config.images) : config.images;
        if (!Array.isArray(images)) images = images ? [images] : [];
      } catch (e) {
        images = [];
      }
    }
    
    if (config.color_images) {
      try {
        colorImages = typeof config.color_images === 'string' ? JSON.parse(config.color_images) : config.color_images;
        if (!Array.isArray(colorImages)) colorImages = colorImages ? [colorImages] : [];
      } catch (e) {
        colorImages = [];
      }
    }
    
    return {
      ...config,
      images,
      image: images && images.length > 0 ? images[0] : null,
      color_images: colorImages,
      right_qty: parseJSONArray(config.right_qty),
      right_base_curve: parseJSONArray(config.right_base_curve),
      right_diameter: parseJSONArray(config.right_diameter),
      right_power: parseJSONArray(config.right_power),
      right_cylinder: parseJSONArray(config.right_cylinder),
      right_axis: parseJSONArray(config.right_axis),
      left_qty: parseJSONArray(config.left_qty),
      left_base_curve: parseJSONArray(config.left_base_curve),
      left_diameter: parseJSONArray(config.left_diameter),
      left_power: parseJSONArray(config.left_power),
      left_cylinder: parseJSONArray(config.left_cylinder),
      left_axis: parseJSONArray(config.left_axis)
    };
  });

  return success(res, "Contact lens configurations retrieved successfully", { configurations: formattedConfigs });
});

