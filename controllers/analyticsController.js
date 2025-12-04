const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// ==================== ANALYTICS ====================

// @desc    Get sales analytics (Admin)
// @route   GET /api/analytics/sales
// @access  Private/Admin
exports.getSalesAnalytics = asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query; // week, month, year

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);

    const orders = await prisma.order.findMany({
        where: {
            created_at: { gte: startDate },
            payment_status: 'paid'
        },
        select: {
            created_at: true,
            total: true
        }
    });

    // Aggregate data (simplified)
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;

    return success(res, 'Sales analytics retrieved', {
        period,
        totalRevenue,
        totalOrders,
        dataPoints: orders // Frontend can aggregate by day/week
    });
});

// @desc    Get VTO analytics (Admin)
// @route   GET /api/analytics/vto
// @access  Private/Admin
exports.getVtoAnalytics = asyncHandler(async (req, res) => {
    const events = await prisma.analyticsEvent.findMany({
        where: { event_type: 'vto_used' },
        orderBy: { created_at: 'desc' },
        take: 100
    });

    const totalUsage = await prisma.analyticsEvent.count({
        where: { event_type: 'vto_used' }
    });

    return success(res, 'VTO analytics retrieved', {
        totalUsage,
        recentEvents: events
    });
});

// @desc    Get conversion rates (Admin)
// @route   GET /api/analytics/conversion
// @access  Private/Admin
exports.getConversionRates = asyncHandler(async (req, res) => {
    // Simplified conversion rate: Orders / Unique Sessions (if tracked)
    // For now, let's just return order counts vs cart creations
    const [totalOrders, totalCarts] = await Promise.all([
        prisma.order.count(),
        prisma.cart.count()
    ]);

    const conversionRate = totalCarts > 0 ? (totalOrders / totalCarts) * 100 : 0;

    return success(res, 'Conversion rates retrieved', {
        totalOrders,
        totalCarts,
        conversionRate: parseFloat(conversionRate.toFixed(2))
    });
});

// ==================== LOGS ====================

// @desc    Get admin activity logs (Admin)
// @route   GET /api/analytics/logs/admin
// @access  Private/Admin
exports.getAdminLogs = asyncHandler(async (req, res) => {
    const logs = await prisma.adminActivityLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 100,
        include: {
            admin: {
                select: {
                    first_name: true,
                    last_name: true,
                    email: true
                }
            }
        }
    });
    return success(res, 'Admin logs retrieved', { logs });
});

// @desc    Get API error logs (Admin)
// @route   GET /api/analytics/logs/errors
// @access  Private/Admin
exports.getApiErrors = asyncHandler(async (req, res) => {
    const logs = await prisma.apiErrorLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 100
    });
    return success(res, 'API error logs retrieved', { logs });
});
