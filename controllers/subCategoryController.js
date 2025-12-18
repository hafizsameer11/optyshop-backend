const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// @desc    Get all subcategories
// @route   GET /api/subcategories
// @access  Public
exports.getSubCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, category_id, search } = req.query;
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
                parent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                children: {
                    where: { is_active: true },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        image: true
                    },
                    orderBy: { sort_order: 'asc' }
                }
            },
            orderBy: { sort_order: 'asc' },
            take: parseInt(limit),
            skip: parseInt(skip)
        }),
        prisma.subCategory.count({ where })
    ]);

    // Separate top-level and sub-subcategories
    const topLevelSubcategories = subcategories.filter(sub => !sub.parent_id);
    const subSubcategories = subcategories.filter(sub => sub.parent_id);

    return success(res, 'Subcategories retrieved successfully', {
        subcategories: subcategories.map(sub => ({
            ...sub,
            parent_id: sub.parent_id || null
        })),
        topLevelSubcategories,
        subSubcategories,
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
            select: {
                id: true,
                name: true,
                slug: true
            }
        },
        children: {
            where: { is_active: true },
            select: {
                id: true,
                name: true,
                slug: true,
                image: true
            },
            orderBy: { sort_order: 'asc' }
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
            },
            parent: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            children: {
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
            parent_id: null, // Only top-level subcategories
            is_active: true
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
    });

    return success(res, 'Subcategories retrieved successfully', {
        category,
        subcategories
    });
});



// @desc    Get related categories based on subcategory
// @route   GET /api/subcategories/:id/related-categories
// @access  Public
exports.getRelatedCategories = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get the subcategory
    const subcategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(id) },
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

    const relatedSubcategoryNames = [subcategory.name.toLowerCase()];

    // Find all subcategories with similar names across different categories
    const allSubcategories = await prisma.subCategory.findMany({
        where: {
            is_active: true,
            category_id: { not: subcategory.category_id }
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

    // Group by category and find matches
    const categoryMap = new Map();
    
    allSubcategories.forEach(sub => {
        const subName = sub.name.toLowerCase();
        const isMatch = relatedSubcategoryNames.some(name => 
            name.includes(subName) || subName.includes(name) ||
            name.split(' ').some(word => subName.includes(word)) ||
            subName.split(' ').some(word => name.includes(word))
        );
        
        if (isMatch) {
            const categoryId = sub.category.id;
            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, {
                    ...sub.category,
                    matchingSubcategories: []
                });
            }
            categoryMap.get(categoryId).matchingSubcategories.push({
                id: sub.id,
                name: sub.name,
                slug: sub.slug
            });
        }
    });

    const relatedCategories = Array.from(categoryMap.values());

    return success(res, 'Related categories retrieved successfully', {
        subcategory: {
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            category: subcategory.category
        },
        relatedCategories
    });
});

// @desc    Get nested subcategories with their products (for website)
// @route   GET /api/subcategories/:id/products
// @access  Public
exports.getSubCategoryProducts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 12, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get the subcategory with children
    const subcategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(id) },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            parent: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            },
            children: {
                where: { is_active: true },
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

    // Get products for this subcategory (including sub-subcategories if it's a parent)
    const subcategoryIds = [parseInt(id)];
    if (subcategory.children && subcategory.children.length > 0) {
        subcategoryIds.push(...subcategory.children.map(child => child.id));
    }

    // Valid sort fields
    const validSortFields = ['created_at', 'price', 'name', 'rating', 'updated_at'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where: {
                sub_category_id: { in: subcategoryIds },
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
                        slug: true,
                        parent_id: true
                    },
                    include: {
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
            skip: skip,
            orderBy: { [validSortBy]: validSortOrder }
        }),
        prisma.product.count({
            where: {
                sub_category_id: { in: subcategoryIds },
                is_active: true
            }
        })
    ]);

    // Format images for each product
    const formattedProducts = products.map(product => {
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

        return {
            ...product,
            images,
            image: images && images.length > 0 ? images[0] : null
        };
    });

    return success(res, 'Products retrieved successfully', {
        subcategory: {
            ...subcategory,
            parent_id: subcategory.parent_id || null
        },
        products: formattedProducts,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// @desc    Get sub-subcategories by parent subcategory ID
// @route   GET /api/subcategories/by-parent/:parent_id
// @access  Public
exports.getSubCategoriesByParent = asyncHandler(async (req, res) => {
    const { parent_id } = req.params;

    // Verify parent subcategory exists
    const parentSubcategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(parent_id) },
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

    if (!parentSubcategory) {
        return error(res, 'Parent subcategory not found', 404);
    }

    // Get sub-subcategories (children)
    const subcategories = await prisma.subCategory.findMany({
        where: {
            parent_id: parseInt(parent_id),
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
        orderBy: { sort_order: 'asc' }
    });

    return success(res, 'Sub-subcategories retrieved successfully', {
        parentSubcategory: {
            id: parentSubcategory.id,
            name: parentSubcategory.name,
            slug: parentSubcategory.slug,
            category: parentSubcategory.category
        },
        subcategories: subcategories.map(sub => ({
            ...sub,
            parent_id: sub.parent_id
        }))
    });
});
