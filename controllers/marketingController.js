const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

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
        orderBy: { created_at: 'desc' }
    });
    return success(res, 'Campaigns retrieved successfully', { campaigns });
});

// @desc    Get all campaigns (Admin)
// @route   GET /api/admin/campaigns
// @access  Private/Admin
exports.getCampaignsAdmin = asyncHandler(async (req, res) => {
    const campaigns = await prisma.marketingCampaign.findMany({
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
