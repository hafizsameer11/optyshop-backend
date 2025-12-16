const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const { includeProducts } = req.query;

  const categories = await prisma.category.findMany({
    where: { is_active: true },
    include: includeProducts === 'true' ? {
      products: {
        where: { is_active: true },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true
        }
      }
    } : (req.query.includeSubcategories === 'true' ? {
      subcategories: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true
        }
      }
    } : false),
    orderBy: [
      { sort_order: 'asc' },
      { name: 'asc' }
    ]
  });

  return success(res, 'Categories retrieved successfully', { categories });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findFirst({
    where: { id: parseInt(id), is_active: true },
    include: {
      products: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          frame_shape: true,
          frame_material: true
        }
      },
      subcategories: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true
        },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  if (!category) {
    return error(res, 'Category not found', 404);
  }

  return success(res, 'Category retrieved successfully', { category });
});

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await prisma.category.findFirst({
    where: { slug, is_active: true },
    include: {
      products: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          frame_shape: true,
          frame_material: true
        }
      }
    }
  });

  if (!category) {
    return error(res, 'Category not found', 404);
  }

  return success(res, 'Category retrieved successfully', { category });
});
