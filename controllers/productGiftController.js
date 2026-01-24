const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// @desc    Get all product gifts (Public)
// @route   GET /api/product-gifts
// @access  Public
exports.getProductGifts = asyncHandler(async (req, res) => {
    const { product_id } = req.query;
    
    const where = { is_active: true };
    if (product_id) {
        where.product_id = parseInt(product_id);
    }
    
    const gifts = await prisma.productGift.findMany({
        where,
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true,
                    stock_status: true
                }
            },
            giftProduct: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true,
                    stock_status: true
                }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    return success(res, 'Product gifts retrieved successfully', { gifts });
});

// @desc    Get gifts for a specific product (Public)
// @route   GET /api/product-gifts/product/:productId
// @access  Public
exports.getGiftsForProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    
    const gifts = await prisma.productGift.findMany({
        where: {
            product_id: parseInt(productId),
            is_active: true
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
                    short_description: true
                }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    return success(res, 'Product gifts retrieved successfully', { gifts });
});

// @desc    Get all product gifts (Admin)
// @route   GET /api/admin/product-gifts
// @access  Private/Admin
exports.getProductGiftsAdmin = asyncHandler(async (req, res) => {
    const gifts = await prisma.productGift.findMany({
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true
                }
            },
            giftProduct: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true
                }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    return success(res, 'Product gifts retrieved successfully', { gifts });
});

// @desc    Get product gift by ID (Admin)
// @route   GET /api/admin/product-gifts/:id
// @access  Private/Admin
exports.getProductGiftById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const gift = await prisma.productGift.findUnique({
        where: { id: parseInt(id) },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true
                }
            },
            giftProduct: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true
                }
            }
        }
    });

    if (!gift) {
        return error(res, 'Product gift not found', 404);
    }

    return success(res, 'Product gift retrieved successfully', { gift });
});

// @desc    Create product gift (Admin)
// @route   POST /api/admin/product-gifts
// @access  Private/Admin
exports.createProductGift = asyncHandler(async (req, res) => {
    const { product_id, gift_product_id, min_quantity, max_quantity, ...rest } = req.body;

    // Validate required fields
    if (!product_id || !gift_product_id) {
        return error(res, 'product_id and gift_product_id are required', 400);
    }

    // Check if products exist
    const product = await prisma.product.findUnique({
        where: { id: parseInt(product_id) }
    });
    if (!product) {
        return error(res, 'Product not found', 404);
    }

    const giftProduct = await prisma.product.findUnique({
        where: { id: parseInt(gift_product_id) }
    });
    if (!giftProduct) {
        return error(res, 'Gift product not found', 404);
    }

    // Check if gift relationship already exists
    const existing = await prisma.productGift.findFirst({
      where: {
        product_id: parseInt(product_id),
        gift_product_id: parseInt(gift_product_id)
      }
    });
    if (existing) {
        return error(res, 'This gift relationship already exists', 400);
    }

    const giftData = {
        product_id: parseInt(product_id),
        gift_product_id: parseInt(gift_product_id),
        min_quantity: min_quantity ? parseInt(min_quantity) : 1,
        max_quantity: max_quantity ? parseInt(max_quantity) : null,
        ...rest
    };

    // Convert is_active from string to boolean
    if (giftData.is_active !== undefined && giftData.is_active !== null) {
        if (typeof giftData.is_active === 'string') {
            giftData.is_active = giftData.is_active.toLowerCase() === 'true';
        } else {
            giftData.is_active = Boolean(giftData.is_active);
        }
    } else {
        giftData.is_active = true;
    }

    const gift = await prisma.productGift.create({
        data: giftData,
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true
                }
            },
            giftProduct: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true
                }
            }
        }
    });

    return success(res, 'Product gift created successfully', { gift }, 201);
});

// @desc    Update product gift (Admin)
// @route   PUT /api/admin/product-gifts/:id
// @access  Private/Admin
exports.updateProductGift = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { product_id, gift_product_id, min_quantity, max_quantity, ...rest } = req.body;

    const updateData = { ...rest };

    // Handle product_id if provided
    if (product_id !== undefined) {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(product_id) }
        });
        if (!product) {
            return error(res, 'Product not found', 404);
        }
        updateData.product_id = parseInt(product_id);
    }

    // Handle gift_product_id if provided
    if (gift_product_id !== undefined) {
        const giftProduct = await prisma.product.findUnique({
            where: { id: parseInt(gift_product_id) }
        });
        if (!giftProduct) {
            return error(res, 'Gift product not found', 404);
        }
        updateData.gift_product_id = parseInt(gift_product_id);
    }

    // Handle min_quantity
    if (min_quantity !== undefined) {
        updateData.min_quantity = parseInt(min_quantity);
    }

    // Handle max_quantity
    if (max_quantity !== undefined) {
        updateData.max_quantity = max_quantity ? parseInt(max_quantity) : null;
    }

    // Convert is_active from string to boolean
    if (updateData.is_active !== undefined && updateData.is_active !== null) {
        if (typeof updateData.is_active === 'string') {
            updateData.is_active = updateData.is_active.toLowerCase() === 'true';
        } else {
            updateData.is_active = Boolean(updateData.is_active);
        }
    }

    const gift = await prisma.productGift.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true
                }
            },
            giftProduct: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: true
                }
            }
        }
    });

    return success(res, 'Product gift updated successfully', { gift });
});

// @desc    Delete product gift (Admin)
// @route   DELETE /api/admin/product-gifts/:id
// @access  Private/Admin
exports.deleteProductGift = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await prisma.productGift.delete({
        where: { id: parseInt(id) }
    });

    return success(res, 'Product gift deleted successfully');
});
