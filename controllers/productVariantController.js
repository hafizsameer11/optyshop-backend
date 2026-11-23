const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { success, error } = require("../utils/response");

/** Normalize optional mm measurement field to string or null. */
function normMmField(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  return s || null;
}

function caliberComboKey(c) {
  const mm = String(c.mm ?? c.lens_width ?? '');
  return [
    mm,
    String(c.bridge_width ?? c.ponte ?? ''),
    String(c.temple_length ?? c.asta ?? ''),
    String(c.frame_width ?? ''),
  ].join('|');
}

function findCaliberIndex(list, key) {
  // Prefer id match, then legacy mm-only, then combo key
  let idx = list.findIndex((c) => c.id && String(c.id) === String(key));
  if (idx >= 0) return idx;
  idx = list.findIndex((c) => caliberComboKey(c) === String(key));
  if (idx >= 0) return idx;
  const matches = list
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => String(c.mm) === String(key));
  return matches.length === 1 ? matches[0].i : -1;
}

// MM Caliber Management — each row can include Calibro/Ponte/Asta/frame width (multiple per product)
exports.addProductCaliber = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const {
    mm,
    lens_width,
    bridge_width,
    temple_length,
    frame_width,
    ponte,
    asta,
    price,
    stock_quantity,
    image_url,
  } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const lensWidth = normMmField(lens_width) || normMmField(mm);
    if (!lensWidth || Number.isNaN(Number(lensWidth))) {
      return error(res, 'Caliber / lens width (mm) is required and must be a number', 400);
    }

    let currentCalibers = [];
    try {
      currentCalibers = product.mm_calibers
        ? (typeof product.mm_calibers === 'string' ? JSON.parse(product.mm_calibers) : product.mm_calibers)
        : [];
    } catch {
      currentCalibers = [];
    }
    if (!Array.isArray(currentCalibers)) currentCalibers = [];

    const entry = {
      id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      mm: lensWidth,
      lens_width: lensWidth,
      bridge_width: normMmField(bridge_width) || normMmField(ponte),
      temple_length: normMmField(temple_length) || normMmField(asta),
      frame_width: normMmField(frame_width),
      price: price != null && price !== '' && !Number.isNaN(Number(price)) ? Number(price) : null,
      stock_quantity:
        stock_quantity != null && stock_quantity !== '' && !Number.isNaN(Number(stock_quantity))
          ? parseInt(stock_quantity, 10)
          : null,
      image_url: image_url && String(image_url).trim() ? String(image_url).trim() : '',
    };

    if (currentCalibers.some((c) => caliberComboKey(c) === caliberComboKey(entry))) {
      return error(res, 'This size combination already exists', 400);
    }

    currentCalibers.push(entry);

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        mm_calibers: JSON.stringify(currentCalibers)
      }
    });

    return success(res, 'Caliber added successfully', { product: updatedProduct, caliber: entry, calibers: currentCalibers });
  } catch (err) {
    console.error('Add caliber error:', err);
    return error(res, 'Error adding caliber', 500);
  }
});

exports.updateProductCaliber = asyncHandler(async (req, res) => {
  const { productId, mm } = req.params;
  const {
    image_url,
    lens_width,
    bridge_width,
    temple_length,
    frame_width,
    ponte,
    asta,
    price,
    stock_quantity,
    mm: bodyMm,
  } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    let currentCalibers = [];
    try {
      currentCalibers = product.mm_calibers
        ? (typeof product.mm_calibers === 'string' ? JSON.parse(product.mm_calibers) : product.mm_calibers)
        : [];
    } catch {
      currentCalibers = [];
    }
    if (!Array.isArray(currentCalibers)) currentCalibers = [];

    const caliberIndex = findCaliberIndex(currentCalibers, mm);
    if (caliberIndex === -1) {
      return error(res, 'Caliber not found', 404);
    }

    const row = { ...currentCalibers[caliberIndex] };
    if (!row.id) row.id = `cal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (image_url !== undefined) {
      row.image_url = image_url && String(image_url).trim() ? String(image_url).trim() : '';
    }
    const nextLens = normMmField(lens_width) || normMmField(bodyMm);
    if (nextLens) {
      row.mm = nextLens;
      row.lens_width = nextLens;
    }
    if (bridge_width !== undefined || ponte !== undefined) {
      row.bridge_width = normMmField(bridge_width) || normMmField(ponte);
    }
    if (temple_length !== undefined || asta !== undefined) {
      row.temple_length = normMmField(temple_length) || normMmField(asta);
    }
    if (frame_width !== undefined) {
      row.frame_width = normMmField(frame_width);
    }
    if (price !== undefined) {
      row.price = price != null && price !== '' && !Number.isNaN(Number(price)) ? Number(price) : null;
    }
    if (stock_quantity !== undefined) {
      row.stock_quantity =
        stock_quantity != null && stock_quantity !== '' && !Number.isNaN(Number(stock_quantity))
          ? parseInt(stock_quantity, 10)
          : null;
    }

    currentCalibers[caliberIndex] = row;

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        mm_calibers: JSON.stringify(currentCalibers)
      }
    });

    return success(res, 'Caliber updated successfully', { product: updatedProduct, caliber: row, calibers: currentCalibers });
  } catch (err) {
    console.error('Update caliber error:', err);
    return error(res, 'Error updating caliber', 500);
  }
});

exports.deleteProductCaliber = asyncHandler(async (req, res) => {
  const { productId, mm } = req.params;
  const bridgeQ = req.query.bridge_width ?? req.query.ponte;
  const templeQ = req.query.temple_length ?? req.query.asta;
  const frameQ = req.query.frame_width;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    let currentCalibers = [];
    try {
      currentCalibers = product.mm_calibers
        ? (typeof product.mm_calibers === 'string' ? JSON.parse(product.mm_calibers) : product.mm_calibers)
        : [];
    } catch {
      currentCalibers = [];
    }
    if (!Array.isArray(currentCalibers)) currentCalibers = [];

    let filteredCalibers;
    const byIdOrCombo = findCaliberIndex(currentCalibers, mm);
    if (byIdOrCombo >= 0 && (String(currentCalibers[byIdOrCombo].id) === String(mm) || caliberComboKey(currentCalibers[byIdOrCombo]) === String(mm))) {
      filteredCalibers = currentCalibers.filter((_, i) => i !== byIdOrCombo);
    } else if (bridgeQ != null || templeQ != null || frameQ != null) {
      const target = caliberComboKey({
        mm,
        bridge_width: bridgeQ,
        temple_length: templeQ,
        frame_width: frameQ,
      });
      filteredCalibers = currentCalibers.filter((c) => caliberComboKey(c) !== target);
    } else {
      // Legacy: delete all rows with this mm when no extra dims specified
      filteredCalibers = currentCalibers.filter((caliber) => String(caliber.mm) !== String(mm) && String(caliber.id) !== String(mm));
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        mm_calibers: JSON.stringify(filteredCalibers)
      }
    });

    return success(res, 'Caliber deleted successfully', { product: updatedProduct, calibers: filteredCalibers });
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

    let calibers = [];
    try {
      calibers = product.mm_calibers
        ? (typeof product.mm_calibers === 'string' ? JSON.parse(product.mm_calibers) : product.mm_calibers)
        : [];
    } catch {
      calibers = [];
    }
    if (!Array.isArray(calibers)) calibers = [];

    // Ensure lens_width alias for admin/PDP
    calibers = calibers.map((c) => ({
      ...c,
      lens_width: c.lens_width || c.mm || null,
      bridge_width: c.bridge_width || c.ponte || null,
      temple_length: c.temple_length || c.asta || null,
      frame_width: c.frame_width || null,
    }));

    return success(res, 'Product calibers retrieved successfully', calibers);
  } catch (err) {
    console.error('Get product calibers error:', err);
    return error(res, 'Error retrieving product calibers', 500);
  }
});

// Eye Hygiene Variant Management (Prisma)
exports.createEyeHygieneVariant = asyncHandler(async (req, res) => {
  const { product_id, name, description, price, compare_at_price, cost_price, image_url, sort_order, is_active } = req.body;

  try {
    if (!product_id) {
      return error(res, 'product_id is required', 400);
    }
    if (!name || !String(name).trim()) {
      return error(res, 'name is required', 400);
    }
    if (price === undefined || price === null || price === '' || isNaN(parseFloat(price))) {
      return error(res, 'Valid price is required', 400);
    }

    const productIdInt = parseInt(product_id, 10);
    const product = await prisma.product.findUnique({ where: { id: productIdInt } });
    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const variant = await prisma.eyeHygieneVariant.create({
      data: {
        product_id: productIdInt,
        name: String(name).trim(),
        description: description || null,
        price: parseFloat(price),
        compare_at_price:
          compare_at_price !== undefined && compare_at_price !== null && String(compare_at_price).trim() !== ''
            ? parseFloat(compare_at_price)
            : null,
        cost_price:
          cost_price !== undefined && cost_price !== null && String(cost_price).trim() !== ''
            ? parseFloat(cost_price)
            : null,
        image_url: image_url || null,
        sort_order: sort_order !== undefined && sort_order !== null && sort_order !== ''
          ? parseInt(sort_order, 10) || 0
          : 0,
        is_active: is_active === undefined
          ? true
          : (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1')
      }
    });

    return success(res, 'Eye hygiene variant created successfully', variant, 201);
  } catch (err) {
    console.error('Create eye hygiene variant error:', err);
    if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('does not exist')) {
      return error(res, 'EyeHygieneVariant table does not exist. Please run migration: npx prisma migrate deploy', 503);
    }
    return error(res, err.message || 'Error creating eye hygiene variant', 500);
  }
});

exports.updateEyeHygieneVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, compare_at_price, cost_price, image_url, is_active, sort_order } = req.body;

  try {
    const idInt = parseInt(id, 10);
    const existing = await prisma.eyeHygieneVariant.findUnique({ where: { id: idInt } });
    if (!existing) {
      return error(res, 'Eye hygiene variant not found', 404);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = description || null;
    if (price !== undefined && price !== null && price !== '') {
      const p = parseFloat(price);
      if (!isNaN(p)) updateData.price = p;
    }
    if (compare_at_price !== undefined) {
      updateData.compare_at_price =
        compare_at_price !== null && String(compare_at_price).trim() !== ''
          ? parseFloat(compare_at_price)
          : null;
    }
    if (cost_price !== undefined) {
      updateData.cost_price =
        cost_price !== null && String(cost_price).trim() !== '' ? parseFloat(cost_price) : null;
    }
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (sort_order !== undefined && sort_order !== null && sort_order !== '') {
      const s = parseInt(sort_order, 10);
      if (!isNaN(s)) updateData.sort_order = s;
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
    }

    const updatedVariant = await prisma.eyeHygieneVariant.update({
      where: { id: idInt },
      data: updateData
    });

    return success(res, 'Eye hygiene variant updated successfully', updatedVariant);
  } catch (err) {
    console.error('Update eye hygiene variant error:', err);
    if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('does not exist')) {
      return error(res, 'EyeHygieneVariant table does not exist. Please run migration: npx prisma migrate deploy', 503);
    }
    return error(res, err.message || 'Error updating eye hygiene variant', 500);
  }
});

exports.deleteEyeHygieneVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const idInt = parseInt(id, 10);
    const existing = await prisma.eyeHygieneVariant.findUnique({ where: { id: idInt } });
    if (!existing) {
      return error(res, 'Eye hygiene variant not found', 404);
    }

    await prisma.eyeHygieneVariant.delete({ where: { id: idInt } });

    return success(res, 'Eye hygiene variant deleted successfully');
  } catch (err) {
    console.error('Delete eye hygiene variant error:', err);
    if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('does not exist')) {
      return error(res, 'EyeHygieneVariant table does not exist. Please run migration: npx prisma migrate deploy', 503);
    }
    return error(res, err.message || 'Error deleting eye hygiene variant', 500);
  }
});

// Admin: list all variants (active + inactive) for a product
// Public: GET /api/products/:id/size-volume-variants (param is `id`, not `productId`)
exports.getEyeHygieneVariants = asyncHandler(async (req, res) => {
  const rawProductId = req.params.productId ?? req.params.id;
  const { only_active } = req.query;

  try {
    const productId = parseInt(String(rawProductId), 10);
    if (!Number.isFinite(productId) || productId <= 0) {
      return error(res, 'Invalid product id', 400);
    }
    const where = { product_id: productId };
    if (only_active === 'true' || only_active === '1') {
      where.is_active = true;
    }

    const variants = await prisma.eyeHygieneVariant.findMany({
      where,
      orderBy: [{ sort_order: 'asc' }, { id: 'asc' }]
    });

    return success(res, 'Eye hygiene variants retrieved successfully', variants);
  } catch (err) {
    console.error('Get eye hygiene variants error:', err);
    if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('does not exist')) {
      return error(res, 'EyeHygieneVariant table does not exist. Please run migration: npx prisma migrate deploy', 503);
    }
    return error(res, err.message || 'Error retrieving eye hygiene variants', 500);
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

    // Add MM caliber variants (size options only — they carry no image of their own)
    if (productData.mm_calibers && productData.mm_calibers.length > 0) {
      productData.mm_calibers.forEach((caliber, index) => {
        variants.push({
          id: `caliber_${caliber.mm}`,
          type: 'mm_caliber',
          name: `${caliber.mm}mm`,
          display_name: `${caliber.mm}mm Caliber`,
          price: parseFloat(product.price),
          image_url: null,
          stock_quantity: product.stock_quantity,
          stock_status: product.stock_status,
          sort_order: index,
          metadata: {
            mm: caliber.mm
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
