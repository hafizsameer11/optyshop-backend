const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { uploadToS3 } = require('../config/aws');

// ==================== COUPONS ====================

// @desc    Get all coupons (Admin)
// @route   GET /api/admin/coupons
// @access  Private/Admin
exports.getCoupons = asyncHandler(async (req, res) => {
    const coupons = await prisma.coupon.findMany({
        orderBy: { created_at: 'desc' }
    });
    return success(res, 'Coupons retrieved successfully', { coupons });
});

// @desc    Create coupon (Admin)
// @route   POST /api/admin/coupons
// @access  Private/Admin
exports.createCoupon = asyncHandler(async (req, res) => {
    const { code, discount_value, discount_type, valid_from, valid_until, ...rest } = req.body;

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
        return error(res, 'Coupon code already exists', 400);
    }

    // Map valid_from/valid_until to starts_at/ends_at and convert to Date objects
    const couponData = {
        ...rest,
        code,
        discount_value,
        discount_type
    };

    // Handle date fields - prioritize valid_from/valid_until over starts_at/ends_at
    if (valid_from !== undefined) {
        couponData.starts_at = valid_from ? new Date(valid_from) : null;
    } else if (rest.starts_at !== undefined) {
        couponData.starts_at = rest.starts_at ? new Date(rest.starts_at) : null;
    }

    if (valid_until !== undefined) {
        couponData.ends_at = valid_until ? new Date(valid_until) : null;
    } else if (rest.ends_at !== undefined) {
        couponData.ends_at = rest.ends_at ? new Date(rest.ends_at) : null;
    }

    // Handle conditions field - if it's an object, stringify it to JSON
    // Database expects valid JSON or null
    if (couponData.conditions !== undefined) {
        if (typeof couponData.conditions === 'object' && couponData.conditions !== null) {
            couponData.conditions = JSON.stringify(couponData.conditions);
        } else if (couponData.conditions === null || couponData.conditions === '') {
            couponData.conditions = null;
        } else if (typeof couponData.conditions === 'string') {
            // Validate it's valid JSON
            try {
                JSON.parse(couponData.conditions);
                // If parsing succeeds, it's valid JSON, keep it as is
            } catch (e) {
                // If it's not valid JSON, set to null to avoid constraint error
                couponData.conditions = null;
            }
        }
    }

    const coupon = await prisma.coupon.create({
        data: couponData
    });

    return success(res, 'Coupon created successfully', { coupon }, 201);
});

// @desc    Update coupon (Admin)
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
exports.updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { valid_from, valid_until, ...rest } = req.body;

    // Map valid_from/valid_until to starts_at/ends_at and convert to Date objects
    const updateData = { ...rest };
    
    if (valid_from !== undefined) {
        updateData.starts_at = valid_from ? new Date(valid_from) : null;
    } else if (rest.starts_at !== undefined) {
        updateData.starts_at = rest.starts_at ? new Date(rest.starts_at) : null;
    }
    
    if (valid_until !== undefined) {
        updateData.ends_at = valid_until ? new Date(valid_until) : null;
    } else if (rest.ends_at !== undefined) {
        updateData.ends_at = rest.ends_at ? new Date(rest.ends_at) : null;
    }

    // Handle conditions field - if it's an object, stringify it to JSON
    // Database expects valid JSON or null
    if (updateData.conditions !== undefined) {
        if (typeof updateData.conditions === 'object' && updateData.conditions !== null) {
            updateData.conditions = JSON.stringify(updateData.conditions);
        } else if (updateData.conditions === null || updateData.conditions === '') {
            updateData.conditions = null;
        } else if (typeof updateData.conditions === 'string') {
            // Validate it's valid JSON
            try {
                JSON.parse(updateData.conditions);
                // If parsing succeeds, it's valid JSON, keep it as is
            } catch (e) {
                // If it's not valid JSON, set to null to avoid constraint error
                updateData.conditions = null;
            }
        }
    }

    const coupon = await prisma.coupon.update({
        where: { id: parseInt(id) },
        data: updateData
    });
    return success(res, 'Coupon updated successfully', { coupon });
});

// @desc    Delete coupon (Admin)
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id: parseInt(id) } });
    return success(res, 'Coupon deleted successfully');
});

// @desc    Get active coupons (Public)
// @route   GET /api/coupons
// @access  Public
exports.getCouponsPublic = asyncHandler(async (req, res) => {
    const { activeOnly = 'true' } = req.query;
    
    const now = new Date();
    const where = {
        is_active: true,
        AND: [
            {
                OR: [
                    { starts_at: null },
                    { starts_at: { lte: now } }
                ]
            },
            {
                OR: [
                    { ends_at: null },
                    { ends_at: { gte: now } }
                ]
            }
        ]
    };
    
    const coupons = await prisma.coupon.findMany({
        where,
        select: {
            id: true,
            code: true,
            description: true,
            discount_type: true,
            discount_value: true,
            max_discount: true,
            min_order_amount: true,
            starts_at: true,
            ends_at: true,
            is_active: true
        },
        orderBy: { created_at: 'desc' }
    });
    
    return success(res, 'Coupons retrieved successfully', {
        coupons: coupons.map(coupon => ({
            ...coupon,
            discount_value: parseFloat(coupon.discount_value),
            max_discount: coupon.max_discount ? parseFloat(coupon.max_discount) : null,
            min_order_amount: coupon.min_order_amount ? parseFloat(coupon.min_order_amount) : null
        })),
        count: coupons.length
    });
});

// @desc    Get available coupons for cart items (Public)
// @route   POST /api/coupons/available
// @access  Public
exports.getAvailableCoupons = asyncHandler(async (req, res) => {
    const { cartItems, productIds, subtotal } = req.body;

    // Extract product IDs from cartItems or use provided productIds
    let productIdList = [];
    let calculatedSubtotal = subtotal || 0;

    if (cartItems && cartItems.length > 0) {
        productIdList = cartItems.map(item => item.product_id || item.productId).filter(Boolean);
        // Calculate subtotal if not provided
        if (!calculatedSubtotal) {
            calculatedSubtotal = cartItems.reduce((sum, item) => {
                return sum + (parseFloat(item.unit_price || item.price || 0) * (item.quantity || 1));
            }, 0);
        }
    } else if (productIds && productIds.length > 0) {
        productIdList = Array.isArray(productIds) ? productIds : [productIds];
    }

    // Get all active coupons
    const now = new Date();
    const allCoupons = await prisma.coupon.findMany({
        where: {
            is_active: true,
            AND: [
                {
                    OR: [
                        { starts_at: null },
                        { starts_at: { lte: now } }
                    ]
                },
                {
                    OR: [
                        { ends_at: null },
                        { ends_at: { gte: now } }
                    ]
                }
            ]
        },
        orderBy: { created_at: 'desc' }
    });

    // Filter coupons based on product applicability and minimum order amount
    const availableCoupons = [];

    for (const coupon of allCoupons) {
        // Check minimum order amount
        if (coupon.min_order_amount && calculatedSubtotal < parseFloat(coupon.min_order_amount)) {
            continue;
        }

        // Check if coupon is applicable to products
        let isApplicable = true;

        if (coupon.conditions) {
            try {
                const conditions = typeof coupon.conditions === 'string' 
                    ? JSON.parse(coupon.conditions) 
                    : coupon.conditions;

                // If conditions specify product_ids, check if any cart product matches
                if (conditions.product_ids && Array.isArray(conditions.product_ids)) {
                    if (productIdList.length === 0) {
                        // No products in cart, but coupon requires specific products
                        isApplicable = false;
                    } else {
                        // Check if any cart product ID is in the coupon's product_ids
                        isApplicable = productIdList.some(id => conditions.product_ids.includes(parseInt(id)));
                    }
                }
                // If conditions specify category_ids, check if any cart product's category matches
                else if (conditions.category_ids && Array.isArray(conditions.category_ids)) {
                    if (productIdList.length === 0) {
                        isApplicable = false;
                    } else {
                        // Fetch products to get their category_ids
                        const products = await prisma.product.findMany({
                            where: { id: { in: productIdList } },
                            select: { category_id: true }
                        });
                        const productCategoryIds = products.map(p => p.category_id);
                        isApplicable = productCategoryIds.some(catId => conditions.category_ids.includes(catId));
                    }
                }
                // If conditions is null or empty, coupon applies to all products
            } catch (e) {
                // If conditions is invalid JSON, treat as applicable to all
                console.error('Error parsing coupon conditions:', e);
            }
        }
        // If conditions is null, coupon applies to all products

        if (isApplicable) {
            // Calculate discount amount for preview
            let discountAmount = 0;
            if (coupon.discount_type === 'percentage') {
                discountAmount = (calculatedSubtotal * parseFloat(coupon.discount_value)) / 100;
                if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
                    discountAmount = parseFloat(coupon.max_discount);
                }
            } else if (coupon.discount_type === 'fixed_amount') {
                discountAmount = parseFloat(coupon.discount_value);
                if (discountAmount > calculatedSubtotal) {
                    discountAmount = calculatedSubtotal;
                }
            }

            availableCoupons.push({
                id: coupon.id,
                code: coupon.code,
                description: coupon.description,
                discount_type: coupon.discount_type,
                discount_value: parseFloat(coupon.discount_value),
                discount_amount: discountAmount,
                max_discount: coupon.max_discount ? parseFloat(coupon.max_discount) : null,
                min_order_amount: coupon.min_order_amount ? parseFloat(coupon.min_order_amount) : null,
                free_shipping: coupon.discount_type === 'free_shipping',
                ends_at: coupon.ends_at
            });
        }
    }

    return success(res, 'Available coupons retrieved successfully', {
        coupons: availableCoupons,
        count: availableCoupons.length
    });
});

// @desc    Apply coupon code (Public - but may require auth for user-specific limits)
// @route   POST /api/coupons/apply
// @access  Public
exports.applyCoupon = asyncHandler(async (req, res) => {
    const { code, cartItems, subtotal } = req.body;

    if (!code) {
        return error(res, 'Coupon code is required', 400);
    }

    if (!subtotal && (!cartItems || cartItems.length === 0)) {
        return error(res, 'Cart items or subtotal is required', 400);
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase().trim() }
    });

    if (!coupon) {
        return error(res, 'Invalid coupon code', 404);
    }

    // Check if coupon is active
    if (!coupon.is_active) {
        return error(res, 'Coupon is not active', 400);
    }

    // Check date validity
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return error(res, 'Coupon is not yet valid', 400);
    }
    if (coupon.ends_at && new Date(coupon.ends_at) < now) {
        return error(res, 'Coupon has expired', 400);
    }

    // Calculate subtotal if not provided
    let calculatedSubtotal = subtotal;
    if (!calculatedSubtotal && cartItems) {
        calculatedSubtotal = cartItems.reduce((sum, item) => {
            return sum + (parseFloat(item.unit_price || item.price || 0) * (item.quantity || 1));
        }, 0);
    }

    // Check minimum order amount
    if (coupon.min_order_amount && calculatedSubtotal < parseFloat(coupon.min_order_amount)) {
        return error(res, `Minimum order amount of $${coupon.min_order_amount} required`, 400);
    }

    // Check if coupon is applicable to products in cart
    if (coupon.conditions) {
        try {
            const conditions = typeof coupon.conditions === 'string' 
                ? JSON.parse(coupon.conditions) 
                : coupon.conditions;

            // Extract product IDs from cartItems
            const productIdList = cartItems 
                ? cartItems.map(item => item.product_id || item.productId).filter(Boolean)
                : [];

            // If conditions specify product_ids, check if any cart product matches
            if (conditions.product_ids && Array.isArray(conditions.product_ids)) {
                if (productIdList.length === 0) {
                    return error(res, 'This coupon is not applicable to your cart items', 400);
                }
                const isApplicable = productIdList.some(id => conditions.product_ids.includes(parseInt(id)));
                if (!isApplicable) {
                    return error(res, 'This coupon is not applicable to products in your cart', 400);
                }
            }
            // If conditions specify category_ids, check if any cart product's category matches
            else if (conditions.category_ids && Array.isArray(conditions.category_ids)) {
                if (productIdList.length === 0) {
                    return error(res, 'This coupon is not applicable to your cart items', 400);
                }
                const products = await prisma.product.findMany({
                    where: { id: { in: productIdList } },
                    select: { category_id: true }
                });
                const productCategoryIds = products.map(p => p.category_id);
                const isApplicable = productCategoryIds.some(catId => conditions.category_ids.includes(catId));
                if (!isApplicable) {
                    return error(res, 'This coupon is not applicable to products in your cart', 400);
                }
            }
        } catch (e) {
            // If conditions is invalid JSON, treat as applicable to all
            console.error('Error parsing coupon conditions:', e);
        }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
        discountAmount = (calculatedSubtotal * parseFloat(coupon.discount_value)) / 100;
        if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
            discountAmount = parseFloat(coupon.max_discount);
        }
    } else if (coupon.discount_type === 'fixed_amount') {
        discountAmount = parseFloat(coupon.discount_value);
        if (discountAmount > calculatedSubtotal) {
            discountAmount = calculatedSubtotal;
        }
    } else if (coupon.discount_type === 'free_shipping') {
        // Free shipping - discount amount would be shipping cost (calculated separately)
        discountAmount = 0; // Shipping discount handled separately
    } else if (coupon.discount_type === 'bogo') {
        // Buy one get one - would need special logic based on cart items
        discountAmount = 0; // BOGO logic would be more complex
    }

    return success(res, 'Coupon applied successfully', {
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: discountAmount,
            free_shipping: coupon.discount_type === 'free_shipping'
        }
    });
});

// ==================== CAMPAIGNS ====================

// @desc    Get all campaigns (Public - with optional activeOnly filter)
// @route   GET /api/campaigns
// @access  Public
exports.getCampaigns = asyncHandler(async (req, res) => {
    const { activeOnly } = req.query;
    
    const where = {};
    if (activeOnly === 'true') {
        const now = new Date();
        where.is_active = true;
        where.AND = [
            {
                OR: [
                    { starts_at: null },
                    { starts_at: { lte: now } }
                ]
            },
            {
                OR: [
                    { ends_at: null },
                    { ends_at: { gte: now } }
                ]
            }
        ];
    }
    
    const campaigns = await prisma.marketingCampaign.findMany({
        where,
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            campaign_type: true,
            config: true,
            is_active: true,
            starts_at: true,
            ends_at: true,
            created_at: true,
            updated_at: true,
            image_url: true,
            link_url: true,
        },
        orderBy: { created_at: 'desc' }
    });
    return success(res, 'Campaigns retrieved successfully', { campaigns });
});

// @desc    Get all campaigns (Admin)
// @route   GET /api/admin/campaigns
// @access  Private/Admin
exports.getCampaignsAdmin = asyncHandler(async (req, res) => {
    const campaigns = await prisma.marketingCampaign.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            campaign_type: true,
            config: true,
            is_active: true,
            starts_at: true,
            ends_at: true,
            created_at: true,
            updated_at: true,
            image_url: true,
            link_url: true,
        },
        orderBy: { created_at: 'desc' }
    });
    return success(res, 'Campaigns retrieved successfully', { campaigns });
});

// @desc    Create campaign (Admin)
// @route   POST /api/admin/campaigns
// @access  Private/Admin
exports.createCampaign = asyncHandler(async (req, res) => {
    const { start_date, end_date, ...rest } = req.body;
    
    const campaignData = { ...rest };
    if (!campaignData.slug) {
        campaignData.slug = campaignData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // Handle image upload if provided
    if (req.file) {
        const imageUrl = await uploadToS3(req.file, 'campaigns');
        campaignData.image_url = imageUrl;
    }

    // Handle link_url (can be provided directly in body)
    if (campaignData.link_url === '') {
        campaignData.link_url = null;
    }

    // Map start_date/end_date to starts_at/ends_at and convert to Date objects
    if (start_date !== undefined) {
        campaignData.starts_at = start_date ? new Date(start_date) : null;
    } else if (rest.starts_at !== undefined) {
        campaignData.starts_at = rest.starts_at ? new Date(rest.starts_at) : null;
    }

    if (end_date !== undefined) {
        campaignData.ends_at = end_date ? new Date(end_date) : null;
    } else if (rest.ends_at !== undefined) {
        campaignData.ends_at = rest.ends_at ? new Date(rest.ends_at) : null;
    }
    
    // Convert is_active from string to boolean (FormData sends strings)
    if (campaignData.is_active !== undefined && campaignData.is_active !== null) {
        if (typeof campaignData.is_active === 'string') {
            campaignData.is_active = campaignData.is_active.toLowerCase() === 'true';
        } else {
            campaignData.is_active = Boolean(campaignData.is_active);
        }
    }

    const campaign = await prisma.marketingCampaign.create({
        data: campaignData
    });

    return success(res, 'Campaign created successfully', { campaign }, 201);
});

// @desc    Update campaign (Admin)
// @route   PUT /api/admin/campaigns/:id
// @access  Private/Admin
exports.updateCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { start_date, end_date, ...rest } = req.body;

    // Map start_date/end_date to starts_at/ends_at and convert to Date objects
    const updateData = { ...rest };
    
    // Handle image upload if provided
    if (req.file) {
        const imageUrl = await uploadToS3(req.file, 'campaigns');
        updateData.image_url = imageUrl;
    }

    // Handle link_url (can be provided directly in body)
    if (updateData.link_url === '') {
        updateData.link_url = null;
    }
    
    if (start_date !== undefined) {
        updateData.starts_at = start_date ? new Date(start_date) : null;
    } else if (rest.starts_at !== undefined) {
        updateData.starts_at = rest.starts_at ? new Date(rest.starts_at) : null;
    }
    
    if (end_date !== undefined) {
        updateData.ends_at = end_date ? new Date(end_date) : null;
    } else if (rest.ends_at !== undefined) {
        updateData.ends_at = rest.ends_at ? new Date(rest.ends_at) : null;
    }
    
    // Convert is_active from string to boolean (FormData sends strings)
    if (updateData.is_active !== undefined && updateData.is_active !== null) {
        if (typeof updateData.is_active === 'string') {
            updateData.is_active = updateData.is_active.toLowerCase() === 'true';
        } else {
            updateData.is_active = Boolean(updateData.is_active);
        }
    }

    const campaign = await prisma.marketingCampaign.update({
        where: { id: parseInt(id) },
        data: updateData
    });
    return success(res, 'Campaign updated successfully', { campaign });
});

// @desc    Delete campaign (Admin)
// @route   DELETE /api/admin/campaigns/:id
// @access  Private/Admin
exports.deleteCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.marketingCampaign.delete({ where: { id: parseInt(id) } });
    return success(res, 'Campaign deleted successfully');
});

// ==================== BRANDS ====================

// @desc    Get all brands (Public - with optional activeOnly filter)
// @route   GET /api/brands
// @access  Public
exports.getBrands = asyncHandler(async (req, res) => {
    const { activeOnly } = req.query;
    
    const where = {};
    if (activeOnly === 'true') {
        where.is_active = true;
    }
    
    const brands = await prisma.brand.findMany({
        where,
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }]
    });
    return success(res, 'Brands retrieved successfully', { brands });
});

// @desc    Get all brands (Admin)
// @route   GET /api/admin/brands
// @access  Private/Admin
exports.getBrandsAdmin = asyncHandler(async (req, res) => {
    const brands = await prisma.brand.findMany({
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }]
    });
    return success(res, 'Brands retrieved successfully', { brands });
});

// @desc    Get single brand (Admin)
// @route   GET /api/admin/brands/:id
// @access  Private/Admin
exports.getBrandAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({
        where: { id: parseInt(id) }
    });
    
    if (!brand) {
        return error(res, 'Brand not found', 404);
    }
    
    return success(res, 'Brand retrieved successfully', { brand });
});

// @desc    Create brand (Admin)
// @route   POST /api/admin/brands
// @access  Private/Admin
exports.createBrand = asyncHandler(async (req, res) => {
    const brandData = { ...req.body };
    
    // Auto-generate slug if not provided
    if (!brandData.slug) {
        brandData.slug = brandData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    
    // Check if slug already exists
    const existing = await prisma.brand.findUnique({ where: { slug: brandData.slug } });
    if (existing) {
        return error(res, 'Brand with this slug already exists', 400);
    }

    // Handle logo upload if provided
    if (req.file) {
        const logoUrl = await uploadToS3(req.file, 'brands');
        brandData.logo_url = logoUrl;
    }

    // Handle website_url (can be provided directly in body)
    if (brandData.website_url === '') {
        brandData.website_url = null;
    }
    
    // Convert sort_order to integer if provided
    if (brandData.sort_order !== undefined) {
        brandData.sort_order = parseInt(brandData.sort_order) || 0;
    }
    
    // Convert is_active from string to boolean (FormData sends strings)
    if (brandData.is_active !== undefined && brandData.is_active !== null) {
        if (typeof brandData.is_active === 'string') {
            brandData.is_active = brandData.is_active.toLowerCase() === 'true';
        } else {
            brandData.is_active = Boolean(brandData.is_active);
        }
    }

    const brand = await prisma.brand.create({
        data: brandData
    });

    return success(res, 'Brand created successfully', { brand }, 201);
});

// @desc    Update brand (Admin)
// @route   PUT /api/admin/brands/:id
// @access  Private/Admin
exports.updateBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if brand exists
    const existing = await prisma.brand.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
        return error(res, 'Brand not found', 404);
    }
    
    // Handle slug update - check for uniqueness if slug is being changed
    if (updateData.slug && updateData.slug !== existing.slug) {
        const slugExists = await prisma.brand.findUnique({ where: { slug: updateData.slug } });
        if (slugExists) {
            return error(res, 'Brand with this slug already exists', 400);
        }
    }
    
    // Handle logo upload if provided
    if (req.file) {
        const logoUrl = await uploadToS3(req.file, 'brands');
        updateData.logo_url = logoUrl;
    }

    // Handle website_url (can be provided directly in body)
    if (updateData.website_url === '') {
        updateData.website_url = null;
    }
    
    // Convert sort_order to integer if provided
    if (updateData.sort_order !== undefined) {
        updateData.sort_order = parseInt(updateData.sort_order) || 0;
    }
    
    // Convert is_active from string to boolean (FormData sends strings)
    if (updateData.is_active !== undefined && updateData.is_active !== null) {
        if (typeof updateData.is_active === 'string') {
            updateData.is_active = updateData.is_active.toLowerCase() === 'true';
        } else {
            updateData.is_active = Boolean(updateData.is_active);
        }
    }

    const brand = await prisma.brand.update({
        where: { id: parseInt(id) },
        data: updateData
    });
    
    return success(res, 'Brand updated successfully', { brand });
});

// @desc    Delete brand (Admin)
// @route   DELETE /api/admin/brands/:id
// @access  Private/Admin
exports.deleteBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if brand exists
    const existing = await prisma.brand.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
        return error(res, 'Brand not found', 404);
    }
    
    await prisma.brand.delete({ where: { id: parseInt(id) } });
    return success(res, 'Brand deleted successfully');
});