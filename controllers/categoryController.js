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
        where: { 
          is_active: true,
          parent_id: null // Only top-level subcategories
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          parent_id: true
        },
        include: {
          children: {
            where: { is_active: true },
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              parent_id: true
            },
            orderBy: { sort_order: 'asc' }
          }
        },
        orderBy: { sort_order: 'asc' }
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
        where: { 
          is_active: true,
          parent_id: null // Only top-level subcategories
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          parent_id: true
        },
        include: {
          children: {
            where: { is_active: true },
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              parent_id: true
            },
            orderBy: { sort_order: 'asc' }
          }
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

// @desc    Get related categories based on subcategories
// @route   GET /api/categories/:id/related
// @access  Public
exports.getRelatedCategories = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 5 } = req.query;

  // Get the category with its subcategories
  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
    include: {
      subcategories: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!category) {
    return error(res, 'Category not found', 404);
  }

  // Collect all subcategory names (including sub-subcategories)
  const subcategoryNames = [];
  category.subcategories.forEach(sub => {
    subcategoryNames.push(sub.name.toLowerCase());
    if (sub.children) {
      sub.children.forEach(child => {
        subcategoryNames.push(child.name.toLowerCase());
      });
    }
  });

  if (subcategoryNames.length === 0) {
    return success(res, 'No related categories found', {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug
      },
      relatedCategories: []
    });
  }

  // Find other categories that have similar subcategories
  const allSubcategories = await prisma.subCategory.findMany({
    where: {
      is_active: true,
      category_id: { not: parseInt(id) }
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true
        }
      }
    }
  });

  // Score categories based on matching subcategory names
  const categoryScores = new Map();
  
  allSubcategories.forEach(sub => {
    const categoryId = sub.category.id;
    if (!categoryScores.has(categoryId)) {
      categoryScores.set(categoryId, {
        category: sub.category,
        score: 0,
        matchingSubcategories: []
      });
    }
    
    const subName = sub.name.toLowerCase();
    const isMatch = subcategoryNames.some(name => 
      name.includes(subName) || subName.includes(name) ||
      name.split(' ').some(word => subName.includes(word)) ||
      subName.split(' ').some(word => name.includes(word))
    );
    
    if (isMatch) {
      categoryScores.get(categoryId).score += 1;
      categoryScores.get(categoryId).matchingSubcategories.push({
        id: sub.id,
        name: sub.name,
        slug: sub.slug
      });
    }
  });

  // Sort by score and get top results
  const relatedCategories = Array.from(categoryScores.values())
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, parseInt(limit))
    .map(item => ({
      ...item.category,
      matchingSubcategories: item.matchingSubcategories,
      relevanceScore: item.score
    }));

  return success(res, 'Related categories retrieved successfully', {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug
    },
    relatedCategories
  });
});
