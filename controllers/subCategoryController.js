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

// Helper function to parse JSON option fields
const parseJsonOption = (value) => {
    if (!value) return null;
    try {
        return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
        return value;
    }
};

// @desc    Get contact lens options for spherical or astigmatism sub-subcategory
// @route   GET /api/subcategories/:id/contact-lens-options
// @access  Public
exports.getContactLensOptions = asyncHandler(async (req, res) => {
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

    // Check if it's a sub-subcategory (has parent_id)
    if (!subcategory.parent_id) {
        return error(res, 'This endpoint is only for sub-subcategories. Please provide a sub-subcategory ID.', 400);
    }

    // Check if it's spherical or astigmatism (case-insensitive check)
    const subcategoryNameLower = subcategory.name.toLowerCase();
    const isSpherical = subcategoryNameLower.includes('spherical') || 
                       subcategoryNameLower.includes('sferiche') ||
                       subcategoryNameLower.includes('sferica');
    const isAstigmatism = subcategoryNameLower.includes('astigmatism') || 
                         subcategoryNameLower.includes('astigmatismo') ||
                         subcategoryNameLower.includes('toric') ||
                         subcategoryNameLower.includes('torica');

    if (!isSpherical && !isAstigmatism) {
        return error(res, 'This endpoint is only for Spherical or Astigmatism/Toric sub-subcategories.', 400);
    }

    // Get all products in this sub-subcategory
    const products = await prisma.product.findMany({
        where: {
            sub_category_id: parseInt(id),
            is_active: true
        },
        select: {
            id: true,
            name: true,
            powers_range: true,
            base_curve_options: true,
            diameter_options: true
        }
    });

    if (products.length === 0) {
        const emptyResponse = {
            subcategory: {
                id: subcategory.id,
                name: subcategory.name,
                slug: subcategory.slug,
                parent: subcategory.parent
            },
            powerOptions: [],
            baseCurveOptions: [],
            diameterOptions: [],
            type: isSpherical ? 'spherical' : 'astigmatism'
        };
        
        // Add cylinder and axis options for Astigmatism even if no products
        if (isAstigmatism) {
            emptyResponse.cylinderOptions = generateCylinderOptions();
            emptyResponse.axisOptions = generateAxisOptions();
        }
        
        return success(res, 'No products found for this sub-subcategory', emptyResponse);
    }

    // Aggregate all unique options from all products
    const allPowerOptions = new Set();
    const allBaseCurveOptions = new Set();
    const allDiameterOptions = new Set();

    products.forEach(product => {
        // Parse and collect power options
        const powersRange = parseJsonOption(product.powers_range);
        if (powersRange) {
            if (Array.isArray(powersRange)) {
                powersRange.forEach(power => {
                    if (power !== null && power !== undefined && power !== '') {
                        allPowerOptions.add(power);
                    }
                });
            } else if (typeof powersRange === 'string') {
                // Handle string ranges like "-10.00 to +10.00" or comma-separated values
                const powers = powersRange.split(',').map(p => p.trim()).filter(p => p);
                powers.forEach(power => {
                    if (power !== null && power !== undefined && power !== '') {
                        allPowerOptions.add(power);
                    }
                });
            } else {
                allPowerOptions.add(powersRange);
            }
        }

        // Parse and collect base curve options
        const baseCurveOptions = parseJsonOption(product.base_curve_options);
        if (baseCurveOptions) {
            if (Array.isArray(baseCurveOptions)) {
                baseCurveOptions.forEach(bc => {
                    if (bc !== null && bc !== undefined && bc !== '') {
                        allBaseCurveOptions.add(bc);
                    }
                });
            } else {
                allBaseCurveOptions.add(baseCurveOptions);
            }
        }

        // Parse and collect diameter options
        const diameterOptions = parseJsonOption(product.diameter_options);
        if (diameterOptions) {
            if (Array.isArray(diameterOptions)) {
                diameterOptions.forEach(dia => {
                    if (dia !== null && dia !== undefined && dia !== '') {
                        allDiameterOptions.add(dia);
                    }
                });
            } else {
                allDiameterOptions.add(diameterOptions);
            }
        }
    });

    // Convert Sets to sorted arrays
    // For power options, try to sort numerically if possible
    const powerOptionsArray = Array.from(allPowerOptions);
    const sortedPowerOptions = powerOptionsArray.sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return String(a).localeCompare(String(b));
    });

    // For base curve and diameter, sort numerically
    const sortedBaseCurveOptions = Array.from(allBaseCurveOptions)
        .map(bc => parseFloat(bc))
        .filter(bc => !isNaN(bc))
        .sort((a, b) => a - b);

    const sortedDiameterOptions = Array.from(allDiameterOptions)
        .map(dia => parseFloat(dia))
        .filter(dia => !isNaN(dia))
        .sort((a, b) => a - b);

    // Build response based on subcategory type
    const responseData = {
        subcategory: {
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            parent: subcategory.parent,
            category: subcategory.category
        },
        powerOptions: sortedPowerOptions,
        baseCurveOptions: sortedBaseCurveOptions,
        diameterOptions: sortedDiameterOptions,
        productCount: products.length,
        type: isSpherical ? 'spherical' : 'astigmatism'
    };

    // Add cylinder and axis options for Astigmatism/Toric lenses
    if (isAstigmatism) {
        responseData.cylinderOptions = generateCylinderOptions();
        responseData.axisOptions = generateAxisOptions();
    }

    return success(res, 'Contact lens options retrieved successfully', responseData);
});

// @desc    Get contact lens options for spherical sub-subcategory by slug
// @route   GET /api/subcategories/slug/:slug/contact-lens-options
// @access  Public
exports.getContactLensOptionsBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    // Get the subcategory
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
            }
        }
    });

    if (!subcategory) {
        return error(res, 'Subcategory not found', 404);
    }

    // Check if it's a sub-subcategory (has parent_id)
    if (!subcategory.parent_id) {
        return error(res, 'This endpoint is only for sub-subcategories. Please provide a sub-subcategory slug.', 400);
    }

    // Check if it's spherical or astigmatism (case-insensitive check)
    const subcategoryNameLower = subcategory.name.toLowerCase();
    const isSpherical = subcategoryNameLower.includes('spherical') || 
                       subcategoryNameLower.includes('sferiche') ||
                       subcategoryNameLower.includes('sferica');
    const isAstigmatism = subcategoryNameLower.includes('astigmatism') || 
                         subcategoryNameLower.includes('astigmatismo') ||
                         subcategoryNameLower.includes('toric') ||
                         subcategoryNameLower.includes('torica');

    if (!isSpherical && !isAstigmatism) {
        return error(res, 'This endpoint is only for Spherical or Astigmatism/Toric sub-subcategories.', 400);
    }

    // Get all products in this sub-subcategory
    const products = await prisma.product.findMany({
        where: {
            sub_category_id: subcategory.id,
            is_active: true
        },
        select: {
            id: true,
            name: true,
            powers_range: true,
            base_curve_options: true,
            diameter_options: true
        }
    });

    if (products.length === 0) {
        const emptyResponse = {
            subcategory: {
                id: subcategory.id,
                name: subcategory.name,
                slug: subcategory.slug,
                parent: subcategory.parent
            },
            powerOptions: [],
            baseCurveOptions: [],
            diameterOptions: [],
            type: isSpherical ? 'spherical' : 'astigmatism'
        };
        
        // Add cylinder and axis options for Astigmatism even if no products
        if (isAstigmatism) {
            emptyResponse.cylinderOptions = generateCylinderOptions();
            emptyResponse.axisOptions = generateAxisOptions();
        }
        
        return success(res, 'No products found for this sub-subcategory', emptyResponse);
    }

    // Aggregate all unique options from all products
    const allPowerOptions = new Set();
    const allBaseCurveOptions = new Set();
    const allDiameterOptions = new Set();

    products.forEach(product => {
        // Parse and collect power options
        const powersRange = parseJsonOption(product.powers_range);
        if (powersRange) {
            if (Array.isArray(powersRange)) {
                powersRange.forEach(power => {
                    if (power !== null && power !== undefined && power !== '') {
                        allPowerOptions.add(power);
                    }
                });
            } else if (typeof powersRange === 'string') {
                // Handle string ranges like "-10.00 to +10.00" or comma-separated values
                const powers = powersRange.split(',').map(p => p.trim()).filter(p => p);
                powers.forEach(power => {
                    if (power !== null && power !== undefined && power !== '') {
                        allPowerOptions.add(power);
                    }
                });
            } else {
                allPowerOptions.add(powersRange);
            }
        }

        // Parse and collect base curve options
        const baseCurveOptions = parseJsonOption(product.base_curve_options);
        if (baseCurveOptions) {
            if (Array.isArray(baseCurveOptions)) {
                baseCurveOptions.forEach(bc => {
                    if (bc !== null && bc !== undefined && bc !== '') {
                        allBaseCurveOptions.add(bc);
                    }
                });
            } else {
                allBaseCurveOptions.add(baseCurveOptions);
            }
        }

        // Parse and collect diameter options
        const diameterOptions = parseJsonOption(product.diameter_options);
        if (diameterOptions) {
            if (Array.isArray(diameterOptions)) {
                diameterOptions.forEach(dia => {
                    if (dia !== null && dia !== undefined && dia !== '') {
                        allDiameterOptions.add(dia);
                    }
                });
            } else {
                allDiameterOptions.add(diameterOptions);
            }
        }
    });

    // Convert Sets to sorted arrays
    // For power options, try to sort numerically if possible
    const powerOptionsArray = Array.from(allPowerOptions);
    const sortedPowerOptions = powerOptionsArray.sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return String(a).localeCompare(String(b));
    });

    // For base curve and diameter, sort numerically
    const sortedBaseCurveOptions = Array.from(allBaseCurveOptions)
        .map(bc => parseFloat(bc))
        .filter(bc => !isNaN(bc))
        .sort((a, b) => a - b);

    const sortedDiameterOptions = Array.from(allDiameterOptions)
        .map(dia => parseFloat(dia))
        .filter(dia => !isNaN(dia))
        .sort((a, b) => a - b);

    // Build response based on subcategory type
    const responseData = {
        subcategory: {
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            parent: subcategory.parent,
            category: subcategory.category
        },
        powerOptions: sortedPowerOptions,
        baseCurveOptions: sortedBaseCurveOptions,
        diameterOptions: sortedDiameterOptions,
        productCount: products.length,
        type: isSpherical ? 'spherical' : 'astigmatism'
    };

    // Add cylinder and axis options for Astigmatism/Toric lenses
    if (isAstigmatism) {
        responseData.cylinderOptions = generateCylinderOptions();
        responseData.axisOptions = generateAxisOptions();
    }

    return success(res, 'Contact lens options retrieved successfully', responseData);
});

// Helper function to generate standard cylinder options
// Common range: -0.25 to -6.00 in 0.25 steps
function generateCylinderOptions() {
    const options = [];
    // Generate from -0.25 to -6.00 in 0.25 increments
    for (let i = -0.25; i >= -6.00; i -= 0.25) {
        options.push(parseFloat(i.toFixed(2)));
    }
    return options;
}

// Helper function to generate standard axis options
// Common range: 0 to 180 degrees in 1 degree steps
function generateAxisOptions() {
    const options = [];
    // Generate from 0 to 180 degrees in 1 degree increments
    for (let i = 0; i <= 180; i++) {
        options.push(i);
    }
    return options;
}