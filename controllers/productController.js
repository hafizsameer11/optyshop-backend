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
const LENS_TYPE_ENUMS = ['prescription', 'sunglasses', 'reading', 'computer', 'photochromic'];
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
    const subCategoryRecord = await prisma.subCategory.findUnique({ 
      where: { slug: req.query.subCategory },
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

  const [products, total] = await Promise.all([
    prisma.product.findMany({
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
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { [sortBy]: sortOrder.toLowerCase() }
    }),
    prisma.product.count({ where })
  ]);

  return success(res, 'Products retrieved successfully', {
    products,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
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
      reviews: {
        where: { is_approved: true },
        take: 10,
        orderBy: { created_at: 'desc' }
      }
    }
  });

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

  // Transform lensTypes and lensCoatings to match expected format
  const transformedProduct = {
    ...product,
    lensTypes: product.lensTypes.map(plt => plt.lensType),
    lensCoatings: product.lensCoatings.map(plc => plc.lensCoating),
    // Contact lens options (parsed from JSON strings)
    base_curve_options: baseCurveOptions,
    diameter_options: diameterOptions,
    powers_range: powersRange
  };

  return success(res, 'Product retrieved successfully', { product: transformedProduct });
});

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await prisma.product.findFirst({
    where: { slug, is_active: true },
    include: {
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
      reviews: {
        where: { is_approved: true },
        take: 10,
        orderBy: { created_at: 'desc' }
      }
    }
  });

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

  // Transform lensTypes and lensCoatings
  const transformedProduct = {
    ...product,
    lensTypes: product.lensTypes.map(plt => plt.lensType),
    lensCoatings: product.lensCoatings.map(plc => plc.lensCoating),
    // Contact lens options (parsed from JSON strings)
    base_curve_options: baseCurveOptions,
    diameter_options: diameterOptions,
    powers_range: powersRange
  };

  return success(res, 'Product retrieved successfully', { product: transformedProduct });
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

  return success(res, 'Featured products retrieved successfully', { products });
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

  return success(res, 'Related products retrieved successfully', { products: relatedProducts });
});
