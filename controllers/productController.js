const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

const FRAME_SHAPES = [
  'round',
  'square',
  'oval',
  'cat_eye',
  'aviator',
  'rectangle',
  'wayfarer',
  'geometric'
];

const FRAME_MATERIALS = [
  'acetate',
  'metal',
  'tr90',
  'titanium',
  'wood',
  'mixed'
];

const GENDERS = ['men', 'women', 'unisex', 'kids'];
const LENS_TYPE_ENUMS = ['prescription', 'sunglasses', 'reading', 'computer', 'photochromic', 'plastic', 'glass', 'polycarbonate', 'trivex', 'high_index'];
const LENS_INDEX_OPTIONS = [1.56, 1.61, 1.67, 1.74];

const fallbackCategories = [
  { id: 1, name: 'Eyeglasses', slug: 'eyeglasses' },
  { id: 2, name: 'Sunglasses', slug: 'sunglasses' },
  { id: 3, name: 'Contact Lenses', slug: 'contact-lenses' }
];

const fallbackLensTypes = [
  { id: 1, name: 'Blue Light Lens', slug: 'blue-light', index: 1.56, price_adjustment: 25 },
  { id: 2, name: 'Photochromic', slug: 'photochromic', index: 1.61, price_adjustment: 40 }
];

const fallbackLensCoatings = [
  { id: 1, name: 'AR Coating', slug: 'ar', type: 'ar', price_adjustment: 15 },
  { id: 2, name: 'UV Protection', slug: 'uv', type: 'uv', price_adjustment: 10 },
  { id: 3, name: 'Blue Light', slug: 'blue-light', type: 'blue_light', price_adjustment: 18 }
];

const fallbackFrameSizes = [
  { id: 1, size_label: 'Small', lens_width: 48, bridge_width: 18, temple_length: 140 },
  { id: 2, size_label: 'Medium', lens_width: 52, bridge_width: 19, temple_length: 143 },
  { id: 3, size_label: 'Large', lens_width: 55, bridge_width: 20, temple_length: 145 }
];

const normalizeDecimals = (value) => parseFloat(Number(value || 0).toFixed(2));

// Helper function to parse JSON option fields
const parseJsonOption = (value) => {
  if (!value) return null;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (e) {
    return value;
  }
};

/**
 * Helper function to format product images and color_images for frontend display
 * 
 * Returns product with:
 * - images: Array of main product images
 * - image: First image URL (for easy access)
 * - color_images: Raw color images array from database
 * - colors: Formatted array for color swatches [{name, value, images, primaryImage, hexCode}]
 * - selectedColor: Default selected color value
 * - model_3d_url: URL to 3D model file
 * 
 * Frontend Usage Example:
 * ```javascript
 * // Display color swatches
 * product.colors.map(color => (
 *   <ColorSwatch 
 *     key={color.value}
 *     color={color.hexCode}
 *     selected={selectedColor === color.value}
 *     onClick={() => handleColorSelect(color.value)}
 *   />
 * ))
 * 
 * // Get images for selected color
 * const selectedColorData = product.colors.find(c => c.value === selectedColor);
 * const displayImages = selectedColorData?.images || product.images;
 * 
 * // Display 3D model
 * if (product.model_3d_url) {
 *   <ModelViewer src={product.model_3d_url} />
 * }
 * ```
 */
const formatProductMedia = (product) => {
  // Format images - parse JSON string to array
  let images = product.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = [];
    }
  }
  if (!Array.isArray(images)) {
    images = images ? [images] : [];
  }

  // Format color_images - parse JSON string to array
  let colorImages = product.color_images;
  if (typeof colorImages === 'string') {
    try {
      colorImages = JSON.parse(colorImages);
    } catch (e) {
      colorImages = [];
    }
  }
  if (!Array.isArray(colorImages)) {
    colorImages = colorImages ? [colorImages] : [];
  }

  // Create colors array for frontend color swatches with hex codes
  // Extract colors from color_images and create a user-friendly structure
  // New format: [{hexCode: "#000000", name: "Black", price: 99.99, images: [...]}]
  const colors = colorImages.map((colorData, index) => {
    // Support both new format (hexCode) and old format (color) for backward compatibility
    const hexCode = colorData.hexCode || colorData.hex_code || (colorData.color ? getColorHexCode(colorData.color) : null) || '#000000';
    const colorName = colorData.name || (colorData.color ? getColorNameFromHex(hexCode) : null) || `Color ${index + 1}`;
    
    return {
      name: colorName,
      display_name: colorData.display_name || colorName,
      value: hexCode, // Use hex code as value for matching
      hexCode: hexCode, // Hex code for color picker
      price: colorData.price !== undefined && colorData.price !== null ? parseFloat(colorData.price) : null, // Variant-specific price
      images: Array.isArray(colorData.images) ? colorData.images : (colorData.images ? [colorData.images] : []),
      primaryImage: Array.isArray(colorData.images) && colorData.images.length > 0 
        ? colorData.images[0] 
        : (colorData.images || null)
    };
  });

  // Determine default/selected color (first color or use main images)
  const defaultColor = colors.length > 0 ? colors[0].value : null;
  const currentImages = defaultColor && colors.length > 0 
    ? colors[0].images.length > 0 
      ? colors[0].images 
      : images
    : images;
  
  // Get current variant price (from selected color, or base product price)
  const currentVariantPrice = defaultColor && colors.length > 0 && colors[0].price !== null
    ? colors[0].price
    : parseFloat(product.price);

  return {
    ...product,
    images,
    image: currentImages && currentImages.length > 0 ? currentImages[0] : (images && images.length > 0 ? images[0] : null),
    color_images: colorImages,
    colors: colors, // Array of color objects for swatches: [{name, display_name, value, price, images, primaryImage, hexCode}]
    selectedColor: defaultColor, // Default selected color value
    currentVariantPrice: currentVariantPrice, // Current variant price (or base price)
    // model_3d_url is already in the product object from Prisma
    model_3d_url: product.model_3d_url || null
  };
};

// Helper function to get hex code from color name
const getColorHexCode = (colorName) => {
  if (!colorName) return null;
  
  const colorMap = {
    'black': '#000000',
    'white': '#FFFFFF',
    'brown': '#8B4513',
    'tortoiseshell': '#8B4513',
    'tortoise': '#8B4513',
    'red': '#FF0000',
    'burgundy': '#800020',
    'pink': '#FFC0CB',
    'rose': '#FF69B4',
    'green': '#008000',
    'blue': '#0000FF',
    'purple': '#800080',
    'yellow': '#FFFF00',
    'cream': '#FFFDD0',
    'grey': '#808080',
    'gray': '#808080',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'navy': '#000080',
    'beige': '#F5F5DC'
  };

  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || null;
};

// Helper function to get color name from hex code
const getColorNameFromHex = (hexCode) => {
  if (!hexCode || !hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
    return 'Unknown';
  }
  
  const hex = hexCode.toLowerCase();
  const colorMap = {
    '#000000': 'Black',
    '#ffffff': 'White',
    '#8b4513': 'Brown',
    '#0000ff': 'Blue',
    '#ff0000': 'Red',
    '#008000': 'Green',
    '#808080': 'Gray',
    '#ffd700': 'Gold',
    '#c0c0c0': 'Silver',
    '#800080': 'Purple',
    '#ffa500': 'Orange',
    '#ffc0cb': 'Pink',
    '#ffff00': 'Yellow',
    '#a52a2a': 'Brown',
    '#4b0082': 'Indigo'
  };
  
  return colorMap[hex] || `Color ${hexCode}`;
};

// Export formatProductMedia and helper functions for use in other controllers
// (Exported after function definitions to avoid hoisting issues)
exports.formatProductMedia = formatProductMedia;
exports.getColorHexCode = getColorHexCode;
exports.getColorNameFromHex = getColorNameFromHex;

// @desc    Get product form options (dropdowns, presets)
// @route   GET /api/products/options
// @access  Public (can also be used by admin UI)
exports.getProductFormOptions = asyncHandler(async (req, res) => {
  const [categories, subcategories, lensTypes, lensCoatings, frameSizes] = await Promise.all([
    prisma.category.findMany({
      where: { is_active: true },
      select: { id: true, name: true, slug: true },
      orderBy: { sort_order: 'asc' }
    }),
    prisma.subCategory.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        category_id: true,
        parent_id: true,
        image: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { sort_order: 'asc' }
    }),
    prisma.lensType.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        index: true,
        thickness_factor: true,
        price_adjustment: true
      },
      orderBy: { name: 'asc' }
    }),
    prisma.lensCoating.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        price_adjustment: true
      },
      orderBy: { name: 'asc' }
    }),
    prisma.frameSize.findMany({
      take: 15,
      orderBy: { size_label: 'asc' },
      select: {
        id: true,
        size_label: true,
        lens_width: true,
        bridge_width: true,
        temple_length: true,
        frame_width: true,
        frame_height: true
      }
    })
  ]);

  // Group subcategories by category and by parent for hierarchical structure
  const subcategoriesByCategory = {};
  const subcategoriesByParent = {};
  const topLevelSubcategories = [];

  subcategories.forEach(subcat => {
    // Group by category
    if (!subcategoriesByCategory[subcat.category_id]) {
      subcategoriesByCategory[subcat.category_id] = [];
    }
    subcategoriesByCategory[subcat.category_id].push({
      id: subcat.id,
      name: subcat.name,
      slug: subcat.slug,
      category_id: subcat.category_id,
      parent_id: subcat.parent_id,
      image: subcat.image,
      parent: subcat.parent
    });

    // If it's a top-level subcategory (no parent)
    if (!subcat.parent_id) {
      topLevelSubcategories.push({
        id: subcat.id,
        name: subcat.name,
        slug: subcat.slug,
        category_id: subcat.category_id,
        image: subcat.image
      });
    } else {
      // Group by parent for sub-subcategories
      if (!subcategoriesByParent[subcat.parent_id]) {
        subcategoriesByParent[subcat.parent_id] = [];
      }
      subcategoriesByParent[subcat.parent_id].push({
        id: subcat.id,
        name: subcat.name,
        slug: subcat.slug,
        category_id: subcat.category_id,
        parent_id: subcat.parent_id,
        image: subcat.image
      });
    }
  });

  const payload = {
    categories: categories.length ? categories : fallbackCategories,
    subcategories: subcategories.map(sub => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      category_id: sub.category_id,
      parent_id: sub.parent_id,
      image: sub.image,
      parent: sub.parent
    })),
    subcategoriesByCategory,
    subcategoriesByParent,
    topLevelSubcategories,
    frameShapes: FRAME_SHAPES,
    frameMaterials: FRAME_MATERIALS,
    genders: GENDERS,
    lensTypes: (lensTypes.length ? lensTypes : fallbackLensTypes).map((lt) => ({
      ...lt,
      index: normalizeDecimals(lt.index),
      thickness_factor: lt.thickness_factor !== undefined && lt.thickness_factor !== null
        ? normalizeDecimals(lt.thickness_factor)
        : null,
      price_adjustment: normalizeDecimals(lt.price_adjustment)
    })),
    lensCoatings: (lensCoatings.length ? lensCoatings : fallbackLensCoatings).map((lc) => ({
      ...lc,
      price_adjustment: normalizeDecimals(lc.price_adjustment)
    })),
    lensIndexOptions: LENS_INDEX_OPTIONS,
    frameSizes: frameSizes.length ? frameSizes : fallbackFrameSizes,
    lensTypeEnums: LENS_TYPE_ENUMS
  };

  return success(res, 'Product form options retrieved successfully', payload);
});

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    frameShape,
    frameMaterial,
    lensType,
    gender,
    minPrice,
    maxPrice,
    search,
    product_type,
    sortBy = 'created_at',
    sortOrder = 'desc',
    isFeatured
  } = req.query;

  const skip = (page - 1) * limit;
  const where = { is_active: true };

  // Apply filters
  if (category) {
    const categoryRecord = await prisma.category.findUnique({ where: { slug: category } });
    if (categoryRecord) {
      where.category_id = categoryRecord.id;
    }
  }

  // Filter by subCategory (including sub-subcategories if it's a parent)
  if (req.query.subCategory) {
    const subCategoryRecord = await prisma.subCategory.findFirst({ 
      where: { slug: req.query.subCategory, is_active: true },
      include: {
        children: {
          where: { is_active: true },
          select: { id: true }
        }
      }
    });
    
    if (subCategoryRecord) {
      // If this subcategory has children (sub-subcategories), include products from both parent and children
      const subcategoryIds = [subCategoryRecord.id];
      if (subCategoryRecord.children && subCategoryRecord.children.length > 0) {
        subcategoryIds.push(...subCategoryRecord.children.map(child => child.id));
      }
      where.sub_category_id = { in: subcategoryIds };
    }
  }

  if (product_type) {
    // Validate product_type against enum values
    const validProductTypes = ['frame', 'sunglasses', 'contact_lens', 'eye_hygiene', 'accessory'];
    const normalizedType = product_type.toLowerCase().trim();
    if (validProductTypes.includes(normalizedType)) {
      where.product_type = normalizedType;
    }
  }

  if (frameShape) where.frame_shape = frameShape;
  if (frameMaterial) where.frame_material = frameMaterial;
  if (lensType) where.lens_type = lensType;
  if (gender) where.gender = gender;

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { sku: { contains: search } }
    ];
  }

  if (isFeatured === 'true') {
    where.is_featured = true;
  }

  // Build include object - conditionally include sizeVolumeVariants if table exists
  const includeObject = {
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
  };

  // Try to include sizeVolumeVariants if the table exists (migration has been run)
  let products, total;
  try {
    [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          ...includeObject,
          sizeVolumeVariants: {
            where: { is_active: true },
            orderBy: [
              { sort_order: 'asc' },
              { size_volume: 'asc' },
              { pack_type: 'asc' }
            ]
          }
        },
        take: parseInt(limit),
        skip: parseInt(skip),
        orderBy: { [sortBy]: sortOrder.toLowerCase() }
      }),
      prisma.product.count({ where })
    ]);
  } catch (err) {
    // If error is about missing table/model, retry without sizeVolumeVariants
    if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
      console.warn('⚠️  ProductSizeVolume table does not exist yet. Run migration: npx prisma migrate dev');
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: includeObject,
          take: parseInt(limit),
          skip: parseInt(skip),
          orderBy: { [sortBy]: sortOrder.toLowerCase() }
        }),
        prisma.product.count({ where })
      ]);
    } else {
      // Re-throw other errors
      throw err;
    }
  }

  // Format products with images and color_images
  const formattedProducts = products.map(product => {
    const formatted = formatProductMedia(product);
    
    // Check if product is in Eye Hygiene category or related subcategory
    const isEyeHygiene = product.category && (
      product.category.name.toLowerCase().includes('eye hygiene') ||
      product.category.slug.toLowerCase().includes('eye-hygiene') ||
      (product.subCategory && (
        product.subCategory.name.toLowerCase().includes('eye hygiene') ||
        product.subCategory.slug.toLowerCase().includes('eye-hygiene')
      ))
    );

    // Add Eye Hygiene fields if applicable
    if (isEyeHygiene) {
      formatted.size_volume = product.size_volume || null;
      formatted.pack_type = product.pack_type || null;
      formatted.expiry_date = product.expiry_date || null;
    }

    return formatted;
  });

  // Add caching for product listings (1 minute) - products may change but listings are relatively stable
  return success(res, 'Products retrieved successfully', {
    products: formattedProducts,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  }, 200, { maxAge: 60 });
});

// ==================== SECTION-SPECIFIC PRODUCT ENDPOINTS ====================

// Helper function to get products by section
const getProductsBySection = (productType) => {
  return asyncHandler(async (req, res) => {
    req.query.product_type = productType;
    return exports.getProducts(req, res);
  });
};

// @desc    Get all sunglasses products (Website)
// @route   GET /api/products/section/sunglasses
// @access  Public
exports.getSunglassesProducts = getProductsBySection('sunglasses');

// @desc    Get all eyeglasses products (Website)
// @route   GET /api/products/section/eyeglasses
// @access  Public
exports.getEyeglassesProducts = getProductsBySection('frame');

// @desc    Get all contact lenses products (Website)
// @route   GET /api/products/section/contact-lenses
// @access  Public
exports.getContactLensesProducts = getProductsBySection('contact_lens');

// @desc    Get all eye hygiene products (Website)
// @route   GET /api/products/section/eye-hygiene
// @access  Public
exports.getEyeHygieneProducts = getProductsBySection('eye_hygiene');

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Build include object - conditionally include sizeVolumeVariants if table exists
  const includeObject = {
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        description: true
      }
    },
    subCategory: {
      select: {
        id: true,
        name: true,
        slug: true
      }
    },
    frameSizes: {
      select: {
        id: true,
        lens_width: true,
        bridge_width: true,
        temple_length: true,
        frame_width: true,
        frame_height: true,
        size_label: true
      }
    },
    lensTypes: {
      include: {
        lensType: {
          select: {
            id: true,
            name: true,
            slug: true,
            index: true,
            thickness_factor: true,
            price_adjustment: true
          }
        }
      }
    },
    lensCoatings: {
      include: {
        lensCoating: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            price_adjustment: true
          }
        }
      }
    },
    contactLensConfigs: {
      where: { is_active: true },
      orderBy: [
        { sort_order: 'asc' },
        { display_name: 'asc' }
      ],
      select: {
        id: true,
        configuration_type: true,
        display_name: true,
        lens_type: true,
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
    },
    reviews: {
      where: { is_approved: true },
      take: 10,
      orderBy: { created_at: 'desc' }
    }
  };

  // Try to include sizeVolumeVariants if the table exists
  let product;
  try {
    product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        ...includeObject,
        sizeVolumeVariants: {
          where: { is_active: true },
          orderBy: [
            { sort_order: 'asc' },
            { size_volume: 'asc' },
            { pack_type: 'asc' }
          ]
        }
      }
    });
  } catch (err) {
    // If error is about missing table/model, retry without sizeVolumeVariants
    if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
      console.warn('⚠️  ProductSizeVolume table does not exist yet. Run migration: npx prisma migrate dev');
      product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: includeObject
      });
    } else {
      // Re-throw other errors
      throw err;
    }
  }

  if (!product) {
    return error(res, 'Product not found', 404);
  }

  // Increment view count
  await prisma.product.update({
    where: { id: parseInt(id) },
    data: { view_count: { increment: 1 } }
  });

  // Parse contact lens options if they exist
  const baseCurveOptions = parseJsonOption(product.base_curve_options);
  const diameterOptions = parseJsonOption(product.diameter_options);
  const powersRange = parseJsonOption(product.powers_range);

  // Format product media (images, color_images, model_3d_url)
  const formattedProduct = formatProductMedia(product);

  // Check if product is in Eye Hygiene category or related subcategory
  const isEyeHygiene = product.category && (
    product.category.name.toLowerCase().includes('eye hygiene') ||
    product.category.slug.toLowerCase().includes('eye-hygiene') ||
    (product.subCategory && (
      product.subCategory.name.toLowerCase().includes('eye hygiene') ||
      product.subCategory.slug.toLowerCase().includes('eye-hygiene')
    ))
  );

  // Transform lensTypes and lensCoatings to match expected format
  const transformedProduct = {
    ...formattedProduct,
    lensTypes: product.lensTypes.map(plt => plt.lensType),
    lensCoatings: product.lensCoatings.map(plc => plc.lensCoating),
    // Contact lens options (parsed from JSON strings)
    base_curve_options: baseCurveOptions,
    diameter_options: diameterOptions,
    powers_range: powersRange
  };

  // Add Eye Hygiene fields if applicable
  if (isEyeHygiene) {
    transformedProduct.size_volume = product.size_volume || null;
    transformedProduct.pack_type = product.pack_type || null;
    transformedProduct.expiry_date = product.expiry_date || null;
    // Include size/volume variants if they exist
    transformedProduct.size_volume_variants = (product.sizeVolumeVariants && Array.isArray(product.sizeVolumeVariants)) ? product.sizeVolumeVariants : [];
  }

  // Add caching for single product (2 minutes) - product details change less frequently
  return success(res, 'Product retrieved successfully', { product: transformedProduct }, 200, { maxAge: 120 });
});

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Build include object - conditionally include sizeVolumeVariants if table exists
  const includeObject = {
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        description: true
      }
    },
    subCategory: {
      select: {
        id: true,
        name: true,
        slug: true
      }
    },
    frameSizes: {
      select: {
        id: true,
        lens_width: true,
        bridge_width: true,
        temple_length: true,
        frame_width: true,
        frame_height: true,
        size_label: true
      }
    },
    lensTypes: {
      include: {
        lensType: {
          select: {
            id: true,
            name: true,
            slug: true,
            index: true,
            thickness_factor: true,
            price_adjustment: true
          }
        }
      }
    },
    lensCoatings: {
      include: {
        lensCoating: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            price_adjustment: true
          }
        }
      }
    },
    contactLensConfigs: {
      where: { is_active: true },
      orderBy: [
        { sort_order: 'asc' },
        { display_name: 'asc' }
      ],
      select: {
        id: true,
        configuration_type: true,
        display_name: true,
        lens_type: true,
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
    },
    reviews: {
      where: { is_approved: true },
      take: 10,
      orderBy: { created_at: 'desc' }
    }
  };

  // Try to include sizeVolumeVariants if the table exists
  let product;
  try {
    product = await prisma.product.findFirst({
      where: { slug, is_active: true },
      include: {
        ...includeObject,
        sizeVolumeVariants: {
          where: { is_active: true },
          orderBy: [
            { sort_order: 'asc' },
            { size_volume: 'asc' },
            { pack_type: 'asc' }
          ]
        }
      }
    });
  } catch (err) {
    // If error is about missing table/model, retry without sizeVolumeVariants
    if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
      console.warn('⚠️  ProductSizeVolume table does not exist yet. Run migration: npx prisma migrate dev');
      product = await prisma.product.findFirst({
        where: { slug, is_active: true },
        include: includeObject
      });
    } else {
      // Re-throw other errors
      throw err;
    }
  }

  if (!product) {
    return error(res, 'Product not found', 404);
  }

  // Increment view count
  await prisma.product.update({
    where: { id: product.id },
    data: { view_count: { increment: 1 } }
  });

  // Parse contact lens options if they exist
  let baseCurveOptions = null;
  let diameterOptions = null;
  let powersRange = null;
  
  if (product.base_curve_options) {
    try {
      baseCurveOptions = typeof product.base_curve_options === 'string' 
        ? JSON.parse(product.base_curve_options) 
        : product.base_curve_options;
    } catch (e) {
      baseCurveOptions = product.base_curve_options;
    }
  }
  
  if (product.diameter_options) {
    try {
      diameterOptions = typeof product.diameter_options === 'string' 
        ? JSON.parse(product.diameter_options) 
        : product.diameter_options;
    } catch (e) {
      diameterOptions = product.diameter_options;
    }
  }
  
  if (product.powers_range) {
    try {
      powersRange = typeof product.powers_range === 'string' 
        ? JSON.parse(product.powers_range) 
        : product.powers_range;
    } catch (e) {
      powersRange = product.powers_range;
    }
  }

  // Format product media (images, color_images, model_3d_url)
  const formattedProduct = formatProductMedia(product);

  // Check if product is in Eye Hygiene category or related subcategory
  const isEyeHygiene = product.category && (
    product.category.name.toLowerCase().includes('eye hygiene') ||
    product.category.slug.toLowerCase().includes('eye-hygiene') ||
    (product.subCategory && (
      product.subCategory.name.toLowerCase().includes('eye hygiene') ||
      product.subCategory.slug.toLowerCase().includes('eye-hygiene')
    ))
  );

  // Transform lensTypes and lensCoatings
  const transformedProduct = {
    ...formattedProduct,
    lensTypes: product.lensTypes.map(plt => plt.lensType),
    lensCoatings: product.lensCoatings.map(plc => plc.lensCoating),
    // Contact lens options (parsed from JSON strings)
    base_curve_options: baseCurveOptions,
    diameter_options: diameterOptions,
    powers_range: powersRange,
    // Contact lens configurations (for dropdowns in frontend)
    contact_lens_configs: product.contactLensConfigs || []
  };

  // Add Eye Hygiene fields if applicable
  if (isEyeHygiene) {
    transformedProduct.size_volume = product.size_volume || null;
    transformedProduct.pack_type = product.pack_type || null;
    transformedProduct.expiry_date = product.expiry_date || null;
    // Include size/volume variants if they exist
    transformedProduct.size_volume_variants = (product.sizeVolumeVariants && Array.isArray(product.sizeVolumeVariants)) ? product.sizeVolumeVariants : [];
  }

  // Add caching for single product by slug (2 minutes) - product details change less frequently
  return success(res, 'Product retrieved successfully', { product: transformedProduct }, 200, { maxAge: 120 });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await prisma.product.findMany({
    where: {
      is_active: true,
      is_featured: true
    },
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
          slug: true
        }
      }
    },
    take: parseInt(limit),
    orderBy: { created_at: 'desc' }
  });

  // Format products with images and color_images
  const formattedProducts = products.map(product => {
    const formatted = formatProductMedia(product);
    
    // Check if product is in Eye Hygiene category or related subcategory
    const isEyeHygiene = product.category && (
      product.category.name.toLowerCase().includes('eye hygiene') ||
      product.category.slug.toLowerCase().includes('eye-hygiene') ||
      (product.subCategory && (
        product.subCategory.name.toLowerCase().includes('eye hygiene') ||
        product.subCategory.slug.toLowerCase().includes('eye-hygiene')
      ))
    );

    // Add Eye Hygiene fields if applicable
    if (isEyeHygiene) {
      formatted.size_volume = product.size_volume || null;
      formatted.pack_type = product.pack_type || null;
      formatted.expiry_date = product.expiry_date || null;
    }

    return formatted;
  });

  // Add caching for featured products (2 minutes) - featured products change less frequently
  return success(res, 'Featured products retrieved successfully', { products: formattedProducts }, 200, { maxAge: 120 });
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 4 } = req.query;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) {
    return error(res, 'Product not found', 404);
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      id: { not: parseInt(id) },
      category_id: product.category_id,
      is_active: true
    },
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
          slug: true
        }
      }
    },
    take: parseInt(limit),
    orderBy: { created_at: 'desc' }
  });

  // Format products with images and color_images
  const formattedProducts = relatedProducts.map(product => {
    const formatted = formatProductMedia(product);
    
    // Check if product is in Eye Hygiene category or related subcategory
    const isEyeHygiene = product.category && (
      product.category.name.toLowerCase().includes('eye hygiene') ||
      product.category.slug.toLowerCase().includes('eye-hygiene') ||
      (product.subCategory && (
        product.subCategory.name.toLowerCase().includes('eye hygiene') ||
        product.subCategory.slug.toLowerCase().includes('eye-hygiene')
      ))
    );

    // Add Eye Hygiene fields if applicable
    if (isEyeHygiene) {
      formatted.size_volume = product.size_volume || null;
      formatted.pack_type = product.pack_type || null;
      formatted.expiry_date = product.expiry_date || null;
    }

    return formatted;
  });

  // Add caching for related products (1 minute) - related products may change
  return success(res, 'Related products retrieved successfully', { products: formattedProducts }, 200, { maxAge: 60 });
});
