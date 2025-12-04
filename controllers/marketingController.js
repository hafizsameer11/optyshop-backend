const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// ==================== COUPONS ====================

// @desc    Get all coupons (Admin)
// @route   GET /api/marketing/coupons
// @access  Private/Admin
exports.getCoupons = asyncHandler(async (req, res) => {
    const coupons = await prisma.coupon.findMany({
        orderBy: { created_at: 'desc' }
    });
    return success(res, 'Coupons retrieved successfully', { coupons });
});

// @desc    Create coupon (Admin)
// @route   POST /api/marketing/coupons
// @access  Private/Admin
exports.createCoupon = asyncHandler(async (req, res) => {
    const { code, discount_value, discount_type } = req.body;

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
        return error(res, 'Coupon code already exists', 400);
    }

    const coupon = await prisma.coupon.create({
        data: req.body
    });

    return success(res, 'Coupon created successfully', { coupon }, 201);
});

// @desc    Update coupon (Admin)
// @route   PUT /api/marketing/coupons/:id
// @access  Private/Admin
exports.updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const coupon = await prisma.coupon.update({
        where: { id: parseInt(id) },
        data: req.body
    });
    return success(res, 'Coupon updated successfully', { coupon });
});

// @desc    Delete coupon (Admin)
// @route   DELETE /api/marketing/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id: parseInt(id) } });
    return success(res, 'Coupon deleted successfully');
});

// ==================== CAMPAIGNS ====================

// @desc    Get all campaigns (Admin)
// @route   GET /api/marketing/campaigns
// @access  Private/Admin
exports.getCampaigns = asyncHandler(async (req, res) => {
    const campaigns = await prisma.marketingCampaign.findMany({
        orderBy: { created_at: 'desc' }
    });
    return success(res, 'Campaigns retrieved successfully', { campaigns });
});

// @desc    Create campaign (Admin)
// @route   POST /api/marketing/campaigns
// @access  Private/Admin
exports.createCampaign = asyncHandler(async (req, res) => {
    const campaignData = { ...req.body };
    if (!campaignData.slug) {
        campaignData.slug = campaignData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const campaign = await prisma.marketingCampaign.create({
        data: campaignData
    });

    return success(res, 'Campaign created successfully', { campaign }, 201);
});

// @desc    Update campaign (Admin)
// @route   PUT /api/marketing/campaigns/:id
// @access  Private/Admin
exports.updateCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const campaign = await prisma.marketingCampaign.update({
        where: { id: parseInt(id) },
        data: req.body
    });
    return success(res, 'Campaign updated successfully', { campaign });
});

// @desc    Delete campaign (Admin)
// @route   DELETE /api/marketing/campaigns/:id
// @access  Private/Admin
exports.deleteCampaign = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.marketingCampaign.delete({ where: { id: parseInt(id) } });
    return success(res, 'Campaign deleted successfully');
});
