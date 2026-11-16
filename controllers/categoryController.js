const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { formatProductMedia } = require('./productController');

/** Same card fields as shop listing so home ProductCard matches category page */
const homeListingProductSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  compare_at_price: true,
  images: true,
  color_images: true,
  frame_color: true,
  frame_shape: true,
  frame_material: true,
  gender: true,
  stock_status: true,
  stock_quantity: true,
  product_type: true,
  contact_lens_brand: true,
  category_id: true,
  sub_category_id: true,
  is_featured: true,
  category: {
    select: { id: true, name: true, slug: true },
  },
  subCategory: {
    select: {
      id: true,
      name: true,
      slug: true,
      parent_id: true,
      parent: { select: { id: true, name: true, slug: true } },
    },
  },
};

const formatHomeProducts = (products) =>
  (Array.isArray(products) ? products : []).map((p) => formatProductMedia(p));

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const includeProducts = req.query.includeProducts === 'true';
  const includeSubcategories = req.query.includeSubcategories === 'true';

  const include = {};

  if (includeProducts) {
    include.products = {
      where: { is_active: true },
      take: 10,
      orderBy: { created_at: 'desc' },
      select: homeListingProductSelect,
    };
  }

  if (includeSubcategories) {
    include.subcategories = {
      where: {
        is_active: true,
        parent_id: null,
      },
      include: {
        ...(includeProducts
          ? {
              products: {
                where: { is_active: true },
                take: 10,
                orderBy: { created_at: 'desc' },
                select: homeListingProductSelect,
              },
            }
          : {}),
        children: {
          where: { is_active: true },
          select: {
            id: true,
            name: true,
            name_it: true,
            slug: true,
            image: true,
            parent_id: true,
            sort_order: true,
          },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { sort_order: 'asc' },
    };
  }

  const categories = await prisma.category.findMany({
    where: { is_active: true },
    include: Object.keys(include).length > 0 ? include : false,
    orderBy: [
      { sort_order: 'asc' },
      { name: 'asc' },
    ],
  });

  const formatted = includeProducts
    ? categories.map((cat) => ({
        ...cat,
        products: formatHomeProducts(cat.products),
        subcategories: Array.isArray(cat.subcategories)
          ? cat.subcategories.map((sub) => ({
              ...sub,
              products: formatHomeProducts(sub.products),
            }))
          : cat.subcategories,
      }))
    : categories;

  return success(res, 'Categories retrieved successfully', { categories: formatted });
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
        include: {
          children: {
            where: { is_active: true },
            select: {
              id: true,
              name: true,
              name_it: true,
              slug: true,
              image: true,
              parent_id: true,
              sort_order: true
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
