const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { sendCartNotificationToAdmin } = require('../utils/email');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await prisma.cart.findUnique({
    where: { user_id: req.user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              images: true,
              stock_quantity: true,
              stock_status: true
            }
          },
          progressiveVariant: true,
          lensThicknessMaterial: true,
          lensThicknessOption: true,
          photochromicColor: true,
          prescriptionSunColor: true
        }
      }
    }
  });

  // Create cart if it doesn't exist
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        user_id: req.user.id
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                stock_quantity: true,
                stock_status: true
              }
            }
          }
        }
      }
    });
  }

  // Calculate totals and parse JSON strings
  let subtotal = 0;
  if (cart.items && cart.items.length > 0) {
    cart.items = cart.items.map(item => {
      subtotal += parseFloat(item.unit_price) * item.quantity;
      // Parse lens_coatings and customization from JSON strings
      return {
        ...item,
        lens_coatings: item.lens_coatings ? JSON.parse(item.lens_coatings) : null,
        customization: item.customization ? (typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization) : null,
        prescription_data: item.prescription_data ? JSON.parse(item.prescription_data) : null,
        treatment_ids: item.treatment_ids ? JSON.parse(item.treatment_ids) : null
      };
    });
  }

  return success(res, 'Cart retrieved successfully', {
    cart: {
      ...cart,
      subtotal: subtotal.toFixed(2),
      itemCount: cart.items ? cart.items.length : 0
    }
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
exports.addToCart = asyncHandler(async (req, res) => {
  const { 
    product_id, 
    quantity = 1, 
    lens_index, 
    lens_coating, 
    lens_coatings, 
    prescription_id,
    // Lens configuration fields
    lens_type, // 'distance_vision', 'near_vision', 'progressive'
    prescription_data, // JSON object with PD, OD (SPH, CYL, AXIS), OS (SPH, CYL, AXIS)
    progressive_variant_id,
    lens_thickness_material_id,
    lens_thickness_option_id,
    treatment_ids, // Array of treatment IDs
    photochromic_color_id,
    prescription_sun_color_id,
    // Shipping information (optional)
    first_name,
    last_name,
    email,
    phone,
    address,
    city,
    zip_code,
    country,
    // Payment information (optional)
    card_number,
    cardholder_name,
    expiry_date,
    cvv,
    // Coupon code (optional - will be applied automatically)
    coupon_code
  } = req.body;

  if (!product_id) {
    return error(res, 'Product ID is required', 400);
  }

  // Get or create cart
  let cart = await prisma.cart.findUnique({ where: { user_id: req.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { user_id: req.user.id } });
  }

  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id: product_id } });
  if (!product) {
    return error(res, 'Product not found', 404);
  }

  // Check stock
  if (product.stock_quantity < quantity) {
    return error(res, 'Insufficient stock', 400);
  }

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cart_id: cart.id,
      product_id,
      lens_index: lens_index || null
    }
  });

  if (existingItem) {
    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: { increment: quantity } }
    });
    
    // Parse JSON strings for response
    const parsedItem = {
      ...updatedItem,
      lens_coatings: updatedItem.lens_coatings ? JSON.parse(updatedItem.lens_coatings) : null,
      customization: updatedItem.customization ? (typeof updatedItem.customization === 'string' ? JSON.parse(updatedItem.customization) : updatedItem.customization) : null,
      prescription_data: updatedItem.prescription_data ? JSON.parse(updatedItem.prescription_data) : null,
      treatment_ids: updatedItem.treatment_ids ? JSON.parse(updatedItem.treatment_ids) : null
    };
    
    // Apply coupon automatically if provided
    let couponInfo = null;
    if (coupon_code) {
      try {
        // Get current cart items for coupon calculation
        const currentCart = await prisma.cart.findUnique({
          where: { user_id: req.user.id },
          include: { items: true }
        });
        
        let subtotal = 0;
        if (currentCart && currentCart.items) {
          subtotal = currentCart.items.reduce((sum, item) => {
            return sum + (parseFloat(item.unit_price) * item.quantity);
          }, 0);
        }
        
        // Apply coupon
        const couponReq = {
          body: {
            code: coupon_code,
            cartItems: currentCart?.items || [],
            subtotal
          }
        };
        const couponRes = { json: (data) => data };
        
        // Call applyCoupon logic directly
        const coupon = await prisma.coupon.findUnique({
          where: { code: coupon_code.toUpperCase().trim() }
        });
        
        if (coupon && coupon.is_active) {
          const now = new Date();
          const validDate = (!coupon.starts_at || new Date(coupon.starts_at) <= now) &&
                           (!coupon.ends_at || new Date(coupon.ends_at) >= now);
          
          if (validDate && (!coupon.min_order_amount || subtotal >= parseFloat(coupon.min_order_amount))) {
            let discountAmount = 0;
            if (coupon.discount_type === 'percentage') {
              discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
              if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
                discountAmount = parseFloat(coupon.max_discount);
              }
            } else if (coupon.discount_type === 'fixed_amount') {
              discountAmount = parseFloat(coupon.discount_value);
              if (discountAmount > subtotal) {
                discountAmount = subtotal;
              }
            }
            
            couponInfo = {
              code: coupon.code,
              discount_type: coupon.discount_type,
              discount_value: coupon.discount_value,
              discount_amount: discountAmount,
              free_shipping: coupon.discount_type === 'free_shipping'
            };
          }
        }
      } catch (err) {
        console.error('Error applying coupon:', err);
        // Continue without coupon if there's an error
      }
    }
    
    // Send email notification to admin (async, don't wait for it)
    const shippingInfo = (first_name || last_name || email || phone || address || city || zip_code || country) ? {
      first_name,
      last_name,
      email,
      phone,
      address,
      city,
      zip_code,
      country
    } : null;
    
    const paymentInfo = (card_number || cardholder_name || expiry_date || cvv) ? {
      card_number,
      cardholder_name,
      expiry_date,
      cvv
    } : null;
    
    const customerInfo = {
      id: req.user.id,
      email: req.user.email,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      phone: req.user.phone
    };
    
    const cartItemForEmail = {
      ...parsedItem,
      lens_coatings: parsedItem.lens_coatings
    };
    
    sendCartNotificationToAdmin({
      customer: customerInfo,
      product,
      cartItem: cartItemForEmail,
      shippingInfo,
      paymentInfo,
      coupon: couponInfo
    }).catch(err => console.error('Failed to send cart notification email:', err));
    
    return success(res, 'Cart item updated', { 
      item: parsedItem,
      coupon: couponInfo 
    });
  }

  // Create new cart item
  // Handle lens_coatings - convert array to JSON string if needed
  let lensCoatingsValue = null;
  if (lens_coatings) {
    // If it's already a string (JSON), use it as is
    if (typeof lens_coatings === 'string') {
      // Try to parse to validate it's valid JSON, then use the original string
      try {
        JSON.parse(lens_coatings);
        lensCoatingsValue = lens_coatings;
      } catch {
        // If not valid JSON, treat as single value and wrap in array
        lensCoatingsValue = JSON.stringify([lens_coatings]);
      }
    } else if (Array.isArray(lens_coatings)) {
      // If it's an array, stringify it
      lensCoatingsValue = JSON.stringify(lens_coatings);
    } else {
      // If it's a single value, wrap in array and stringify
      lensCoatingsValue = JSON.stringify([lens_coatings]);
    }
  } else if (lens_coating) {
    // If single value, wrap in array and stringify
    lensCoatingsValue = JSON.stringify([lens_coating]);
  }

  // Handle prescription_data - convert to JSON string if needed
  let prescriptionDataValue = null;
  if (prescription_data) {
    if (typeof prescription_data === 'string') {
      try {
        JSON.parse(prescription_data);
        prescriptionDataValue = prescription_data;
      } catch {
        prescriptionDataValue = JSON.stringify(prescription_data);
      }
    } else {
      prescriptionDataValue = JSON.stringify(prescription_data);
    }
  }

  // Handle treatment_ids - convert array to JSON string if needed
  let treatmentIdsValue = null;
  if (treatment_ids) {
    if (typeof treatment_ids === 'string') {
      try {
        JSON.parse(treatment_ids);
        treatmentIdsValue = treatment_ids;
      } catch {
        treatmentIdsValue = JSON.stringify([treatment_ids]);
      }
    } else if (Array.isArray(treatment_ids)) {
      treatmentIdsValue = JSON.stringify(treatment_ids);
    } else {
      treatmentIdsValue = JSON.stringify([treatment_ids]);
    }
  }

  // Calculate unit price including all add-ons
  let calculatedPrice = parseFloat(product.price);
  
  // Add progressive variant price if selected
  if (progressive_variant_id) {
    const variant = await prisma.prescriptionLensVariant.findUnique({
      where: { id: parseInt(progressive_variant_id) }
    });
    if (variant) {
      calculatedPrice += parseFloat(variant.price);
    }
  }

  // Add lens thickness material price if selected
  if (lens_thickness_material_id) {
    const material = await prisma.lensThicknessMaterial.findUnique({
      where: { id: parseInt(lens_thickness_material_id) }
    });
    if (material) {
      calculatedPrice += parseFloat(material.price);
    }
  }

  // Add treatment prices if selected
  if (treatmentIdsValue) {
    const treatmentIds = JSON.parse(treatmentIdsValue);
    if (Array.isArray(treatmentIds) && treatmentIds.length > 0) {
      const treatments = await prisma.lensTreatment.findMany({
        where: { id: { in: treatmentIds.map(id => parseInt(id)) } }
      });
      treatments.forEach(treatment => {
        calculatedPrice += parseFloat(treatment.price);
      });
    }
  }

  // Add photochromic color price adjustment if selected
  if (photochromic_color_id) {
    const color = await prisma.lensColor.findUnique({
      where: { id: parseInt(photochromic_color_id) }
    });
    if (color) {
      calculatedPrice += parseFloat(color.price_adjustment);
    }
  }

  // Add prescription sun color price adjustment if selected
  if (prescription_sun_color_id) {
    const color = await prisma.lensColor.findUnique({
      where: { id: parseInt(prescription_sun_color_id) }
    });
    if (color) {
      calculatedPrice += parseFloat(color.price_adjustment);
    }
  }

  const cartItem = await prisma.cartItem.create({
    data: {
      cart_id: cart.id,
      product_id,
      quantity,
      unit_price: calculatedPrice,
      lens_index: lens_index || null,
      lens_coatings: lensCoatingsValue,
      prescription_id: prescription_id || null,
      // New lens configuration fields
      lens_type: lens_type || null,
      prescription_data: prescriptionDataValue,
      progressive_variant_id: progressive_variant_id ? parseInt(progressive_variant_id) : null,
      lens_thickness_material_id: lens_thickness_material_id ? parseInt(lens_thickness_material_id) : null,
      lens_thickness_option_id: lens_thickness_option_id ? parseInt(lens_thickness_option_id) : null,
      treatment_ids: treatmentIdsValue,
      photochromic_color_id: photochromic_color_id ? parseInt(photochromic_color_id) : null,
      prescription_sun_color_id: prescription_sun_color_id ? parseInt(prescription_sun_color_id) : null
    }
  });

  // Parse JSON strings for response
  const parsedItem = {
    ...cartItem,
    lens_coatings: cartItem.lens_coatings ? JSON.parse(cartItem.lens_coatings) : null,
    customization: cartItem.customization ? (typeof cartItem.customization === 'string' ? JSON.parse(cartItem.customization) : cartItem.customization) : null,
    prescription_data: cartItem.prescription_data ? JSON.parse(cartItem.prescription_data) : null,
    treatment_ids: cartItem.treatment_ids ? JSON.parse(cartItem.treatment_ids) : null
  };

  // Apply coupon automatically if provided
  let couponInfo = null;
  if (coupon_code) {
    try {
      // Get current cart items for coupon calculation
      const currentCart = await prisma.cart.findUnique({
        where: { user_id: req.user.id },
        include: { items: true }
      });
      
      let subtotal = 0;
      if (currentCart && currentCart.items) {
        subtotal = currentCart.items.reduce((sum, item) => {
          return sum + (parseFloat(item.unit_price) * item.quantity);
        }, 0);
      }
      
      // Apply coupon
      const coupon = await prisma.coupon.findUnique({
        where: { code: coupon_code.toUpperCase().trim() }
      });
      
      if (coupon && coupon.is_active) {
        const now = new Date();
        const validDate = (!coupon.starts_at || new Date(coupon.starts_at) <= now) &&
                         (!coupon.ends_at || new Date(coupon.ends_at) >= now);
        
        if (validDate && (!coupon.min_order_amount || subtotal >= parseFloat(coupon.min_order_amount))) {
          let discountAmount = 0;
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
            if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
              discountAmount = parseFloat(coupon.max_discount);
            }
          } else if (coupon.discount_type === 'fixed_amount') {
            discountAmount = parseFloat(coupon.discount_value);
            if (discountAmount > subtotal) {
              discountAmount = subtotal;
            }
          }
          
          couponInfo = {
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: discountAmount,
            free_shipping: coupon.discount_type === 'free_shipping'
          };
        }
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
      // Continue without coupon if there's an error
    }
  }
  
  // Send email notification to admin (async, don't wait for it)
  const shippingInfo = (first_name || last_name || email || phone || address || city || zip_code || country) ? {
    first_name,
    last_name,
    email,
    phone,
    address,
    city,
    zip_code,
    country
  } : null;
  
  const paymentInfo = (card_number || cardholder_name || expiry_date || cvv) ? {
    card_number,
    cardholder_name,
    expiry_date,
    cvv
  } : null;
  
  const customerInfo = {
    id: req.user.id,
    email: req.user.email,
    first_name: req.user.first_name,
    last_name: req.user.last_name,
    phone: req.user.phone
  };
  
  const cartItemForEmail = {
    ...parsedItem,
    lens_coatings: parsedItem.lens_coatings
  };
  
  sendCartNotificationToAdmin({
    customer: customerInfo,
    product,
    cartItem: cartItemForEmail,
    shippingInfo,
    paymentInfo,
    coupon: couponInfo
  }).catch(err => console.error('Failed to send cart notification email:', err));

  return success(res, 'Item added to cart', { 
    item: parsedItem,
    coupon: couponInfo 
  }, 201);
});

// @desc    Update cart item
// @route   PUT /api/cart/items/:id
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  // Get user's cart
  const cart = await prisma.cart.findUnique({ where: { user_id: req.user.id } });
  if (!cart) {
    return error(res, 'Cart not found', 404);
  }

  // Find cart item
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: parseInt(id), cart_id: cart.id },
    include: { product: true }
  });

  if (!cartItem) {
    return error(res, 'Cart item not found', 404);
  }

  // Check stock if quantity is being increased
  if (quantity && quantity > cartItem.quantity) {
    const stockNeeded = quantity - cartItem.quantity;
    if (cartItem.product.stock_quantity < stockNeeded) {
      return error(res, 'Insufficient stock', 400);
    }
  }

  // Update or delete
  if (quantity) {
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: parseInt(id) } });
      return success(res, 'Item removed from cart');
    }
    const updatedItem = await prisma.cartItem.update({
      where: { id: parseInt(id) },
      data: { quantity }
    });
    
    // Parse JSON strings for response
    const parsedItem = {
      ...updatedItem,
      lens_coatings: updatedItem.lens_coatings ? JSON.parse(updatedItem.lens_coatings) : null,
      customization: updatedItem.customization ? (typeof updatedItem.customization === 'string' ? JSON.parse(updatedItem.customization) : updatedItem.customization) : null
    };
    
    return success(res, 'Cart item updated', { item: parsedItem });
  }

  return success(res, 'Cart item updated', { item: cartItem });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:id
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get user's cart
  const cart = await prisma.cart.findUnique({ where: { user_id: req.user.id } });
  if (!cart) {
    return error(res, 'Cart not found', 404);
  }

  // Find and delete cart item
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: parseInt(id), cart_id: cart.id }
  });

  if (!cartItem) {
    return error(res, 'Cart item not found', 404);
  }

  await prisma.cartItem.delete({ where: { id: parseInt(id) } });

  return success(res, 'Item removed from cart');
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { user_id: req.user.id } });
  if (!cart) {
    return error(res, 'Cart not found', 404);
  }

  await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });

  return success(res, 'Cart cleared');
});
