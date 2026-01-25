const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { success, error } = require("../utils/response");

// MM Caliber Management
exports.addProductCaliber = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { mm, image_url } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const currentCalibers = product.mm_calibers ? JSON.parse(product.mm_calibers) : [];
    
    // Check if caliber already exists
    if (currentCalibers.find(caliber => caliber.mm === mm)) {
      return error(res, 'Caliber already exists', 400);
    }

    currentCalibers.push({ mm, image_url });

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        mm_calibers: JSON.stringify(currentCalibers)
      }
    });

    return success(res, 'Caliber added successfully', updatedProduct);
  } catch (err) {
    console.error('Add caliber error:', err);
    return error(res, 'Error adding caliber', 500);
  }
});

exports.updateProductCaliber = asyncHandler(async (req, res) => {
  const { productId, mm } = req.params;
  const { image_url } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const currentCalibers = product.mm_calibers ? JSON.parse(product.mm_calibers) : [];
    
    const caliberIndex = currentCalibers.findIndex(caliber => caliber.mm === mm);
    if (caliberIndex === -1) {
      return error(res, 'Caliber not found', 404);
    }

    currentCalibers[caliberIndex].image_url = image_url;

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        mm_calibers: JSON.stringify(currentCalibers)
      }
    });

    return success(res, 'Caliber updated successfully', updatedProduct);
  } catch (err) {
    console.error('Update caliber error:', err);
    return error(res, 'Error updating caliber', 500);
  }
});

exports.deleteProductCaliber = asyncHandler(async (req, res) => {
  const { productId, mm } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const currentCalibers = product.mm_calibers ? JSON.parse(product.mm_calibers) : [];
    const filteredCalibers = currentCalibers.filter(caliber => caliber.mm !== mm);

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        mm_calibers: JSON.stringify(filteredCalibers)
      }
    });

    return success(res, 'Caliber deleted successfully', updatedProduct);
  } catch (err) {
    console.error('Delete caliber error:', err);
    return error(res, 'Error deleting caliber', 500);
  }
});

// Eye Hygiene Variant Management
exports.createEyeHygieneVariant = asyncHandler(async (req, res) => {
  const { product_id, name, description, price, image_url, sort_order } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(product_id) }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const variant = await prisma.eyeHygieneVariant.create({
      data: {
        product_id: parseInt(product_id),
        name,
        description,
        price: parseFloat(price),
        image_url,
        sort_order: parseInt(sort_order) || 0
      }
    });

    return success(res, 'Eye hygiene variant created successfully', variant);
  } catch (err) {
    console.error('Create eye hygiene variant error:', err);
    return error(res, 'Error creating eye hygiene variant', 500);
  }
});

exports.updateEyeHygieneVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url, is_active, sort_order } = req.body;

  try {
    const variant = await prisma.eyeHygieneVariant.findUnique({
      where: { id: parseInt(id) }
    });

    if (!variant) {
      return error(res, 'Eye hygiene variant not found', 404);
    }

    const updatedVariant = await prisma.eyeHygieneVariant.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        image_url,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined,
        sort_order: sort_order !== undefined ? parseInt(sort_order) : undefined
      }
    });

    return success(res, 'Eye hygiene variant updated successfully', updatedVariant);
  } catch (err) {
    console.error('Update eye hygiene variant error:', err);
    return error(res, 'Error updating eye hygiene variant', 500);
  }
});

exports.deleteEyeHygieneVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const variant = await prisma.eyeHygieneVariant.findUnique({
      where: { id: parseInt(id) }
    });

    if (!variant) {
      return error(res, 'Eye hygiene variant not found', 404);
    }

    await prisma.eyeHygieneVariant.delete({
      where: { id: parseInt(id) }
    });

    return success(res, 'Eye hygiene variant deleted successfully');
  } catch (err) {
    console.error('Delete eye hygiene variant error:', err);
    return error(res, 'Error deleting eye hygiene variant', 500);
  }
});

exports.getEyeHygieneVariants = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    const variants = await prisma.eyeHygieneVariant.findMany({
      where: {
        product_id: parseInt(productId),
        is_active: true
      },
      orderBy: {
        sort_order: 'asc'
      }
    });

    return success(res, 'Eye hygiene variants retrieved successfully', variants);
  } catch (err) {
    console.error('Get eye hygiene variants error:', err);
    return error(res, 'Error retrieving eye hygiene variants', 500);
  }
});

// Website API endpoints
exports.getProductWithCalibers = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { 
        id: parseInt(id),
        is_active: true 
      },
      include: {
        category: true,
        brand: true,
        eyeHygieneVariants: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' }
        }
      }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    // Parse mm_calibers if they exist
    const productData = {
      ...product,
      mm_calibers: product.mm_calibers ? JSON.parse(product.mm_calibers) : []
    };

    return success(res, 'Product retrieved successfully', productData);
  } catch (err) {
    console.error('Get product error:', err);
    return error(res, 'Error retrieving product', 500);
  }
});

exports.getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await prisma.product.findMany({
      where: {
        category_id: parseInt(categoryId),
        is_active: true
      },
      include: {
        category: true,
        brand: true,
        eyeHygieneVariants: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' }
        }
      },
      orderBy: {
        [sortBy]: sortOrder.toLowerCase()
      },
      skip,
      take: parseInt(limit)
    });

    // Parse mm_calibers for each product
    const productsData = products.map(product => ({
      ...product,
      mm_calibers: product.mm_calibers ? JSON.parse(product.mm_calibers) : []
    }));

    const total = await prisma.product.count({
      where: {
        category_id: parseInt(categoryId),
        is_active: true
      }
    });

    return success(res, 'Products retrieved successfully', {
      products: productsData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get products by category error:', err);
    return error(res, 'Error retrieving products', 500);
  }
});
