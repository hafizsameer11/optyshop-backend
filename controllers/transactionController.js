const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// Helper function to generate transaction number
const generateTransactionNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN-${timestamp}-${random}`;
};

// Helper function to format transaction
const formatTransaction = (transaction) => {
  let metadata = null;
  let gatewayResponse = null;

  try {
    if (transaction.metadata) {
      metadata = typeof transaction.metadata === 'string' 
        ? JSON.parse(transaction.metadata) 
        : transaction.metadata;
    }
  } catch (e) {
    metadata = transaction.metadata;
  }

  try {
    if (transaction.gateway_response) {
      gatewayResponse = typeof transaction.gateway_response === 'string' 
        ? JSON.parse(transaction.gateway_response) 
        : transaction.gateway_response;
    }
  } catch (e) {
    gatewayResponse = transaction.gateway_response;
  }

  return {
    id: transaction.id,
    transactionNumber: transaction.transaction_number,
    orderId: transaction.order_id,
    userId: transaction.user_id,
    type: transaction.type,
    status: transaction.status,
    paymentMethod: transaction.payment_method,
    amount: parseFloat(transaction.amount),
    currency: transaction.currency,
    gatewayTransactionId: transaction.gateway_transaction_id,
    gatewayResponse: gatewayResponse,
    gatewayFee: transaction.gateway_fee ? parseFloat(transaction.gateway_fee) : null,
    netAmount: transaction.net_amount ? parseFloat(transaction.net_amount) : null,
    description: transaction.description,
    metadata: metadata,
    processedAt: transaction.processed_at,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at
  };
};

// ==================== CUSTOMER TRANSACTIONS ====================

// @desc    Get user's transactions
// @route   GET /api/transactions
// @access  Private
exports.getUserTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, type, orderId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    user_id: req.user.id
  };

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (orderId) {
    where.order_id = parseInt(orderId);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            total: true
          }
        }
      }
    }),
    prisma.transaction.count({ where })
  ]);

  return success(res, 'Transactions retrieved successfully', {
    transactions: transactions.map(formatTransaction),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    },
    include: {
      order: {
        select: {
          id: true,
          order_number: true,
          status: true,
          payment_status: true,
          total: true
        }
      }
    }
  });

  if (!transaction) {
    return error(res, 'Transaction not found', 404);
  }

  return success(res, 'Transaction retrieved successfully', {
    transaction: formatTransaction(transaction)
  });
});

// ==================== ADMIN TRANSACTIONS ====================

// @desc    Get all transactions (Admin)
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, type, paymentMethod, userId, orderId, startDate, endDate } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (paymentMethod) {
    where.payment_method = paymentMethod;
  }

  if (userId) {
    where.user_id = parseInt(userId);
  }

  if (orderId) {
    where.order_id = parseInt(orderId);
  }

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at.gte = new Date(startDate);
    }
    if (endDate) {
      where.created_at.lte = new Date(endDate);
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            total: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    }),
    prisma.transaction.count({ where })
  ]);

  return success(res, 'Transactions retrieved successfully', {
    transactions: transactions.map(formatTransaction),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single transaction (Admin)
// @route   GET /api/admin/transactions/:id
// @access  Private/Admin
exports.getTransactionAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(id) },
    include: {
      order: {
        include: {
          items: {
            select: {
              id: true,
              product_name: true,
              quantity: true,
              unit_price: true
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true
        }
      }
    }
  });

  if (!transaction) {
    return error(res, 'Transaction not found', 404);
  }

  return success(res, 'Transaction retrieved successfully', {
    transaction: formatTransaction(transaction)
  });
});

// @desc    Create transaction (Admin)
// @route   POST /api/admin/transactions
// @access  Private/Admin
exports.createTransaction = asyncHandler(async (req, res) => {
  const {
    order_id,
    user_id,
    type = 'payment',
    status = 'pending',
    payment_method,
    amount,
    currency = 'USD',
    gateway_transaction_id,
    gateway_response,
    gateway_fee,
    description,
    metadata
  } = req.body;

  // Validate required fields
  if (!order_id || !user_id || !payment_method || !amount) {
    return error(res, 'Missing required fields: order_id, user_id, payment_method, amount', 400);
  }

  // Verify order exists
  const order = await prisma.order.findUnique({
    where: { id: parseInt(order_id) },
    select: { id: true, user_id: true, total: true }
  });

  if (!order) {
    return error(res, 'Order not found', 404);
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: parseInt(user_id) },
    select: { id: true }
  });

  if (!user) {
    return error(res, 'User not found', 404);
  }

  // Calculate net amount if gateway fee is provided
  let netAmount = null;
  if (gateway_fee !== undefined && gateway_fee !== null) {
    netAmount = parseFloat(amount) - parseFloat(gateway_fee);
  }

  const transaction = await prisma.transaction.create({
    data: {
      transaction_number: generateTransactionNumber(),
      order_id: parseInt(order_id),
      user_id: parseInt(user_id),
      type,
      status,
      payment_method,
      amount: parseFloat(amount),
      currency,
      gateway_transaction_id: gateway_transaction_id || null,
      gateway_response: gateway_response ? (typeof gateway_response === 'string' ? gateway_response : JSON.stringify(gateway_response)) : null,
      gateway_fee: gateway_fee ? parseFloat(gateway_fee) : null,
      net_amount: netAmount,
      description: description || null,
      metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      processed_at: status === 'completed' ? new Date() : null
    }
  });

  // Update order payment status if transaction is completed
  if (status === 'completed' && type === 'payment') {
    await prisma.order.update({
      where: { id: parseInt(order_id) },
      data: {
        payment_status: 'paid',
        payment_id: gateway_transaction_id || transaction.transaction_number
      }
    });
  }

  return success(res, 'Transaction created successfully', {
    transaction: formatTransaction(transaction)
  }, 201);
});

// @desc    Update transaction status (Admin)
// @route   PUT /api/admin/transactions/:id/status
// @access  Private/Admin
exports.updateTransactionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, gateway_response, metadata } = req.body;

  if (!status) {
    return error(res, 'Status is required', 400);
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(id) },
    include: {
      order: {
        select: {
          id: true,
          payment_status: true
        }
      }
    }
  });

  if (!transaction) {
    return error(res, 'Transaction not found', 404);
  }

  const updateData = {
    status,
    processed_at: status === 'completed' ? new Date() : transaction.processed_at
  };

  if (gateway_response) {
    updateData.gateway_response = typeof gateway_response === 'string' 
      ? gateway_response 
      : JSON.stringify(gateway_response);
  }

  if (metadata) {
    updateData.metadata = typeof metadata === 'string' 
      ? metadata 
      : JSON.stringify(metadata);
  }

  const updatedTransaction = await prisma.transaction.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  // Update order payment status if transaction is completed
  if (status === 'completed' && transaction.type === 'payment') {
    await prisma.order.update({
      where: { id: transaction.order_id },
      data: {
        payment_status: 'paid',
        payment_id: transaction.gateway_transaction_id || transaction.transaction_number
      }
    });
  } else if (status === 'refunded' && transaction.type === 'refund') {
    await prisma.order.update({
      where: { id: transaction.order_id },
      data: {
        payment_status: 'refunded'
      }
    });
  }

  return success(res, 'Transaction status updated successfully', {
    transaction: formatTransaction(updatedTransaction)
  });
});

// @desc    Get transaction statistics (Admin)
// @route   GET /api/admin/transactions/stats
// @access  Private/Admin
exports.getTransactionStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at.gte = new Date(startDate);
    }
    if (endDate) {
      where.created_at.lte = new Date(endDate);
    }
  }

  const [
    totalTransactions,
    completedTransactions,
    failedTransactions,
    totalAmount,
    totalRevenue,
    transactionsByMethod,
    transactionsByStatus
  ] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.count({ where: { ...where, status: 'completed' } }),
    prisma.transaction.count({ where: { ...where, status: 'failed' } }),
    prisma.transaction.aggregate({
      where: { ...where, type: 'payment' },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { ...where, status: 'completed', type: 'payment' },
      _sum: { net_amount: true }
    }),
    prisma.transaction.groupBy({
      by: ['payment_method'],
      where,
      _count: true,
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ['status'],
      where,
      _count: true
    })
  ]);

  return success(res, 'Transaction statistics retrieved successfully', {
    stats: {
      totalTransactions,
      completedTransactions,
      failedTransactions,
      pendingTransactions: totalTransactions - completedTransactions - failedTransactions,
      totalAmount: totalAmount._sum.amount ? parseFloat(totalAmount._sum.amount) : 0,
      totalRevenue: totalRevenue._sum.net_amount ? parseFloat(totalRevenue._sum.net_amount) : 0,
      transactionsByMethod: transactionsByMethod.map(m => ({
        method: m.payment_method,
        count: m._count,
        totalAmount: m._sum.amount ? parseFloat(m._sum.amount) : 0
      })),
      transactionsByStatus: transactionsByStatus.map(s => ({
        status: s.status,
        count: s._count
      }))
    }
  });
});

