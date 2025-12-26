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

    const subcategory = await prisma.subCategory.findFirst({
        where: { slug, is_active: true },
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

    // Import formatProductMedia from productController to format images and color_images
    const { formatProductMedia } = require('./productController');
    
    // Format products with images and color_images (includes color swatches)
    const formattedProducts = products.map(formatProductMedia);

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

// @desc    Get contact lens options for a sub-subcategory
// @route   GET /api/subcategories/:id/contact-lens-options
// @access  Public
exports.getContactLensOptions = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get the subcategory with parent and category info
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
            }
        }
    });

    if (!subcategory) {
        return error(res, 'Subcategory not found', 404);
    }

    // Verify this is a sub-subcategory (has parent_id)
    if (!subcategory.parent_id) {
        return error(res, 'This endpoint only works for sub-subcategories (third level)', 400);
    }

    // Detect subcategory type based on name
    const subCategoryName = subcategory.name.toLowerCase();
    const isSpherical = subCategoryName.includes('spherical') ||
        subCategoryName.includes('sferiche') ||
        subCategoryName.includes('sferica');
    const isAstigmatism = subCategoryName.includes('astigmatism') ||
        subCategoryName.includes('astigmatismo') ||
        subCategoryName.includes('toric') ||
        subCategoryName.includes('torica');

    if (!isSpherical && !isAstigmatism) {
        return error(res, 'This subcategory is not a contact lens type (Spherical or Astigmatism/Toric)', 400);
    }

    // Get all products in this sub-subcategory
    const products = await prisma.product.findMany({
        where: {
            sub_category_id: parseInt(id),
            is_active: true
        },
        select: {
            id: true,
            base_curve_options: true,
            diameter_options: true,
            powers_range: true
        }
    });

    // Aggregate unique options
    const baseCurveSet = new Set();
    const diameterSet = new Set();
    const powerSet = new Set();

    products.forEach(product => {
        // Parse base curve options
        const baseCurves = parseJsonOption(product.base_curve_options);
        if (Array.isArray(baseCurves)) {
            baseCurves.forEach(bc => baseCurveSet.add(parseFloat(bc)));
        }

        // Parse diameter options
        const diameters = parseJsonOption(product.diameter_options);
        if (Array.isArray(diameters)) {
            diameters.forEach(d => diameterSet.add(parseFloat(d)));
        }

        // Parse power range
        const powers = parseJsonOption(product.powers_range);
        if (Array.isArray(powers)) {
            powers.forEach(p => powerSet.add(p.toString()));
        } else if (typeof powers === 'string') {
            // Parse range string like "-0.50 to -6.00 in 0.25 steps"
            const rangeMatch = powers.match(/([-+]?\d+\.?\d*)\s+to\s+([-+]?\d+\.?\d*)\s+in\s+([-+]?\d+\.?\d*)/i);
            if (rangeMatch) {
                const start = parseFloat(rangeMatch[1]);
                const end = parseFloat(rangeMatch[2]);
                const step = parseFloat(rangeMatch[3]);

                for (let val = start; start < end ? val <= end : val >= end; val = parseFloat((val + (start < end ? step : -step)).toFixed(2))) {
                    powerSet.add(val.toFixed(2));
                }
            }
        }
    });

    // Convert sets to sorted arrays
    const baseCurveOptions = Array.from(baseCurveSet).sort((a, b) => a - b);
    const diameterOptions = Array.from(diameterSet).sort((a, b) => a - b);
    const powerOptions = Array.from(powerSet).sort((a, b) => parseFloat(a) - parseFloat(b));

    const responseData = {
        subcategory: {
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            parent: subcategory.parent,
            category: subcategory.category
        },
        powerOptions,
        baseCurveOptions,
        diameterOptions,
        productCount: products.length,
        type: isSpherical ? 'spherical' : 'astigmatism'
    };

    // Add cylinder and axis options for astigmatism
    if (isAstigmatism) {
        // Standard cylinder options from -0.25 to -6.00 in 0.25 steps
        const cylinderOptions = [];
        for (let i = -0.25; i >= -6.00; i -= 0.25) {
            cylinderOptions.push(parseFloat(i.toFixed(2)));
        }

        // Standard axis options from 0 to 180
        const axisOptions = [];
        for (let i = 0; i <= 180; i++) {
            axisOptions.push(i);
        }

        responseData.cylinderOptions = cylinderOptions;
        responseData.axisOptions = axisOptions;
    }

    return success(res, 'Contact lens options retrieved successfully', responseData);
});

// @desc    Get contact lens options for a sub-subcategory by slug
// @route   GET /api/subcategories/slug/:slug/contact-lens-options
// @access  Public
exports.getContactLensOptionsBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    // Get the subcategory with parent and category info
    const subcategory = await prisma.subCategory.findFirst({
        where: {
            slug,
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
            parent: {
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

    // Verify this is a sub-subcategory (has parent_id)
    if (!subcategory.parent_id) {
        return error(res, 'This endpoint only works for sub-subcategories (third level)', 400);
    }

    // Detect subcategory type based on name
    const subCategoryName = subcategory.name.toLowerCase();
    const isSpherical = subCategoryName.includes('spherical') ||
        subCategoryName.includes('sferiche') ||
        subCategoryName.includes('sferica');
    const isAstigmatism = subCategoryName.includes('astigmatism') ||
        subCategoryName.includes('astigmatismo') ||
        subCategoryName.includes('toric') ||
        subCategoryName.includes('torica');

    if (!isSpherical && !isAstigmatism) {
        return error(res, 'This subcategory is not a contact lens type (Spherical or Astigmatism/Toric)', 400);
    }

    // Get all products in this sub-subcategory
    const products = await prisma.product.findMany({
        where: {
            sub_category_id: subcategory.id,
            is_active: true
        },
        select: {
            id: true,
            base_curve_options: true,
            diameter_options: true,
            powers_range: true
        }
    });

    // Aggregate unique options
    const baseCurveSet = new Set();
    const diameterSet = new Set();
    const powerSet = new Set();

    products.forEach(product => {
        // Parse base curve options
        const baseCurves = parseJsonOption(product.base_curve_options);
        if (Array.isArray(baseCurves)) {
            baseCurves.forEach(bc => baseCurveSet.add(parseFloat(bc)));
        }

        // Parse diameter options
        const diameters = parseJsonOption(product.diameter_options);
        if (Array.isArray(diameters)) {
            diameters.forEach(d => diameterSet.add(parseFloat(d)));
        }

        // Parse power range
        const powers = parseJsonOption(product.powers_range);
        if (Array.isArray(powers)) {
            powers.forEach(p => powerSet.add(p.toString()));
        } else if (typeof powers === 'string') {
            // Parse range string like "-0.50 to -6.00 in 0.25 steps"
            const rangeMatch = powers.match(/([-+]?\d+\.?\d*)\s+to\s+([-+]?\d+\.?\d*)\s+in\s+([-+]?\d+\.?\d*)/i);
            if (rangeMatch) {
                const start = parseFloat(rangeMatch[1]);
                const end = parseFloat(rangeMatch[2]);
                const step = parseFloat(rangeMatch[3]);

                for (let val = start; start < end ? val <= end : val >= end; val = parseFloat((val + (start < end ? step : -step)).toFixed(2))) {
                    powerSet.add(val.toFixed(2));
                }
            }
        }
    });

    // Convert sets to sorted arrays
    const baseCurveOptions = Array.from(baseCurveSet).sort((a, b) => a - b);
    const diameterOptions = Array.from(diameterSet).sort((a, b) => a - b);
    const powerOptions = Array.from(powerSet).sort((a, b) => parseFloat(a) - parseFloat(b));

    const responseData = {
        subcategory: {
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            parent: subcategory.parent,
            category: subcategory.category
        },
        powerOptions,
        baseCurveOptions,
        diameterOptions,
        productCount: products.length,
        type: isSpherical ? 'spherical' : 'astigmatism'
    };

    // Add cylinder and axis options for astigmatism
    if (isAstigmatism) {
        // Standard cylinder options from -0.25 to -6.00 in 0.25 steps
        const cylinderOptions = [];
        for (let i = -0.25; i >= -6.00; i -= 0.25) {
            cylinderOptions.push(parseFloat(i.toFixed(2)));
        }

        // Standard axis options from 0 to 180
        const axisOptions = [];
        for (let i = 0; i <= 180; i++) {
            axisOptions.push(i);
        }

        responseData.cylinderOptions = cylinderOptions;
        responseData.axisOptions = axisOptions;
    }

    return success(res, 'Contact lens options retrieved successfully', responseData);
});

// Helper function to parse JSON option fields
const parseJsonOption = (value) => {
    if (!value) return null;
    try {
        return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
        return value;
    }
};