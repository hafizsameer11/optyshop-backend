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

exports.getProductCalibers = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      select: {
        id: true,
        name: true,
        mm_calibers: true
      }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const calibers = product.mm_calibers ? JSON.parse(product.mm_calibers) : [];

    return success(res, 'Product calibers retrieved successfully', calibers);
  } catch (err) {
    console.error('Get product calibers error:', err);
    return error(res, 'Error retrieving product calibers', 500);
  }
});

// Eye Hygiene Variant Management
exports.createEyeHygieneVariant = asyncHandler(async (req, res) => {
  const { product_id, name, description, price, image_url, sort_order } = req.body;

  try {
    const Product = require('../models/Product');
    const EyeHygieneVariant = require('../models/EyeHygieneVariant');
    
    // Check if product exists
    const product = await Product.findByPk(parseInt(product_id));
    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const variant = await EyeHygieneVariant.create({
      product_id: parseInt(product_id),
      name,
      description,
      price: parseFloat(price),
      image_url,
      sort_order: parseInt(sort_order) || 0
    });

    return success(res, 'Eye hygiene variant created successfully', variant, 201);
  } catch (err) {
    console.error('Create eye hygiene variant error:', err);
    return error(res, 'Error creating eye hygiene variant', 500);
  }
});

exports.updateEyeHygieneVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url, is_active, sort_order } = req.body;

  try {
    const EyeHygieneVariant = require('../models/EyeHygieneVariant');
    
    const variant = await EyeHygieneVariant.findByPk(parseInt(id));

    if (!variant) {
      return error(res, 'Eye hygiene variant not found', 404);
    }

    const updateData = {
      name,
      description,
      price: parseFloat(price),
      image_url,
      sort_order: parseInt(sort_order) || 0
    };

    if (is_active !== undefined) {
      updateData.is_active = is_active === 'true' || is_active === true;
    }

    const updatedVariant = await variant.update(updateData);

    return success(res, 'Eye hygiene variant updated successfully', updatedVariant);
  } catch (err) {
    console.error('Update eye hygiene variant error:', err);
    return error(res, 'Error updating eye hygiene variant', 500);
  }
});

exports.deleteEyeHygieneVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const EyeHygieneVariant = require('../models/EyeHygieneVariant');
    
    const variant = await EyeHygieneVariant.findByPk(parseInt(id));

    if (!variant) {
      return error(res, 'Eye hygiene variant not found', 404);
    }

    await variant.destroy();

    return success(res, 'Eye hygiene variant deleted successfully');
  } catch (err) {
    console.error('Delete eye hygiene variant error:', err);
    return error(res, 'Error deleting eye hygiene variant', 500);
  }
});

exports.getEyeHygieneVariants = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  try {
    const EyeHygieneVariant = require('../models/EyeHygieneVariant');
    
    const variants = await EyeHygieneVariant.findAll({
      where: {
        product_id: parseInt(productId),
        is_active: true
      },
      order: [
        ['sort_order', 'ASC']
      ]
    });

    return success(res, 'Eye hygiene variants retrieved successfully', variants);
  } catch (err) {
    console.error('Get eye hygiene variants error:', err);
    return error(res, 'Error retrieving eye hygiene variants', 500);
  }
});


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
        eyeHygieneVariants: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' }
        },
        sizeVolumeVariants: {
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

// @desc    Get product variants for selection
// @route   GET /api/products/:id/variants
// @access  Public
exports.getProductVariants = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { 
        id: parseInt(id),
        is_active: true 
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        color_images: true,
        mm_calibers: true,
        stock_quantity: true,
        stock_status: true,
        eyeHygieneVariants: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
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
          orderBy: { sort_order: 'asc' },
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

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    // Parse JSON fields
    const productData = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      color_images: product.color_images ? JSON.parse(product.color_images) : [],
      mm_calibers: product.mm_calibers ? JSON.parse(product.mm_calibers) : []
    };

    // Format variants for frontend
    const variants = [];

    // Add MM caliber variants
    if (productData.mm_calibers && productData.mm_calibers.length > 0) {
      productData.mm_calibers.forEach((caliber, index) => {
        variants.push({
          id: `caliber_${caliber.mm}`,
          type: 'mm_caliber',
          name: `${caliber.mm}mm`,
          display_name: `${caliber.mm}mm Caliber`,
          price: parseFloat(product.price),
          image_url: caliber.image_url,
          stock_quantity: product.stock_quantity,
          stock_status: product.stock_status,
          sort_order: index,
          metadata: {
            mm: caliber.mm,
            image_url: caliber.image_url
          }
        });
      });
    }

    // Add eye hygiene variants
    if (product.eyeHygieneVariants && product.eyeHygieneVariants.length > 0) {
      product.eyeHygieneVariants.forEach(variant => {
        variants.push({
          id: `eye_hygiene_${variant.id}`,
          type: 'eye_hygiene',
          name: variant.name,
          display_name: variant.name,
          description: variant.description,
          price: parseFloat(variant.price),
          image_url: variant.image_url,
          stock_quantity: product.stock_quantity,
          stock_status: product.stock_status,
          sort_order: variant.sort_order,
          metadata: {
            variant_id: variant.id,
            image_url: variant.image_url
          }
        });
      });
    }

    // Add size/volume variants
    if (product.sizeVolumeVariants && product.sizeVolumeVariants.length > 0) {
      product.sizeVolumeVariants.forEach(variant => {
        variants.push({
          id: `size_volume_${variant.id}`,
          type: 'size_volume',
          name: variant.pack_type ? `${variant.size_volume} ${variant.pack_type}` : variant.size_volume,
          display_name: variant.pack_type ? `${variant.size_volume} ${variant.pack_type}` : variant.size_volume,
          price: parseFloat(variant.price),
          compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          image_url: variant.image_url,
          stock_quantity: variant.stock_quantity,
          stock_status: variant.stock_status,
          sku: variant.sku,
          sort_order: variant.sort_order,
          metadata: {
            variant_id: variant.id,
            size_volume: variant.size_volume,
            pack_type: variant.pack_type,
            sku: variant.sku,
            image_url: variant.image_url
          }
        });
      });
    }

    // Sort variants by sort_order
    variants.sort((a, b) => a.sort_order - b.sort_order);

    return success(res, 'Product variants retrieved successfully', {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        base_price: parseFloat(product.price),
        images: productData.images,
        color_images: productData.color_images
      },
      variants
    });
  } catch (err) {
    console.error('Get product variants error:', err);
    return error(res, 'Error retrieving product variants', 500);
  }
});

// @desc    Get variant details with image
// @route   GET /api/products/:id/variants/:variantId
// @access  Public
exports.getVariantDetails = asyncHandler(async (req, res) => {
  const { id, variantId } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { 
        id: parseInt(id),
        is_active: true 
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        color_images: true,
        mm_calibers: true,
        stock_quantity: true,
        stock_status: true,
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

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    // Parse JSON fields
    const productData = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      color_images: product.color_images ? JSON.parse(product.color_images) : [],
      mm_calibers: product.mm_calibers ? JSON.parse(product.mm_calibers) : []
    };

    let variant = null;

    // Parse variantId to determine type
    if (variantId.startsWith('caliber_')) {
      const mm = variantId.replace('caliber_', '');
      const caliberData = productData.mm_calibers.find(c => c.mm === mm);
      
      if (caliberData) {
        variant = {
          id: variantId,
          type: 'mm_caliber',
          name: `${mm}mm`,
          display_name: `${mm}mm Caliber`,
          price: parseFloat(product.price),
          image_url: caliberData.image_url,
          stock_quantity: product.stock_quantity,
          stock_status: product.stock_status,
          metadata: {
            mm: mm,
            image_url: caliberData.image_url
          }
        };
      }
    } else if (variantId.startsWith('eye_hygiene_')) {
      const variantIdNum = parseInt(variantId.replace('eye_hygiene_', ''));
      const eyeHygieneVariant = product.eyeHygieneVariants.find(v => v.id === variantIdNum);
      
      if (eyeHygieneVariant) {
        variant = {
          id: variantId,
          type: 'eye_hygiene',
          name: eyeHygieneVariant.name,
          display_name: eyeHygieneVariant.name,
          description: eyeHygieneVariant.description,
          price: parseFloat(eyeHygieneVariant.price),
          image_url: eyeHygieneVariant.image_url,
          stock_quantity: product.stock_quantity,
          stock_status: product.stock_status,
          metadata: {
            variant_id: eyeHygieneVariant.id,
            image_url: eyeHygieneVariant.image_url
          }
        };
      }
    } else if (variantId.startsWith('size_volume_')) {
      const variantIdNum = parseInt(variantId.replace('size_volume_', ''));
      const sizeVolumeVariant = product.sizeVolumeVariants.find(v => v.id === variantIdNum);
      
      if (sizeVolumeVariant) {
        variant = {
          id: variantId,
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

    if (!variant) {
      return error(res, 'Variant not found', 404);
    }

    return success(res, 'Variant details retrieved successfully', {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        base_price: parseFloat(product.price),
        images: productData.images,
        color_images: productData.color_images
      },
      variant
    });
  } catch (err) {
    console.error('Get variant details error:', err);
    return error(res, 'Error retrieving variant details', 500);
  }
});

// Eye Hygiene Form Options
exports.getEyeHygieneFormOptions = asyncHandler(async (req, res) => {
  try {
    const { sub_category_id } = req.query;

    // Get subcategory details
    let subCategory = null;
    if (sub_category_id) {
      subCategory = await prisma.subCategory.findUnique({
        where: { id: parseInt(sub_category_id) },
        include: {
          category: true
        }
      });
    }

    // Get eye hygiene products and their variants
    const eyeHygieneProducts = await prisma.product.findMany({
      where: {
        category: {
          name: 'Eye Hygiene'
        },
        is_active: true
      },
      include: {
        sizeVolumeVariants: {
          where: {
            is_active: true,
            stock_status: 'in_stock'
          },
          orderBy: [
            { size_volume: 'asc' },
            { pack_type: 'asc' }
          ]
        },
        subCategory: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Group variants by product
    const productOptions = eyeHygieneProducts.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sub_category: product.subCategory,
      variants: product.sizeVolumeVariants.map(variant => ({
        id: variant.id,
        size_volume: variant.size_volume,
        pack_type: variant.pack_type,
        display_name: variant.pack_type ? 
          `${variant.size_volume} ${variant.pack_type}` : 
          variant.size_volume,
        price: parseFloat(variant.price),
        compare_at_price: variant.compare_at_price ? 
          parseFloat(variant.compare_at_price) : null,
        image_url: variant.image_url,
        sku: variant.sku,
        stock_quantity: variant.stock_quantity,
        stock_status: variant.stock_status
      }))
    })).filter(product => product.variants.length > 0);

    // Get common eye hygiene fields/options
    const commonFields = {
      sizes: [...new Set(
        eyeHygieneProducts.flatMap(p => 
          p.sizeVolumeVariants.map(v => v.size_volume)
        )
      )].sort(),
      pack_types: [...new Set(
        eyeHygieneProducts.flatMap(p => 
          p.sizeVolumeVariants.map(v => v.pack_type).filter(Boolean)
        )
      )].sort(),
      sub_categories: [...new Set(
        eyeHygieneProducts.map(p => p.subCategory).filter(Boolean)
          .map(sc => ({ id: sc.id, name: sc.name }))
      )].sort((a, b) => a.name.localeCompare(b.name))
    };

    return success(res, 'Eye hygiene form options retrieved successfully', {
      sub_category: subCategory,
      products: productOptions,
      common_fields: commonFields,
      total_products: productOptions.length,
      total_variants: productOptions.reduce((sum, p) => sum + p.variants.length, 0)
    });
  } catch (err) {
    console.error('Get eye hygiene form options error:', err);
    return error(res, 'Error retrieving eye hygiene form options', 500);
  }
});
