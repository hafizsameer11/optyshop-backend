const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

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

  // Transform lensTypes and lensCoatings to match expected format
  const transformedProduct = {
    ...product,
    lensTypes: product.lensTypes.map(plt => plt.lensType),
    lensCoatings: product.lensCoatings.map(plc => plc.lensCoating)
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

  // Transform lensTypes and lensCoatings
  const transformedProduct = {
    ...product,
    lensTypes: product.lensTypes.map(plt => plt.lensType),
    lensCoatings: product.lensCoatings.map(plc => plc.lensCoating)
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
      }
    },
    take: parseInt(limit),
    orderBy: { created_at: 'desc' }
  });

  return success(res, 'Related products retrieved successfully', { products: relatedProducts });
});
