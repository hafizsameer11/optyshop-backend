const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');
const { sendCartNotificationToAdmin } = require('../utils/email');

// Helper function to get display images for cart item
const getCartItemDisplayImages = (item, product) => {
  // Get selected color images from customization
  let selectedColorImages = null;
  let caliberImage = null;
  let variantImage = null;
  let customization = item.customization;
  if (typeof customization === 'string') {
    try {
      customization = JSON.parse(customization);
    } catch (e) {
      customization = null;
    }
  }
  
  // Check for variant image first (new variant system)
  if (customization && customization.variant_image_url) {
    variantImage = customization.variant_image_url;
  }
  
  // Check for caliber image (legacy)
  if (customization && customization.caliber_image_url) {
    caliberImage = customization.caliber_image_url;
  }
  
  // Check for eye hygiene variant image
  if (customization && customization.eye_hygiene_image_url) {
    variantImage = customization.eye_hygiene_image_url;
  }
  
  // Check for size volume variant image
  if (customization && customization.size_volume_image_url) {
    variantImage = customization.size_volume_image_url;
  }
  
  if (customization && customization.variant_images) {
    selectedColorImages = customization.variant_images;
  } else if (customization && customization.selected_color) {
    // Try to find color images from product's color_images
    if (product && product.color_images) {
      try {
        let colorImages = product.color_images;
        if (typeof colorImages === 'string') {
          colorImages = JSON.parse(colorImages);
        }
        if (Array.isArray(colorImages)) {
          const selectedColor = customization.selected_color || customization.hex_code;
          const colorVariant = colorImages.find(c => {
            const hexCode = c.hexCode || c.hex_code;
            const colorName = c.name || c.color;
            return (hexCode && hexCode.toLowerCase() === selectedColor.toLowerCase()) ||
                   (colorName && colorName.toLowerCase() === selectedColor.toLowerCase());
          });
          if (colorVariant && colorVariant.images) {
            selectedColorImages = Array.isArray(colorVariant.images) ? colorVariant.images : [colorVariant.images];
          }
        }
      } catch (e) {
        console.error('Error parsing color images:', e);
      }
    }
  }
  
  // Parse product images
  let productImages = product ? product.images : null;
  if (productImages) {
    try {
      productImages = typeof productImages === 'string' ? JSON.parse(productImages) : productImages;
      if (!Array.isArray(productImages)) {
        productImages = productImages ? [productImages] : [];
      }
    } catch (e) {
      productImages = [];
    }
  } else {
    productImages = [];
  }
  
  // Priority: variant image > caliber image > selected color images > product images
  let displayImages = [];
  if (variantImage) {
    displayImages = [variantImage];
  } else if (caliberImage) {
    displayImages = [caliberImage];
  } else if (selectedColorImages && selectedColorImages.length > 0) {
    displayImages = selectedColorImages;
  } else {
    displayImages = productImages;
  }
  
  return {
    display_images: displayImages,
    display_image: displayImages && displayImages.length > 0 ? displayImages[0] : null
  };
};

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
      astigmatism: null
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

    // Astigmatism details (from customization)
    if (item.customization) {
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
    }

  return details;
};

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
              color_images: true,
              mm_calibers: true,
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
                color_images: true,
                mm_calibers: true,
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
      const parsedItem = {
        ...item,
        lens_coatings: item.lens_coatings ? JSON.parse(item.lens_coatings) : null,
        customization: item.customization ? (typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization) : null,
        prescription_data: item.prescription_data ? JSON.parse(item.prescription_data) : null,
        treatment_ids: item.treatment_ids ? JSON.parse(item.treatment_ids) : null
      };
      
      // Get display images using helper function
      const imageInfo = getCartItemDisplayImages(item, item.product);
      parsedItem.display_images = imageInfo.display_images;
      parsedItem.display_image = imageInfo.display_image;
      
      // Get lens color images
      let lensColorImage = null;
      if (item.photochromicColor && item.photochromicColor.image_url) {
        lensColorImage = item.photochromicColor.image_url;
      } else if (item.prescriptionSunColor && item.prescriptionSunColor.image_url) {
        lensColorImage = item.prescriptionSunColor.image_url;
      }
      parsedItem.lens_color_image = lensColorImage;
      
      // Add formatted contact lens details
      parsedItem.contact_lens_details = formatContactLensDetails(item);
      
      return parsedItem;
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
    // Color/Variant selection
    selected_color, // Color value (e.g., "black", "brown") from product colors array
    // MM Caliber selection
    selected_mm_caliber, // Selected MM caliber (e.g., "78")
    // Variant selection (new)
    selected_variant_id, // Selected variant ID (e.g., "caliber_78", "eye_hygiene_1", "size_volume_2")
    variant_type, // Variant type: "mm_caliber", "eye_hygiene", "size_volume"
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

  // Get or create cart
  let cart = await prisma.cart.findUnique({ where: { user_id: req.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { user_id: req.user.id } });
  }

  // Validate product_id
  if (!product_id) {
    return error(res, 'Product ID is required', 400);
  }

  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id: product_id } });
  if (!product) {
    return error(res, `Product not found with ID: ${product_id}`, 404);
  }

  // Check if product is active
  if (!product.is_active) {
    return error(res, 'Product is not active', 400);
  }

  // Handle color/variant selection
  let selectedColorVariant = null;
  let variantPrice = null;
  let customizationData = null;

  // Handle new variant selection (takes priority over other selections)
  if (selected_variant_id && variant_type) {
    try {
      // Get product with all variant data
      const productWithVariants = await prisma.product.findUnique({
        where: { id: product_id },
        select: {
          id: true,
          name: true,
          price: true,
          mm_calibers: true,
          eyeHygieneVariants: {
            where: { is_active: true },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image_url: true,
              sort_order: true
            }
          },
          sizeVolumeVariants: {
            where: { is_active: true },
            select: {
              id: true,
              size_volume: true,
              pack_type: true,
              price: true,
              compare_at_price: true,
              stock_quantity: true,
              stock_status: true,
              sku: true,
              image_url: true,
              sort_order: true
            }
          }
        }
      });

      if (productWithVariants) {
        // Parse mm_calibers if needed
        let mmCalibers = [];
        if (productWithVariants.mm_calibers) {
          try {
            mmCalibers = typeof productWithVariants.mm_calibers === 'string' 
              ? JSON.parse(productWithVariants.mm_calibers) 
              : productWithVariants.mm_calibers;
          } catch (e) {
            mmCalibers = [];
          }
        }

        let foundVariant = null;

        if (variant_type === 'mm_caliber' && selected_variant_id.startsWith('caliber_')) {
          const mm = selected_variant_id.replace('caliber_', '');
          const caliberData = mmCalibers.find(c => c.mm === mm);
          
          if (caliberData) {
            foundVariant = {
              type: 'mm_caliber',
              name: `${mm}mm`,
              display_name: `${mm}mm Caliber`,
              price: parseFloat(productWithVariants.price),
              image_url: caliberData.image_url,
              metadata: {
                mm: mm,
                image_url: caliberData.image_url
              }
            };
          }
        } else if (variant_type === 'eye_hygiene' && selected_variant_id.startsWith('eye_hygiene_')) {
          const variantIdNum = parseInt(selected_variant_id.replace('eye_hygiene_', ''));
          const eyeHygieneVariant = productWithVariants.eyeHygieneVariants.find(v => v.id === variantIdNum);
          
          if (eyeHygieneVariant) {
            foundVariant = {
              type: 'eye_hygiene',
              name: eyeHygieneVariant.name,
              display_name: eyeHygieneVariant.name,
              description: eyeHygieneVariant.description,
              price: parseFloat(eyeHygieneVariant.price),
              image_url: eyeHygieneVariant.image_url,
              metadata: {
                variant_id: eyeHygieneVariant.id,
                image_url: eyeHygieneVariant.image_url
              }
            };
          }
        } else if (variant_type === 'size_volume' && selected_variant_id.startsWith('size_volume_')) {
          const variantIdNum = parseInt(selected_variant_id.replace('size_volume_', ''));
          const sizeVolumeVariant = productWithVariants.sizeVolumeVariants.find(v => v.id === variantIdNum);
          
          if (sizeVolumeVariant) {
            foundVariant = {
              type: 'size_volume',
              name: sizeVolumeVariant.pack_type ? `${sizeVolumeVariant.size_volume} ${sizeVolumeVariant.pack_type}` : sizeVolumeVariant.size_volume,
              display_name: sizeVolumeVariant.pack_type ? `${sizeVolumeVariant.size_volume} ${sizeVolumeVariant.pack_type}` : sizeVolumeVariant.size_volume,
              price: parseFloat(sizeVolumeVariant.price),
              compare_at_price: sizeVolumeVariant.compare_at_price ? parseFloat(sizeVolumeVariant.compare_at_price) : null,
              image_url: sizeVolumeVariant.image_url,
              stock_quantity: sizeVolumeVariant.stock_quantity,
              stock_status: sizeVolumeVariant.stock_status,
              sku: sizeVolumeVariant.sku,
              metadata: {
                variant_id: sizeVolumeVariant.id,
                size_volume: sizeVolumeVariant.size_volume,
                pack_type: sizeVolumeVariant.pack_type,
                sku: sizeVolumeVariant.sku,
                image_url: sizeVolumeVariant.image_url
              }
            };
          }
        }

        if (foundVariant) {
          variantPrice = foundVariant.price;
          customizationData = {
            selected_variant_id: selected_variant_id,
            variant_type: variant_type,
            variant_name: foundVariant.name,
            variant_display_name: foundVariant.display_name,
            variant_price: foundVariant.price,
            variant_image_url: foundVariant.image_url,
            variant_metadata: foundVariant.metadata
          };

          // Add variant-specific data to customization
          if (foundVariant.type === 'mm_caliber') {
            customizationData.selected_mm_caliber = foundVariant.metadata.mm;
            customizationData.caliber_image_url = foundVariant.metadata.image_url;
          } else if (foundVariant.type === 'eye_hygiene') {
            customizationData.eye_hygiene_variant_id = foundVariant.metadata.variant_id;
            customizationData.eye_hygiene_image_url = foundVariant.metadata.image_url;
          } else if (foundVariant.type === 'size_volume') {
            customizationData.size_volume_variant_id = foundVariant.metadata.variant_id;
            customizationData.size_volume = foundVariant.metadata.size_volume;
            customizationData.pack_type = foundVariant.metadata.pack_type;
            customizationData.sku = foundVariant.metadata.sku;
            customizationData.size_volume_image_url = foundVariant.metadata.image_url;
          }
        }
      }
    } catch (err) {
      console.error('Error processing variant selection:', err);
      // Continue without variant if there's an error
    }
  }

  // Handle MM caliber selection (legacy support)
  let selectedCaliberData = null;
  if (selected_mm_caliber && !customizationData) {
    // Parse mm_calibers to find matching caliber
    let mmCalibers = product.mm_calibers;
    if (typeof mmCalibers === 'string') {
      try {
        mmCalibers = JSON.parse(mmCalibers);
      } catch (e) {
        mmCalibers = [];
      }
    }
    if (!Array.isArray(mmCalibers)) {
      mmCalibers = mmCalibers ? [mmCalibers] : [];
    }

    selectedCaliberData = mmCalibers.find(caliber => caliber.mm === selected_mm_caliber);
    
    if (selectedCaliberData) {
      // Store caliber selection in customization
      if (!customizationData) {
        customizationData = {};
      }
      customizationData.selected_mm_caliber = selected_mm_caliber;
      customizationData.caliber_image_url = selectedCaliberData.image_url;
    } else {
      console.warn(`MM caliber "${selected_mm_caliber}" not found for product ${product_id}`);
    }
  }

  if (selected_color) {
    // Parse color_images to find matching variant
    let colorImages = product.color_images;
    if (typeof colorImages === 'string') {
      try {
        colorImages = JSON.parse(colorImages);
      } catch (e) {
        colorImages = [];
      }
    }
    if (!Array.isArray(colorImages)) {
      colorImages = colorImages ? [colorImages] : [];
    }

    // Find matching color variant by hex code or color name (backward compatibility)
    // selected_color can be a hex code (e.g., "#000000") or color name (e.g., "black")
    const normalizedSelectedColor = selected_color.trim();
    const isHexCode = normalizedSelectedColor.match(/^#[0-9A-Fa-f]{6}$/);
    
    selectedColorVariant = colorImages.find(colorData => {
      // Support both new format (hexCode) and old format (color) for backward compatibility
      const hexCode = colorData.hexCode || colorData.hex_code || null;
      const colorName = colorData.color || colorData.name || '';
      
      if (isHexCode) {
        // Match by hex code (case-insensitive)
        return hexCode && hexCode.toLowerCase() === normalizedSelectedColor.toLowerCase();
      } else {
        // Match by color name (case-insensitive)
        const normalizedColorName = colorName.toLowerCase().trim();
        const normalizedSelected = normalizedSelectedColor.toLowerCase().trim();
        return normalizedColorName === normalizedSelected || 
               normalizedColorName.includes(normalizedSelected) ||
               normalizedSelected.includes(normalizedColorName);
      }
    });

    if (selectedColorVariant) {
      // Use variant price if available, otherwise use base product price
      variantPrice = selectedColorVariant.price !== undefined && selectedColorVariant.price !== null
        ? parseFloat(selectedColorVariant.price)
        : parseFloat(product.price);

      // Get hex code and color name
      const hexCode = selectedColorVariant.hexCode || selectedColorVariant.hex_code || null;
      const colorName = selectedColorVariant.name || selectedColorVariant.color || 'Unknown';

      // Store color selection in customization
      if (!customizationData) {
        customizationData = {};
      }
      customizationData.selected_color = hexCode || selectedColorVariant.color || selectedColorVariant.name;
      customizationData.hex_code = hexCode;
      customizationData.color_name = colorName;
      customizationData.color_display_name = selectedColorVariant.display_name || colorName;
      customizationData.variant_price = variantPrice;
      customizationData.variant_images = Array.isArray(selectedColorVariant.images) 
        ? selectedColorVariant.images 
        : (selectedColorVariant.images ? [selectedColorVariant.images] : [])
    } else {
      // Color not found, but continue with base product
      console.warn(`Color variant "${selected_color}" not found for product ${product_id}, using base product`);
    }
  }

  // Check stock
  const stockQuantity = product.stock_quantity;
  
  if (stockQuantity < quantity) {
    return error(res, 'Insufficient stock', 400);
  }

  // Check if item already exists in cart (with same product, lens_index, and color)
  // Build where clause for existing item check
  const existingItemWhere = {
    cart_id: cart.id,
    product_id: product_id,
    lens_index: lens_index || null
  };

  // If color is selected, check customization field for matching color
  // Note: This is a simplified check - in production, you might want to parse customization JSON
  const existingItem = await prisma.cartItem.findFirst({
    where: existingItemWhere
  });

  // Additional check: if color is selected, verify it matches existing item's color
  let shouldUpdateExisting = false;
  if (existingItem && selected_color && customizationData) {
    // Parse existing item's customization to check color match
    let existingCustomization = null;
    if (existingItem.customization) {
      try {
        existingCustomization = typeof existingItem.customization === 'string'
          ? JSON.parse(existingItem.customization)
          : existingItem.customization;
      } catch (e) {
        existingCustomization = null;
      }
    }
    
    // If existing item has same color, update quantity
    if (existingCustomization && existingCustomization.selected_color) {
      const existingColor = existingCustomization.selected_color.toLowerCase().trim();
      const newColor = customizationData.selected_color.toLowerCase().trim();
      shouldUpdateExisting = existingColor === newColor;
    } else if (!existingCustomization || !existingCustomization.selected_color) {
      // Existing item has no color, treat as different item if color is now selected
      shouldUpdateExisting = false;
    }
  } else if (existingItem && !selected_color) {
    // No color selected, check if existing item also has no color
    let existingCustomization = null;
    if (existingItem.customization) {
      try {
        existingCustomization = typeof existingItem.customization === 'string'
          ? JSON.parse(existingItem.customization)
          : existingItem.customization;
      } catch (e) {
        existingCustomization = null;
      }
    }
    shouldUpdateExisting = !existingCustomization || !existingCustomization.selected_color;
  } else if (existingItem) {
    // Existing item found, update it
    shouldUpdateExisting = true;
  }

  if (existingItem && shouldUpdateExisting) {
    // Prepare update data
    const updateData = { 
      quantity: { increment: quantity }
    };

    // Update price if variant price is different
    if (variantPrice !== null && variantPrice !== parseFloat(existingItem.unit_price)) {
      updateData.unit_price = variantPrice;
    }

    // Update customization if color is selected
    if (customizationData) {
      updateData.customization = JSON.stringify(customizationData);
    }
    
    // Update item
    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: updateData
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
  // Start with variant price if color is selected, otherwise use base product price
  let calculatedPrice = variantPrice !== null ? variantPrice : parseFloat(product.price);
  
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

  // Prepare customization data (include color selection if provided)
  let finalCustomizationData = customizationData;
  
  const cartItem = await prisma.cartItem.create({
    data: {
      cart_id: cart.id,
      product_id: product_id,
      quantity,
      unit_price: calculatedPrice,
      lens_index: lens_index || null,
      lens_coatings: lensCoatingsValue,
      prescription_id: prescription_id || null,
      customization: finalCustomizationData ? JSON.stringify(finalCustomizationData) : null,
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

  // Check for free gifts and add them automatically
  const applicableGifts = await prisma.productGift.findMany({
    where: {
      product_id: product_id,
      is_active: true,
      min_quantity: { lte: quantity },
      OR: [
        { max_quantity: null },
        { max_quantity: { gte: quantity } }
      ]
    },
    include: {
      giftProduct: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          stock_status: true,
          is_active: true
        }
      }
    }
  });

  const addedGifts = [];
  for (const gift of applicableGifts) {
    // Check if gift product is active and in stock
    if (!gift.giftProduct.is_active || gift.giftProduct.stock_status !== 'in_stock') {
      continue;
    }

    // Check if gift is already in cart
    const existingGiftItem = await prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        product_id: gift.gift_product_id,
        // Check if it's marked as a gift (we'll use a custom field or check by price = 0)
        unit_price: 0
      }
    });

    if (!existingGiftItem) {
      // Add gift to cart with price 0
      const giftItem = await prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id: gift.gift_product_id,
          quantity: 1, // Always add 1 gift item
          unit_price: 0, // Free gift
          customization: JSON.stringify({
            is_gift: true,
            gift_from_product_id: product_id,
            gift_rule_id: gift.id
          })
        }
      });
      addedGifts.push({
        ...giftItem,
        gift_product: gift.giftProduct
      });
    }
  }

  // Parse JSON strings for response
  const parsedItem = {
    ...cartItem,
    lens_coatings: cartItem.lens_coatings ? JSON.parse(cartItem.lens_coatings) : null,
    customization: cartItem.customization ? (typeof cartItem.customization === 'string' ? JSON.parse(cartItem.customization) : cartItem.customization) : null,
    prescription_data: cartItem.prescription_data ? JSON.parse(cartItem.prescription_data) : null,
    treatment_ids: cartItem.treatment_ids ? JSON.parse(cartItem.treatment_ids) : null
  };
  
  // Get display images using helper function
  const imageInfo = getCartItemDisplayImages(cartItem, product);
  parsedItem.display_images = imageInfo.display_images;
  parsedItem.display_image = imageInfo.display_image;
  
  // Get lens color images
  let lensColorImage = null;
  if (photochromic_color_id) {
    const color = await prisma.lensColor.findUnique({
      where: { id: parseInt(photochromic_color_id) },
      select: { image_url: true }
    });
    if (color && color.image_url) {
      lensColorImage = color.image_url;
    }
  } else if (prescription_sun_color_id) {
    const color = await prisma.lensColor.findUnique({
      where: { id: parseInt(prescription_sun_color_id) },
      select: { image_url: true }
    });
    if (color && color.image_url) {
      lensColorImage = color.image_url;
    }
  }
  parsedItem.lens_color_image = lensColorImage;
  
  // Add formatted contact lens details
  parsedItem.contact_lens_details = formatContactLensDetails(cartItem);

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
    coupon: couponInfo,
    gifts: addedGifts.length > 0 ? addedGifts : undefined
  }, 201);
});

// @desc    Update cart item
// @route   PUT /api/cart/items/:id
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    quantity
  } = req.body;

  // Get user's cart
  const cart = await prisma.cart.findUnique({ where: { user_id: req.user.id } });
  if (!cart) {
    return error(res, 'Cart not found', 404);
  }

  // Find cart item
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: parseInt(id), cart_id: cart.id },
    include: { 
      product: true,
      photochromicColor: true,
      prescriptionSunColor: true
    }
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

  // Prepare update data
  const updateData = {};
  
  if (quantity !== undefined) {
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: parseInt(id) } });
      return success(res, 'Item removed from cart');
    }
    updateData.quantity = quantity;
  }
  
  // Update cart item if there's data to update
  if (Object.keys(updateData).length > 0) {
    const updatedItem = await prisma.cartItem.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    // Parse JSON strings for response
    const parsedItem = {
      ...updatedItem,
      lens_coatings: updatedItem.lens_coatings ? JSON.parse(updatedItem.lens_coatings) : null,
      customization: updatedItem.customization ? (typeof updatedItem.customization === 'string' ? JSON.parse(updatedItem.customization) : updatedItem.customization) : null,
      prescription_data: updatedItem.prescription_data ? JSON.parse(updatedItem.prescription_data) : null,
      treatment_ids: updatedItem.treatment_ids ? JSON.parse(updatedItem.treatment_ids) : null
    };
    
    // Get display images
    const imageInfo = getCartItemDisplayImages(updatedItem, cartItem.product);
    parsedItem.display_images = imageInfo.display_images;
    parsedItem.display_image = imageInfo.display_image;
    
    // Get lens color image
    let lensColorImage = null;
    if (cartItem.photochromicColor && cartItem.photochromicColor.image_url) {
      lensColorImage = cartItem.photochromicColor.image_url;
    } else if (cartItem.prescriptionSunColor && cartItem.prescriptionSunColor.image_url) {
      lensColorImage = cartItem.prescriptionSunColor.image_url;
    }
    parsedItem.lens_color_image = lensColorImage;
    
    // Add formatted contact lens details
    parsedItem.contact_lens_details = formatContactLensDetails(updatedItem);
    
    return success(res, 'Cart item updated', { item: parsedItem });
  }

  // If no update, still format the existing item
  const formattedItem = {
    ...cartItem,
    lens_coatings: cartItem.lens_coatings ? JSON.parse(cartItem.lens_coatings) : null,
    customization: cartItem.customization ? (typeof cartItem.customization === 'string' ? JSON.parse(cartItem.customization) : cartItem.customization) : null,
    prescription_data: cartItem.prescription_data ? JSON.parse(cartItem.prescription_data) : null,
    treatment_ids: cartItem.treatment_ids ? JSON.parse(cartItem.treatment_ids) : null,
    contact_lens_details: formatContactLensDetails(cartItem)
  };
  
  // Get display images
  const imageInfo = getCartItemDisplayImages(cartItem, cartItem.product);
  formattedItem.display_images = imageInfo.display_images;
  formattedItem.display_image = imageInfo.display_image;
  
  // Get lens color image
  let lensColorImage = null;
  if (cartItem.photochromicColor && cartItem.photochromicColor.image_url) {
    lensColorImage = cartItem.photochromicColor.image_url;
  } else if (cartItem.prescriptionSunColor && cartItem.prescriptionSunColor.image_url) {
    lensColorImage = cartItem.prescriptionSunColor.image_url;
  }
  formattedItem.lens_color_image = lensColorImage;
  
  return success(res, 'Cart item updated', { item: formattedItem });
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
