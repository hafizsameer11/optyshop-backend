const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success } = require('../utils/response');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const formatLensType = (lensType) => {
  if (!lensType) return 'Unknown';
  return lensType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const buildMonthlyRevenue = (orders, startDate) => {
  const buckets = Array.from({ length: 12 }, (_, idx) => {
    const monthIndex = (startDate.getMonth() + idx) % 12;
    return { label: MONTHS[monthIndex], revenue: 0 };
  });

  orders.forEach((order) => {
    const diff = (order.created_at.getFullYear() - startDate.getFullYear()) * 12 +
      (order.created_at.getMonth() - startDate.getMonth());

    if (diff >= 0 && diff < 12) {
      buckets[diff].revenue += toNumber(order.total);
    }
  });

  return buckets;
};

const buildMeasurementTrend = (prescriptions, startDate) => {
  const buckets = Array.from({ length: 12 }, (_, idx) => {
    const monthIndex = (startDate.getMonth() + idx) % 12;
    return {
      label: MONTHS[monthIndex],
      pdValues: [],
      hpValues: []
    };
  });

  prescriptions.forEach((prescription) => {
    const diff = (prescription.created_at.getFullYear() - startDate.getFullYear()) * 12 +
      (prescription.created_at.getMonth() - startDate.getMonth());

    if (diff >= 0 && diff < 12) {
      if (prescription.pd_binocular !== null && prescription.pd_binocular !== undefined) {
        buckets[diff].pdValues.push(toNumber(prescription.pd_binocular));
      }

      const hpEntries = [];
      if (prescription.ph_od !== null && prescription.ph_od !== undefined) hpEntries.push(toNumber(prescription.ph_od));
      if (prescription.ph_os !== null && prescription.ph_os !== undefined) hpEntries.push(toNumber(prescription.ph_os));
      if (hpEntries.length) {
        const avgHpForRecord = hpEntries.reduce((sum, val) => sum + val, 0) / hpEntries.length;
        buckets[diff].hpValues.push(avgHpForRecord);
      }
    }
  });

  return buckets.map((bucket) => ({
    label: bucket.label,
    pd: bucket.pdValues.length
      ? parseFloat((bucket.pdValues.reduce((sum, val) => sum + val, 0) / bucket.pdValues.length).toFixed(2))
      : null,
    hp: bucket.hpValues.length
      ? parseFloat((bucket.hpValues.reduce((sum, val) => sum + val, 0) / bucket.hpValues.length).toFixed(2))
      : null
  }));
};

const buildOrdersOverview = (groupedStatuses) => {
  const statusMap = {
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0
  };

  groupedStatuses.forEach((item) => {
    const count = item._count.id || 0;
    switch (item.status) {
      case 'pending':
        statusMap.pending += count;
        break;
      case 'processing':
      case 'confirmed':
      case 'shipped':
        statusMap.processing += count;
        break;
      case 'delivered':
        statusMap.completed += count;
        break;
      case 'cancelled':
      case 'refunded':
        statusMap.cancelled += count;
        break;
      default:
        break;
    }
  });

  statusMap.total = statusMap.pending + statusMap.processing + statusMap.completed + statusMap.cancelled;
  return statusMap;
};

// @desc    Overview data for admin dashboard
// @route   GET /api/overview
// @access  Private/Admin
exports.getOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const lastYearStart = new Date(now);
  lastYearStart.setMonth(now.getMonth() - 11);
  lastYearStart.setDate(1);

  const [
    totalOrders,
    totalUsers,
    revenueAggregate,
    paidOrdersLastYear,
    prescriptionsAggregate,
    prescriptionsLastYear,
    ordersByStatus,
    lensTypeGroups,
    topSellingGroups,
    productBasics,
    latestOrders,
    pendingCustomizations
  ] = await Promise.all([
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { payment_status: 'paid' }
    }),
    prisma.order.findMany({
      where: {
        payment_status: 'paid',
        created_at: { gte: lastYearStart }
      },
      select: { total: true, created_at: true }
    }),
    prisma.prescription.aggregate({
      _avg: { pd_binocular: true, ph_od: true, ph_os: true }
    }),
    prisma.prescription.findMany({
      where: { created_at: { gte: lastYearStart } },
      select: {
        created_at: true,
        pd_binocular: true,
        ph_od: true,
        ph_os: true
      }
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.product.groupBy({
      by: ['lens_type'],
      where: { lens_type: { not: null } },
      _count: { id: true }
    }),
    prisma.orderItem.groupBy({
      by: ['product_id'],
      where: { order: { payment_status: 'paid' } },
      _sum: { total_price: true, quantity: true },
      orderBy: { _sum: { total_price: 'desc' } },
      take: 4
    }),
    prisma.product.findMany({
      select: { id: true, name: true, lens_type: true }
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      select: {
        order_number: true,
        total: true,
        status: true,
        created_at: true,
        user: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    }),
    prisma.orderItem.count({
      where: {
        customization: { not: null },
        order: { status: 'pending' }
      }
    })
  ]);

  const totalRevenue = revenueAggregate._sum.total ? toNumber(revenueAggregate._sum.total) : 0;
  const lensTypeDistribution = lensTypeGroups.map((item) => ({
    label: formatLensType(item.lens_type),
    value: item._count.id
  }));

  const lensTotal = lensTypeDistribution.reduce((sum, item) => sum + item.value, 0);
  const lensDistributionWithPercent = lensTotal > 0
    ? lensTypeDistribution.map((item) => ({
        ...item,
        percent: parseFloat(((item.value / lensTotal) * 100).toFixed(2))
      }))
    : [];

  const topLensType = lensDistributionWithPercent.length
    ? lensDistributionWithPercent.slice().sort((a, b) => b.value - a.value)[0].label
    : null;

  const averagePd = prescriptionsAggregate._avg.pd_binocular !== null
    ? parseFloat(prescriptionsAggregate._avg.pd_binocular.toFixed(2))
    : null;

  const hpValues = [];
  if (prescriptionsAggregate._avg.ph_od !== null) hpValues.push(parseFloat(prescriptionsAggregate._avg.ph_od));
  if (prescriptionsAggregate._avg.ph_os !== null) hpValues.push(parseFloat(prescriptionsAggregate._avg.ph_os));
  const averageHp = hpValues.length
    ? parseFloat((hpValues.reduce((sum, val) => sum + val, 0) / hpValues.length).toFixed(2))
    : null;

  const monthlyRevenue = buildMonthlyRevenue(paidOrdersLastYear, lastYearStart);
  const ordersOverview = buildOrdersOverview(ordersByStatus);

  const productMap = productBasics.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

  const topSellingFrames = topSellingGroups.length
    ? topSellingGroups.map((group, idx) => ({
        rank: idx + 1,
        product_id: group.product_id,
        name: productMap[group.product_id]?.name || `Frame #${group.product_id}`,
        lens_type: productMap[group.product_id]?.lens_type || null,
        revenue: toNumber(group._sum.total_price),
        quantity: group._sum.quantity || 0
      }))
    : [];

  const normalizedOrders = latestOrders.length
    ? latestOrders.map((order) => ({
        orderId: order.order_number,
        customer: [order.user?.first_name, order.user?.last_name].filter(Boolean).join(' ') || 'Customer',
        amount: toNumber(order.total),
        status: order.status,
        date: order.created_at
      }))
    : [];

  const measurementTrend = (averagePd === null && averageHp === null)
    ? []
    : buildMeasurementTrend(prescriptionsLastYear, lastYearStart);

  return success(res, 'Overview data retrieved successfully', {
    summary: {
      totalOrders,
      totalRevenue,
      averagePd,
      averageHp,
      topLensType,
      totalUsers,
      pendingCustomizations
    },
    revenueAnalytics: {
      period: 'last_12_months',
      trend: monthlyRevenue
    },
    ordersOverview,
    lensTypeDistribution: lensDistributionWithPercent,
    measurementAnalytics: {
      averagePd,
      averageHp,
      trend: measurementTrend
    },
    topSellingFrames,
    latestOrders: normalizedOrders
  });
});