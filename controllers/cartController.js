const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

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
          }
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

  // Calculate totals
  let subtotal = 0;
  if (cart.items && cart.items.length > 0) {
    cart.items.forEach(item => {
      subtotal += parseFloat(item.unit_price) * item.quantity;
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
  const { product_id, quantity = 1, lens_index, lens_coating, prescription_id } = req.body;

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
    return success(res, 'Cart item updated', { item: updatedItem });
  }

  // Create new cart item
  const cartItem = await prisma.cartItem.create({
    data: {
      cart_id: cart.id,
      product_id,
      quantity,
      unit_price: product.price,
      lens_index: lens_index || null,
      lens_coatings: lens_coating ? [lens_coating] : [],
      prescription_id: prescription_id || null
    }
  });

  return success(res, 'Item added to cart', { item: cartItem }, 201);
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
    return success(res, 'Cart item updated', { item: updatedItem });
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
