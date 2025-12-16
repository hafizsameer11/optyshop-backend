const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// @desc    Get all subcategories
// @route   GET /api/subcategories
// @access  Public
exports.getSubCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, category_id, search, includeChildren } = req.query;
    const skip = (page - 1) * limit;

    const where = { is_active: true };

    if (category_id) {
        where.category_id = parseInt(category_id);
    }

    if (search) {
        where.name = { contains: search };
    }

    const [subcategories, total] = await Promise.all([
        prisma.subCategory.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                children: includeChildren === 'true' ? {
                    where: { is_active: true },
                    select: { id: true, name: true, slug: true, image: true }
                } : false
            },
            orderBy: { sort_order: 'asc' },
            take: parseInt(limit),
            skip: parseInt(skip)
        }),
        prisma.subCategory.count({ where })
    ]);

    return success(res, 'Subcategories retrieved successfully', {
        subcategories,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Get single subcategory
// @route   GET /api/subcategories/:id
// @access  Public
exports.getSubCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { includeProducts } = req.query;

    const include = {
        category: {
            select: {
                id: true,
                name: true,
                slug: true
            }
        },
        parent: {
            select: { id: true, name: true, slug: true }
        },
        children: {
            where: { is_active: true },
            select: { id: true, name: true, slug: true, image: true }
        }
    };

    if (includeProducts === 'true') {
        include.products = {
            where: { is_active: true },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true
            },
            take: 12
        };
    }

    const subcategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(id) },
        include
    });

    if (!subcategory) {
        return error(res, 'Subcategory not found', 404);
    }

    return success(res, 'Subcategory retrieved successfully', { subcategory });
});

// @desc    Get subcategory by slug
// @route   GET /api/subcategories/slug/:slug
// @access  Public
exports.getSubCategoryBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const subcategory = await prisma.subCategory.findUnique({
        where: { slug },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            }
        }
    });

    if (!subcategory) {
        return error(res, 'Subcategory not found', 404);
    }

    return success(res, 'Subcategory retrieved successfully', { subcategory });
});

// @desc    Get subcategories by category ID
// @route   GET /api/subcategories/by-category/:category_id
// @access  Public
exports.getSubCategoriesByCategory = asyncHandler(async (req, res) => {
    const { category_id } = req.params;

    // Verify category exists
    const category = await prisma.category.findUnique({
        where: { id: parseInt(category_id) },
        select: { id: true, name: true, slug: true }
    });

    if (!category) {
        return error(res, 'Category not found', 404);
    }

    const subcategories = await prisma.subCategory.findMany({
        where: {
            category_id: parseInt(category_id),
            is_active: true
        },
        select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            description: true,
            sort_order: true
        },
        orderBy: { sort_order: 'asc' }
    });

    return success(res, 'Subcategories retrieved successfully', {
        category,
        subcategories
    });
});