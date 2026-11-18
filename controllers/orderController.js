const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');
const { sendOrderStatusEmailIT, sendOrderCancellationEmailIT, sendOrderRefundEmailIT } = require('../utils/email');


function parseOrderCustomization(raw) {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
}

function normColorKey(v) {
  const s = String(v ?? '').trim().toLowerCase();
  return s.startsWith('#') ? s.slice(1) : s;
}

function parseColorImages(product) {
  let colorImages = product && product.color_images;
  if (typeof colorImages === 'string') {
    try { colorImages = JSON.parse(colorImages); } catch (e) { colorImages = []; }
  }
  if (!Array.isArray(colorImages)) colorImages = colorImages ? [colorImages] : [];
  return colorImages;
}

function findColorVariant(product, customization) {
  const custom = parseOrderCustomization(customization) || customization || null;
  if (!custom) return null;
  const selectedKey = normColorKey(custom.selected_color || custom.hex_code || custom.color_name || custom.color_value);
  if (!selectedKey) return null;
  const colorImages = parseColorImages(product);
  return colorImages.find((c) => {
    const hex = c.hexCode || c.hex_code || null;
    return (hex && normColorKey(hex) === selectedKey) ||
      (c.color && normColorKey(c.color) === selectedKey) ||
      (c.name && normColorKey(c.name) === selectedKey) ||
      (c.value && normColorKey(c.value) === selectedKey) ||
      (c.display_name && normColorKey(c.display_name) === selectedKey);
  }) || null;
}

/** Color/variant stock wins over product-level stock (live color_images first). */
function resolveOrderItemAvailableStock(product, customization) {
  const custom = parseOrderCustomization(customization) || customization || null;
  const match = findColorVariant(product, custom);
  if (match) {
    if (match.stock_status === 'out_of_stock') return 0;
    if (match.stock_quantity != null && match.stock_quantity !== '') {
      const n = Number(match.stock_quantity);
      if (!Number.isNaN(n)) return n;
    }
  }
  if (custom && custom.color_stock_quantity != null && custom.color_stock_quantity !== '') {
    const n = Number(custom.color_stock_quantity);
    if (!Number.isNaN(n)) return n;
  }
  if (custom && custom.stock_quantity != null && custom.stock_quantity !== '') {
    const n = Number(custom.stock_quantity);
    if (!Number.isNaN(n)) return n;
  }
  if (product && product.stock_quantity != null && product.stock_quantity !== '') {
    const n = Number(product.stock_quantity);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

async function decrementProductStockForOrderItem(productId, quantity, customization) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const match = findColorVariant(product, customization);
  if (match && (match.stock_quantity != null || match.stock_status)) {
    const colorImages = parseColorImages(product);
    const selectedKey = normColorKey(
      (parseOrderCustomization(customization) || {}).selected_color ||
      (parseOrderCustomization(customization) || {}).hex_code ||
      (parseOrderCustomization(customization) || {}).color_name
    );
    const nextColors = colorImages.map((c) => {
      const hex = c.hexCode || c.hex_code || null;
      const isMatch =
        (hex && normColorKey(hex) === selectedKey) ||
        (c.color && normColorKey(c.color) === selectedKey) ||
        (c.name && normColorKey(c.name) === selectedKey) ||
        (c.value && normColorKey(c.value) === selectedKey) ||
        (c.display_name && normColorKey(c.display_name) === selectedKey);
      if (!isMatch) return c;
      const current = c.stock_quantity != null ? Number(c.stock_quantity) : null;
      if (current == null || Number.isNaN(current)) return c;
      const left = Math.max(0, current - Number(quantity));
      return {
        ...c,
        stock_quantity: left,
        stock_status: left <= 0 ? 'out_of_stock' : (c.stock_status || 'in_stock'),
      };
    });
    await prisma.product.update({
      where: { id: productId },
      data: { color_images: JSON.stringify(nextColors) },
    });
    return;
  }

  const current = Number(product.stock_quantity || 0);
  const left = Math.max(0, current - Number(quantity));
  await prisma.product.update({
    where: { id: productId },
    data: {
      stock_quantity: left,
      ...(left <= 0 ? { stock_status: 'out_of_stock' } : {}),
    },
  });
}


// Helper function to format contact lens details for display
const formatContactLensDetails = (item) => {
  const hasContactLensData = item.contact_lens_right_qty !== null || 
                              item.contact_lens_left_qty !== null ||
                              item.contact_lens_right_power !== null ||
                              item.contact_lens_left_power !== null;
  
  if (!hasContactLensData) return null;

  const details = {
    right_eye: null,
    left_eye: null,
    astigmatism: null,
    color: null,
    color_value: null
  };

  // Right eye details
  if (item.contact_lens_right_qty !== null || item.contact_lens_right_power !== null) {
    details.right_eye = {
      quantity: item.contact_lens_right_qty,
      base_curve: item.contact_lens_right_base_curve,
      diameter: item.contact_lens_right_diameter,
      power: item.contact_lens_right_power
    };
  }

  // Left eye details
  if (item.contact_lens_left_qty !== null || item.contact_lens_left_power !== null) {
    details.left_eye = {
      quantity: item.contact_lens_left_qty,
      base_curve: item.contact_lens_left_base_curve,
      diameter: item.contact_lens_left_diameter,
      power: item.contact_lens_left_power
    };
  }

  // Astigmatism + optional color variant (from customization)
  if (item.customization) {
    try {
      const customization = typeof item.customization === 'string' 
        ? JSON.parse(item.customization) 
        : item.customization;
    
      if (customization && (customization.left_cylinder || customization.right_cylinder)) {
        details.astigmatism = {
          left_cylinder: customization.left_cylinder,
          right_cylinder: customization.right_cylinder,
          left_axis: customization.left_axis,
          right_axis: customization.right_axis
        };
      }

      if (customization && (customization.selected_color || customization.color_display_name)) {
        details.color = customization.color_display_name || customization.selected_color || null;
        details.color_value = customization.selected_color || null;
      }
    } catch (_e) {
      // ignore invalid customization JSON
    }
  }

  return details;
};

// Helper function to parse JSON strings in order items
const parseOrderItems = (items) => {
  if (!items) return items;
  return items.map(item => {
    const parsedItem = {
      ...item,
      lens_coatings: item.lens_coatings ? (typeof item.lens_coatings === 'string' ? JSON.parse(item.lens_coatings) : item.lens_coatings) : null,
      customization: item.customization ? (typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization) : null,
      prescription_data: item.prescription_data ? (typeof item.prescription_data === 'string' ? JSON.parse(item.prescription_data) : item.prescription_data) : null,
      treatment_ids: item.treatment_ids ? (typeof item.treatment_ids === 'string' ? JSON.parse(item.treatment_ids) : item.treatment_ids) : null
    };
    
    // Add formatted contact lens details
    parsedItem.contact_lens_details = formatContactLensDetails(item);
    
    return parsedItem;
  });
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const parseJsonField = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getAddressEmail = (addressField) => {
  const addr = parseJsonField(addressField);
  return addr?.email ? normalizeEmail(addr.email) : '';
};

const sanitizeTrackedOrder = (order) => {
  const shipping = parseJsonField(order.shipping_address);
  const billing = parseJsonField(order.billing_address);

  return {
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    created_at: order.created_at,
    updated_at: order.updated_at,
    shipped_at: order.shipped_at,
    delivered_at: order.delivered_at,
    shipping_address: shipping
      ? {
          first_name: shipping.first_name,
          last_name: shipping.last_name,
          city: shipping.city,
          zip_code: shipping.zip_code,
          country: shipping.country,
        }
      : null,
    billing_address: billing
      ? {
          first_name: billing.first_name,
          last_name: billing.last_name,
          city: billing.city,
          zip_code: billing.zip_code,
          country: billing.country,
        }
      : null,
    items: parseOrderItems(order.items).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            images: item.product.images,
          }
        : null,
      contact_lens_details: item.contact_lens_details || null,
    })),
  };
};

// @desc    Track order by order number + email (public)
// @route   POST /api/orders/track
// @access  Public
exports.trackOrder = asyncHandler(async (req, res) => {
  const orderNumber = String(req.body.order_number || req.query.order_number || '').trim();
  const email = normalizeEmail(req.body.email || req.query.email);

  if (!orderNumber) {
    return error(res, 'Order number is required', 400);
  }
  if (!email) {
    return error(res, 'Email is required', 400);
  }

  const normalizedOrderNumber = orderNumber.replace(/\s+/g, '').toUpperCase();

  let order = await prisma.order.findFirst({
    where: {
      order_number: normalizedOrderNumber,
    },
    include: {
      user: {
        select: {
          email: true,
          first_name: true,
          last_name: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
      },
    },
  });

  // Fallback: case-insensitive / partial match on order_number
  if (!order) {
    const candidates = await prisma.order.findMany({
      where: {
        order_number: { contains: normalizedOrderNumber.replace(/^ORD-/, '') },
      },
      take: 5,
      include: {
        user: { select: { email: true, first_name: true, last_name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: true } },
          },
        },
      },
    });
    order =
      candidates.find(
        (o) => String(o.order_number || '').replace(/\s+/g, '').toUpperCase() === normalizedOrderNumber
      ) || null;
  }

  if (!order) {
    return error(res, 'Ordine non trovato. Controlla il numero ordine e l\'email.', 404);
  }

  const shippingEmail = getAddressEmail(order.shipping_address);
  const billingEmail = getAddressEmail(order.billing_address);
  const userEmail = normalizeEmail(order.user?.email);

  if (email !== shippingEmail && email !== billingEmail && email !== userEmail) {
    return error(res, 'Ordine non trovato. Controlla il numero ordine e l\'email.', 404);
  }

  return success(res, 'Order found', {
    order: sanitizeTrackedOrder(order),
  });
});

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
    notes,
    coupon_code,
    shipping_method_id,
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

    const availableStock = resolveOrderItemAvailableStock(product, item.customization);
    if (availableStock != null && Number(availableStock) < Number(item.quantity)) {
      return error(res, `Insufficient stock for product ${product.name}`, 400);
    }
    if (availableStock == null && product.stock_quantity != null && Number(product.stock_quantity) < Number(item.quantity)) {
      return error(res, `Insufficient stock for product ${product.name}`, 400);
    }
    if (product.stock_status === 'out_of_stock' && availableStock == null) {
      return error(res, `Insufficient stock for product ${product.name}`, 400);
    }

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

    // Handle prescription_data
    let prescriptionDataValue = null;
    if (item.prescription_data) {
      prescriptionDataValue = typeof item.prescription_data === 'string' 
        ? item.prescription_data 
        : JSON.stringify(item.prescription_data);
    }

    // Handle treatment_ids
    let treatmentIdsValue = null;
    if (item.treatment_ids) {
      treatmentIdsValue = Array.isArray(item.treatment_ids) 
        ? JSON.stringify(item.treatment_ids) 
        : (typeof item.treatment_ids === 'string' ? item.treatment_ids : JSON.stringify([item.treatment_ids]));
    }

    // Use unit_price from item if available (from cart), otherwise use product price
    const unitPrice = item.unit_price ? parseFloat(item.unit_price) : parseFloat(product.price);
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product_id: item.product_id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: item.quantity,
      unit_price: unitPrice.toFixed(2),
      total_price: itemTotal.toFixed(2),
      lens_index: item.lens_index || null,
      lens_coatings: lensCoatingsValue,
      frame_size_id: item.frame_size_id || null,
      customization: customizationValue,
      prescription_id: item.prescription_id || null,
      // Lens configuration fields
      lens_type: item.lens_type || null,
      prescription_data: prescriptionDataValue,
      progressive_variant_id: item.progressive_variant_id ? parseInt(item.progressive_variant_id) : null,
      lens_thickness_material_id: item.lens_thickness_material_id ? parseInt(item.lens_thickness_material_id) : null,
      lens_thickness_option_id: item.lens_thickness_option_id ? parseInt(item.lens_thickness_option_id) : null,
      treatment_ids: treatmentIdsValue,
      photochromic_color_id: item.photochromic_color_id ? parseInt(item.photochromic_color_id) : null,
      prescription_sun_color_id: item.prescription_sun_color_id ? parseInt(item.prescription_sun_color_id) : null,
      // Contact Lens specific fields
      contact_lens_right_qty: item.contact_lens_right_qty || null,
      contact_lens_right_base_curve: item.contact_lens_right_base_curve || null,
      contact_lens_right_diameter: item.contact_lens_right_diameter || null,
      contact_lens_right_power: item.contact_lens_right_power || null,
      contact_lens_left_qty: item.contact_lens_left_qty || null,
      contact_lens_left_base_curve: item.contact_lens_left_base_curve || null,
      contact_lens_left_diameter: item.contact_lens_left_diameter || null,
      contact_lens_left_power: item.contact_lens_left_power || null
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

  // Calculate tax / shipping / discount
  const tax = subtotal * 0.1;

  let shipping = 0;
  let shippingMethodLabel = null;
  if (shipping_method_id) {
    const methodId = parseInt(shipping_method_id, 10);
    if (!Number.isNaN(methodId)) {
      const method = await prisma.shippingMethod.findFirst({
        where: { id: methodId, is_active: true },
      });
      if (method) {
        shipping = parseFloat(method.price) || 0;
        shippingMethodLabel = method.name;
      }
    }
  }

  let discount = 0;
  let appliedCouponCode = null;
  let freeShippingCoupon = false;
  if (coupon_code && String(coupon_code).trim()) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: String(coupon_code).toUpperCase().trim() },
    });
    if (coupon && coupon.is_active) {
      const now = new Date();
      const startsOk = !coupon.starts_at || new Date(coupon.starts_at) <= now;
      const endsOk = !coupon.ends_at || new Date(coupon.ends_at) >= now;
      const minOk =
        !coupon.min_order_amount || subtotal >= parseFloat(coupon.min_order_amount);
      if (startsOk && endsOk && minOk) {
        appliedCouponCode = coupon.code;
        if (coupon.discount_type === 'percentage') {
          discount = (subtotal * parseFloat(coupon.discount_value)) / 100;
          if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) {
            discount = parseFloat(coupon.max_discount);
          }
        } else if (coupon.discount_type === 'fixed_amount') {
          discount = Math.min(parseFloat(coupon.discount_value), subtotal);
        } else if (coupon.discount_type === 'free_shipping') {
          freeShippingCoupon = true;
        }
      }
    }
  }

  if (freeShippingCoupon) {
    shipping = 0;
  }

  if (discount > subtotal) discount = subtotal;
  const total = Math.max(0, subtotal + tax + shipping - discount);

  // Allow stripe / paypal / cod (dummy checkout)
  let validPaymentMethod = 'cod';
  if (payment_method) {
    const paymentMethodMap = {
      card: 'stripe',
      credit_card: 'stripe',
      debit_card: 'stripe',
      stripe: 'stripe',
      paypal: 'paypal',
      cod: 'cod',
      cash: 'cod',
      dummy: 'cod',
    };
    validPaymentMethod = paymentMethodMap[String(payment_method).toLowerCase()] || 'cod';
  }

  // Keep notes as customer/admin text only (do not inject coupon/shipping labels here)
  const orderNotes = notes ? String(notes) : null;
  // appliedCouponCode / shippingMethodLabel are still used for totals; not stuffed into notes.

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

  // COD: order is accepted, payment collected on delivery (stays pending).
  // Stripe/PayPal: stay pending until webhook / payment page marks paid.
  const initialOrderStatus = validPaymentMethod === 'cod' ? 'confirmed' : 'pending';
  const initialPaymentStatus = 'pending';

  // Create order with items
  const order = await prisma.order.create({
    data: {
      order_number: `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
      user_id: req.user.id,
      prescription_id: validPrescriptionId, // Will be null if not provided or invalid
      status: initialOrderStatus,
      payment_status: initialPaymentStatus,
      payment_method: validPaymentMethod,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      shipping_address: shippingAddressString,
      billing_address: billingAddressString,
      notes: orderNotes,
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

  // Update stock (per-color when a colour was selected)
  for (const item of items) {
    await decrementProductStockForOrderItem(item.product_id, item.quantity, item.customization);
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

  const previousStatus = existingOrder.status;

  const order = await prisma.order.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      user: {
        select: { id: true, email: true, first_name: true, last_name: true },
      },
      items: true,
    },
  });

  // Notify customer in Italian (best-effort)
  try {
    if (previousStatus !== order.status) {
      if (order.status === 'cancelled') {
        await sendOrderCancellationEmailIT(order);
      } else if (order.status === 'refunded') {
        await sendOrderRefundEmailIT(order);
      } else {
        await sendOrderStatusEmailIT(order, previousStatus);
      }
    }
  } catch (emailErr) {
    console.error('Order status email failed:', emailErr.message || emailErr);
  }

  return success(res, 'Stato ordine aggiornato', { order });
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

  try {
    await sendOrderCancellationEmailIT(updatedOrder);
  } catch (e) {
    console.error('Cancel email failed:', e.message || e);
  }

  return success(res, 'Ordine annullato con successo', { order: updatedOrder });
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

  try {
    await sendOrderRefundEmailIT(updatedOrder, amount, reason);
  } catch (e) {
    console.error('Refund email failed:', e.message || e);
  }

  return success(res, 'Rimborso elaborato con successo', { order: updatedOrder });
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
          product: true,
          prescription: true,
          progressiveVariant: true,
          lensThicknessMaterial: true,
          lensThicknessOption: true,
          photochromicColor: true,
          prescriptionSunColor: true
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