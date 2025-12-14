const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

// Helper function to parse JSON strings in order items
const parseOrderItems = (items) => {
  if (!items) return items;
  return items.map(item => ({
    ...item,
    lens_coatings: item.lens_coatings ? JSON.parse(item.lens_coatings) : null,
    customization: item.customization ? (typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization) : null
  }));
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    prescription_id,
    shipping_address,
    billing_address,
    payment_method,
    notes
  } = req.body;

  if (!items || items.length === 0) {
    return error(res, 'Order items are required', 400);
  }

  if (!shipping_address) {
    return error(res, 'Shipping address is required', 400);
  }

  // Calculate totals
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.product_id } });
    if (!product) {
      return error(res, `Product ${item.product_id} not found`, 404);
    }

    if (product.stock_quantity < item.quantity) {
      return error(res, `Insufficient stock for product ${product.name}`, 400);
    }

    const itemTotal = parseFloat(product.price) * item.quantity;
    subtotal += itemTotal;

    // Convert lens_coatings and customization arrays to JSON strings if needed
    let lensCoatingsValue = null;
    if (item.lens_coatings) {
      lensCoatingsValue = Array.isArray(item.lens_coatings) 
        ? JSON.stringify(item.lens_coatings) 
        : JSON.stringify([item.lens_coatings]);
    }

    let customizationValue = null;
    if (item.customization) {
      customizationValue = typeof item.customization === 'string' 
        ? item.customization 
        : JSON.stringify(item.customization);
    }

    orderItems.push({
      product_id: item.product_id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: item.quantity,
      unit_price: product.price,
      total_price: itemTotal.toFixed(2),
      lens_index: item.lens_index || null,
      lens_coatings: lensCoatingsValue,
      frame_size_id: item.frame_size_id || null,
      customization: customizationValue
    });
  }

  // Validate prescription_id if provided
  let validPrescriptionId = null;
  if (prescription_id !== null && prescription_id !== undefined && prescription_id !== '' && prescription_id !== 'null') {
    const prescriptionIdInt = parseInt(prescription_id);
    
    if (isNaN(prescriptionIdInt) || prescriptionIdInt <= 0) {
      return error(res, `Invalid prescription ID: ${prescription_id}`, 400);
    }
    
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionIdInt },
      select: { id: true, user_id: true }
    });
    
    if (!prescription) {
      return error(res, `Prescription with ID ${prescription_id} not found`, 404);
    }
    
    // Optional: Verify prescription belongs to the current user
    if (prescription.user_id !== req.user.id) {
      return error(res, 'Prescription does not belong to the current user', 403);
    }
    
    validPrescriptionId = prescriptionIdInt;
  }

  // Calculate tax (example: 10%)
  const tax = subtotal * 0.1;
  const shipping = 0; // Free shipping or calculate based on address
  const discount = 0; // Apply discount codes here
  const total = subtotal + tax + shipping - discount;

  // Map and validate payment_method
  let validPaymentMethod = null;
  if (payment_method) {
    const paymentMethodMap = {
      'card': 'stripe',
      'credit_card': 'stripe',
      'debit_card': 'stripe',
      'stripe': 'stripe',
      'paypal': 'paypal',
      'cod': 'cod',
      'cash_on_delivery': 'cod',
      'cash': 'cod'
    };
    
    const mappedMethod = paymentMethodMap[payment_method.toLowerCase()] || payment_method.toLowerCase();
    const validMethods = ['stripe', 'paypal', 'cod'];
    
    if (validMethods.includes(mappedMethod)) {
      validPaymentMethod = mappedMethod;
    }
  }

  // Convert addresses to JSON strings - Prisma expects String, not Object
  if (!shipping_address) {
    return error(res, 'Shipping address is required', 400);
  }
  
  // Always convert to JSON string if it's an object (check for plain objects, not arrays or null)
  let shippingAddressString;
  if (shipping_address && typeof shipping_address === 'object' && !Array.isArray(shipping_address) && shipping_address.constructor === Object) {
    shippingAddressString = JSON.stringify(shipping_address);
  } else if (typeof shipping_address === 'string') {
    shippingAddressString = shipping_address;
  } else {
    shippingAddressString = JSON.stringify(shipping_address);
  }

  // Handle billing address - use shipping address as fallback if not provided
  const billingAddressToUse = billing_address || shipping_address;
  let billingAddressString;
  if (billingAddressToUse && typeof billingAddressToUse === 'object' && !Array.isArray(billingAddressToUse) && billingAddressToUse.constructor === Object) {
    billingAddressString = JSON.stringify(billingAddressToUse);
  } else if (typeof billingAddressToUse === 'string') {
    billingAddressString = billingAddressToUse;
  } else {
    billingAddressString = JSON.stringify(billingAddressToUse);
  }
  
  // Ensure we have strings, not objects
  if (typeof shippingAddressString !== 'string') {
    shippingAddressString = JSON.stringify(shippingAddressString);
  }
  if (typeof billingAddressString !== 'string') {
    billingAddressString = JSON.stringify(billingAddressString);
  }

  // Create order with items
  const order = await prisma.order.create({
    data: {
      order_number: `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
      user_id: req.user.id,
      prescription_id: validPrescriptionId, // Will be null if not provided or invalid
      status: 'pending',
      payment_status: 'pending',
      payment_method: validPaymentMethod,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      shipping_address: shippingAddressString,
      billing_address: billingAddressString,
      notes: notes || null,
      items: {
        create: orderItems
      }
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true
            }
          }
        }
      },
      prescription: true
    }
  });

  // Update product stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.product_id },
      data: {
        stock_quantity: { decrement: item.quantity },
        stock_status: await (async () => {
          const product = await prisma.product.findUnique({ where: { id: item.product_id } });
          return product.stock_quantity <= item.quantity ? 'out_of_stock' : undefined;
        })()
      }
    });
  }

  // Clear cart
  const cart = await prisma.cart.findUnique({ where: { user_id: req.user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
  }

  // Parse JSON strings in order items
  const parsedOrder = {
    ...order,
    items: parseOrderItems(order.items)
  };

  return success(res, 'Order created successfully', { order: parsedOrder }, 201);
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const where = { user_id: req.user.id };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true
              }
            }
          }
        }
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { created_at: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  // Parse JSON strings in order items
  const parsedOrders = orders.map(order => ({
    ...order,
    items: parseOrderItems(order.items)
  }));

  return success(res, 'Orders retrieved successfully', {
    orders: parsedOrders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    },
    include: {
      items: {
        include: {
          product: true
        }
      },
      prescription: true
    }
  });

  if (!order) {
    return error(res, 'Order not found', 404);
  }

  // Parse JSON strings in order items
  const parsedOrder = {
    ...order,
    items: parseOrderItems(order.items)
  };

  return success(res, 'Order retrieved successfully', { order: parsedOrder });
});

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    return error(res, 'Invalid status', 400);
  }

  // Check if order exists
  const existingOrder = await prisma.order.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingOrder) {
    return error(res, 'Order not found', 404);
  }

  const updateData = { status };
  if (status === 'shipped') {
    updateData.shipped_at = new Date();
  }
  if (status === 'delivered') {
    updateData.delivered_at = new Date();
  }

  const order = await prisma.order.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Order status updated', { order });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    }
  });

  if (!order) {
    return error(res, 'Order not found', 404);
  }

  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    return error(res, 'Cannot cancel order in current status', 400);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(id) },
    data: { status: 'cancelled' }
  });

  // Restore stock
  const orderItems = await prisma.orderItem.findMany({ where: { order_id: parseInt(id) } });
  for (const item of orderItems) {
    await prisma.product.update({
      where: { id: item.product_id },
      data: {
        stock_quantity: { increment: item.quantity },
        stock_status: 'in_stock'
      }
    });
  }

  return success(res, 'Order cancelled successfully', { order: updatedOrder });
});

// @desc    Process refund (Admin)
// @route   POST /api/orders/:id/refund
// @access  Private/Admin
exports.processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
  if (!order) return error(res, 'Order not found', 404);

  // Placeholder for payment gateway refund logic (Stripe/PayPal)
  // await paymentGateway.refund(order.payment_id, amount);

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(id) },
    data: {
      payment_status: 'refunded',
      status: 'refunded',
      notes: order.notes ? `${order.notes}\nRefunded: ${amount} (${reason})` : `Refunded: ${amount} (${reason})`
    }
  });

  return success(res, 'Refund processed successfully', { order: updatedOrder });
});

// @desc    Assign technician (Admin)
// @route   PUT /api/orders/:id/assign-technician
// @access  Private/Admin
exports.assignTechnician = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { technician_name, technician_id } = req.body;

  const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
  if (!order) return error(res, 'Order not found', 404);

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(id) },
    data: {
      status: 'processing',
      notes: order.notes
        ? `${order.notes}\nAssigned to technician: ${technician_name} (ID: ${technician_id})`
        : `Assigned to technician: ${technician_name} (ID: ${technician_id})`
    }
  });

  return success(res, 'Technician assigned successfully', { order: updatedOrder });
});

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, payment_status } = req.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (payment_status) where.payment_status = payment_status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true
              }
            }
          }
        }
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { created_at: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  // Parse JSON strings in order items
  const parsedOrders = orders.map(order => ({
    ...order,
    items: parseOrderItems(order.items)
  }));

  return success(res, 'Orders retrieved successfully', {
    orders: parsedOrders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single order detail (Admin)
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
exports.getAdminOrderDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true
        }
      },
      items: {
        include: {
          product: true
        }
      },
      prescription: true
    }
  });

  if (!order) {
    return error(res, 'Order not found', 404);
  }

  // Parse JSON strings in order items
  const parsedOrder = {
    ...order,
    items: parseOrderItems(order.items)
  };

  return success(res, 'Order retrieved successfully', { order: parsedOrder });
});