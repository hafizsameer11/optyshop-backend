const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { success, error } = require("../utils/response");
const { uploadToS3, deleteFromS3 } = require("../config/aws");
const csv = require("csv-parser");
const { Readable } = require("stream");
const bcrypt = require('bcryptjs');

// Helper function to get color name from hex code
const getColorNameFromHex = (hexCode) => {
  if (!hexCode || !hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
    return 'Unknown';
  }

  const hex = hexCode.toLowerCase();
  const colorMap = {
    '#000000': 'Black',
    '#ffffff': 'White',
    '#8b4513': 'Brown',
    '#0000ff': 'Blue',
    '#ff0000': 'Red',
    '#008000': 'Green',
    '#808080': 'Gray',
    '#ffd700': 'Gold',
    '#c0c0c0': 'Silver',
    '#800080': 'Purple',
    '#ffa500': 'Orange',
    '#ffc0cb': 'Pink',
    '#ffff00': 'Yellow',
    '#a52a2a': 'Brown',
    '#4b0082': 'Indigo'
  };

  return colorMap[hex] || `Color ${hexCode}`;
};

// Helper function to get hex code from color name (for backward compatibility)
const getHexFromColorName = (colorName) => {
  if (!colorName) return '000000';

  const name = colorName.toLowerCase().trim();
  const colorMap = {
    'black': '000000',
    'white': 'ffffff',
    'brown': '8b4513',
    'blue': '0000ff',
    'red': 'ff0000',
    'green': '008000',
    'gray': '808080',
    'grey': '808080',
    'gold': 'ffd700',
    'silver': 'c0c0c0',
    'purple': '800080',
    'orange': 'ffa500',
    'pink': 'ffc0cb',
    'yellow': 'ffff00',
    'indigo': '4b0082'
  };

  return colorMap[name] || '000000';
};

// Helper function to get hex code from color name (returns with # prefix)
const getColorHexCode = (colorName) => {
  if (!colorName) return null;

  const name = colorName.toLowerCase().trim();
  const colorMap = {
    'black': '#000000',
    'white': '#FFFFFF',
    'brown': '#8B4513',
    'tortoiseshell': '#8B4513',
    'tortoise': '#8B4513',
    'red': '#FF0000',
    'burgundy': '#800020',
    'pink': '#FFC0CB',
    'rose': '#FF69B4',
    'green': '#008000',
    'blue': '#0000FF',
    'purple': '#800080',
    'yellow': '#FFFF00',
    'cream': '#FFFDD0',
    'grey': '#808080',
    'gray': '#808080',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'navy': '#000080',
    'beige': '#F5F5DC',
    'orange': '#FFA500',
    'indigo': '#4B0082'
  };

  return colorMap[name] || null;
};

// ==================== DASHBOARD ====================

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getAllSubCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, category_id, search, type } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (category_id) where.category_id = parseInt(category_id);
  if (search) where.name = { contains: search };

  // Filter by type: 'top-level' or 'nested'
  if (type === 'top-level') {
    where.parent_id = null;
  } else if (type === 'nested') {
    where.parent_id = { not: null };
  }

  const [subcategories, total, topLevelCount, nestedCount] = await Promise.all([
    prisma.subCategory.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            is_active: true
          },
          orderBy: { sort_order: 'asc' }
        }
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { sort_order: 'asc' }
    }),
    prisma.subCategory.count({ where }),
    prisma.subCategory.count({ where: { parent_id: null, ...(category_id ? { category_id: parseInt(category_id) } : {}) } }),
    prisma.subCategory.count({ where: { parent_id: { not: null }, ...(category_id ? { category_id: parseInt(category_id) } : {}) } })
  ]);

  // Ensure parent_id is explicitly included
  const enrichedSubcategories = subcategories.map(sub => ({
    ...sub,
    parent_id: sub.parent_id || null
  }));

  return success(res, "Subcategories retrieved successfully", {
    subcategories: enrichedSubcategories,
    counts: {
      total,
      topLevel: topLevelCount,
      nested: nestedCount
    },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single subcategory (Admin)
// @route   GET /api/admin/subcategories/:id
// @access  Private/Admin
exports.getSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate id parameter exists and is not empty
  if (!id || id === 'undefined' || id === 'null' || (typeof id === 'string' && id.trim() === '')) {
    return error(res, "Subcategory ID is required", 400);
  }

  const subcategoryId = parseInt(String(id), 10);
  if (isNaN(subcategoryId) || subcategoryId <= 0) {
    return error(res, "Invalid subcategory ID. Must be a positive integer", 400);
  }

  // Final validation - ensure subcategoryId is a valid number
  if (typeof subcategoryId !== 'number' || !Number.isInteger(subcategoryId)) {
    return error(res, "Invalid subcategory ID format", 400);
  }

  const subcategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      parent: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      children: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          sort_order: true
        },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  if (!subcategory) {
    return error(res, "Subcategory not found", 404);
  }

  // Ensure parent_id is explicitly included in response
  const responseData = {
    ...subcategory,
    parent_id: subcategory.parent_id || null
  };

  return success(res, "Subcategory retrieved successfully", { subcategory: responseData });
});

// @desc    Get subcategories by parent ID (for nested subcategories dropdown - admin view)
// @route   GET /api/admin/subcategories/by-parent/:parent_id
// @access  Private/Admin
exports.getSubCategoriesByParent = asyncHandler(async (req, res) => {
  const { parent_id } = req.params;

  const parentSubcategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(parent_id) },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!parentSubcategory) {
    return error(res, 'Parent subcategory not found', 404);
  }

  const subcategories = await prisma.subCategory.findMany({
    where: {
      parent_id: parseInt(parent_id)
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      parent: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          is_active: true
        },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: { sort_order: 'asc' }
  });

  // Ensure parent_id is explicitly included
  const enrichedSubcategories = subcategories.map(sub => ({
    ...sub,
    parent_id: sub.parent_id || null
  }));

  return success(res, 'Subcategories retrieved successfully', {
    parentSubcategory: {
      ...parentSubcategory,
      parent_id: parentSubcategory.parent_id || null
    },
    subcategories: enrichedSubcategories
  });
});

// @desc    Get available parent subcategories for a category (for nested subcategory creation)
// @route   GET /api/admin/subcategories/available-parents/:category_id
// @access  Private/Admin
exports.getAvailableParentSubcategories = asyncHandler(async (req, res) => {
  const { category_id } = req.params;
  const { exclude_id } = req.query; // Exclude a subcategory ID (useful when editing)

  const where = {
    category_id: parseInt(category_id),
    parent_id: null, // Only top-level subcategories can be parents
    is_active: true
  };

  // Exclude a specific subcategory (useful when editing to prevent circular references)
  if (exclude_id) {
    where.id = { not: parseInt(exclude_id) };
  }

  const parentSubcategories = await prisma.subCategory.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      category_id: true,
      image: true,
      description: true,
      _count: {
        select: {
          children: true,
          products: true
        }
      }
    },
    orderBy: { sort_order: 'asc' }
  });

  // Format response with "None" option for top-level subcategories
  const formattedParents = [
    {
      id: null,
      name: "None (Top-level subcategory)",
      slug: null,
      category_id: parseInt(category_id),
      image: null,
      description: "Create a top-level subcategory (no parent)",
      children_count: 0,
      products_count: 0
    },
    ...parentSubcategories.map(sub => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      category_id: sub.category_id,
      image: sub.image,
      description: sub.description,
      children_count: sub._count.children,
      products_count: sub._count.products
    }))
  ];

  return success(res, 'Available parent subcategories retrieved successfully', {
    category_id: parseInt(category_id),
    parentSubcategories: formattedParents
  });
});

// @desc    Get top-level subcategories (for admin view - all statuses)
// @route   GET /api/admin/subcategories/top-level
// @access  Private/Admin
exports.getTopLevelSubCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, category_id, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    parent_id: null // Only top-level subcategories
  };

  if (category_id) {
    where.category_id = parseInt(category_id);
  }

  if (search) {
    where.name = { contains: search };
  }

  const [subcategories, total] = await Promise.all([
    prisma.subCategory.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            is_active: true
          },
          orderBy: { sort_order: 'asc' }
        },
        _count: {
          select: {
            children: true
          }
        }
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { sort_order: 'asc' }
    }),
    prisma.subCategory.count({ where })
  ]);

  // Ensure parent_id is explicitly included
  const enrichedSubcategories = subcategories.map(sub => ({
    ...sub,
    parent_id: sub.parent_id || null
  }));

  return success(res, 'Top-level subcategories retrieved successfully', {
    subcategories: enrichedSubcategories,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get nested subcategories (for admin view - all statuses)
// @route   GET /api/admin/subcategories/nested
// @access  Private/Admin
exports.getNestedSubCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, category_id, parent_id, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    parent_id: { not: null } // Only nested subcategories
  };

  if (category_id) {
    where.category_id = parseInt(category_id);
  }

  if (parent_id) {
    where.parent_id = parseInt(parent_id);
  }

  if (search) {
    where.name = { contains: search };
  }

  const [subcategories, total] = await Promise.all([
    prisma.subCategory.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        parent: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            is_active: true
          },
          orderBy: { sort_order: 'asc' }
        }
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { sort_order: 'asc' }
    }),
    prisma.subCategory.count({ where })
  ]);

  // Ensure parent_id is explicitly included
  const enrichedSubcategories = subcategories.map(sub => ({
    ...sub,
    parent_id: sub.parent_id || null
  }));

  return success(res, 'Nested subcategories retrieved successfully', {
    subcategories: enrichedSubcategories,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

exports.createSubCategory = asyncHandler(async (req, res) => {
  const { name, category_id, parent_id, parent_subcategory_id, description, is_active, sort_order, slug } = req.body;

  // Debug logging
  console.log('📥 Create SubCategory Request:', {
    name,
    category_id,
    parent_id,
    parent_subcategory_id,
    parent_id_type: typeof parent_id, // Note: typeof null === 'object' (JavaScript quirk)
    parent_subcategory_id_type: typeof parent_subcategory_id,
    is_parent_id_null: parent_id === null,
    will_be_top_level: parent_id === null || parent_id === undefined || parent_id === ''
  });

  if (!name || !category_id) {
    return error(res, "Name and Category ID are required", 400);
  }

  const categoryId = parseInt(category_id, 10);
  if (isNaN(categoryId)) {
    return error(res, "Invalid Category ID", 400);
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  });
  if (!category) {
    return error(res, `Category with ID ${categoryId} not found. Please create the category first.`, 404);
  }

  console.log(`✅ Category found: ${category.name} (ID: ${categoryId})`);

  // Handle parent subcategory (for nested subcategories)
  let parentSubcategoryId = null;

  // Handle parent subcategory (for nested subcategories)
  // Accept both parent_id and parent_subcategory_id for flexibility
  // Frontend sends null, "null", empty string, or no field for top-level subcategories
  const parentIdValue = parent_id !== undefined ? parent_id : parent_subcategory_id;

  // Check if we have a valid parent ID
  // Treat null, undefined, empty string, "null" string, or 0 as "no parent" (top-level)
  const hasParent = parentIdValue !== undefined &&
    parentIdValue !== null &&
    parentIdValue !== '' &&
    String(parentIdValue).toLowerCase() !== 'null' &&
    String(parentIdValue).trim() !== '' &&
    parentIdValue !== 0;

  if (hasParent) {

    const parsedParentId = parseInt(String(parentIdValue).trim(), 10);
    if (isNaN(parsedParentId) || parsedParentId <= 0) {
      return error(res, `Invalid Parent Subcategory ID: "${parentIdValue}". Must be a positive integer.`, 400);
    }

    parentSubcategoryId = parsedParentId;

    // Verify parent subcategory exists
    const parentSubcategory = await prisma.subCategory.findUnique({
      where: { id: parentSubcategoryId },
      include: {
        category: {
          select: { id: true, name: true }
        }
      }
    });

    if (!parentSubcategory) {
      return error(res, `Parent subcategory with ID ${parentSubcategoryId} not found`, 404);
    }

    // Verify parent subcategory belongs to the same category
    if (parentSubcategory.category_id !== categoryId) {
      return error(res, `Parent subcategory must belong to the same category. Parent belongs to "${parentSubcategory.category.name}" (ID: ${parentSubcategory.category_id}), but you selected category ID ${categoryId}`, 400);
    }

    // Verify parent subcategory is top-level (parent_id must be null)
    if (parentSubcategory.parent_id !== null) {
      return error(res, `Parent subcategory must be a top-level subcategory (parent_id must be null). The selected subcategory "${parentSubcategory.name}" is itself a sub-subcategory.`, 400);
    }

    console.log(`✅ Parent subcategory found: ${parentSubcategory.name} (ID: ${parentSubcategoryId})`);
  } else {
    console.log(`ℹ️  Creating top-level subcategory (no parent)`);
  }

  // Handle slug - use provided slug or generate from name
  let finalSlug;
  if (slug && slug.trim()) {
    // Use provided slug, sanitize it
    finalSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!finalSlug) {
      return error(res, "Invalid slug provided", 400);
    }
  } else {
    // Generate slug from name
    finalSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // Check if subcategory with same name and parent_id exists (allows duplicates under different parents)
  const existingByName = await prisma.subCategory.findFirst({
    where: {
      name: name,
      parent_id: parentSubcategoryId
    }
  });
  if (existingByName) {
    return error(res, `Subcategory with name "${name}" already exists under this parent subcategory`, 400);
  }

  let imageUrl = null;
  if (req.file) {
    imageUrl = await uploadToS3(req.file, "subcategories");
  }

  // Double-check category exists right before create (defensive check)
  const categoryExists = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true }
  });

  if (!categoryExists) {
    return error(res, `Category with ID ${categoryId} does not exist in the database. Please create the category first.`, 404);
  }

  try {
    console.log(`📝 Creating subcategory:`);
    console.log(`   - Name: ${name}`);
    console.log(`   - Category ID: ${categoryId}`);
    console.log(`   - Parent ID: ${parentSubcategoryId} (${parentSubcategoryId ? 'NESTED' : 'TOP-LEVEL'})`);

    const createData = {
      name,
      slug: finalSlug,
      category_id: categoryId,
      parent_id: parentSubcategoryId !== null ? parentSubcategoryId : null, // Explicitly set parent_id (null for top-level, number for nested)
      description,
      is_active: is_active === 'true' || is_active === true,
      sort_order: parseInt(sort_order, 10) || 0,
      image: imageUrl
    };

    console.log(`📦 Create data:`, JSON.stringify(createData, null, 2));

    const subcategory = await prisma.subCategory.create({
      data: createData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            is_active: true
          },
          orderBy: { sort_order: 'asc' }
        }
      }
    });

    // Verify the subcategory was created with correct parent_id by re-fetching
    const verifySubcategory = await prisma.subCategory.findUnique({
      where: { id: subcategory.id },
      select: { id: true, parent_id: true, name: true }
    });

    console.log(`✅ Subcategory created: ${subcategory.name} (ID: ${subcategory.id})`);
    console.log(`   - parent_id from create response: ${subcategory.parent_id ?? 'null'}`);
    console.log(`   - parent_id from verification query: ${verifySubcategory?.parent_id ?? 'null'}`);
    console.log(`   - Expected parent_id: ${parentSubcategoryId ?? 'null'}`);

    // Ensure parent_id is explicitly included in response
    // Use the verified parent_id to ensure accuracy
    const responseData = {
      ...subcategory,
      parent_id: verifySubcategory?.parent_id !== undefined
        ? verifySubcategory.parent_id
        : (subcategory.parent_id !== undefined ? subcategory.parent_id : parentSubcategoryId)
    };

    console.log(`   - parent_id in final response: ${responseData.parent_id ?? 'null'}`);

    return success(res, parentSubcategoryId ? "Nested subcategory created successfully" : "Subcategory created successfully", { subcategory: responseData }, 201);
  } catch (createError) {
    console.error('❌ Subcategory creation error:', createError);
    console.error('   - Error code:', createError.code);
    console.error('   - Error message:', createError.message);
    console.error('   - Create data that failed:', JSON.stringify(createData, null, 2));

    // Check if it's a unique constraint error (P2002) - only for name, slug uniqueness is allowed
    if (createError.code === 'P2002') {
      const target = createError.meta?.target;
      // Only handle name constraint errors, not slug (slug duplicates are allowed)
      if (Array.isArray(target) && target.includes('name') && !target.includes('slug')) {
        return error(res, `Subcategory with name "${name}" already exists under this parent subcategory`, 400);
      }
      // If it's a slug constraint error, it means the database migration hasn't been applied yet
      // Slug duplicates are now allowed, but the database constraint needs to be removed
      if (Array.isArray(target) && target.includes('slug')) {
        console.error('⚠️  Database migration required: The slug unique constraint still exists in the database.');
        console.error('   Run this SQL command: DROP INDEX subcategories_slug_parent_id_key ON subcategories;');
        console.error('   Or run: npx prisma migrate deploy');
        return error(res, `Database migration required: The slug unique constraint still exists. Please run the migration to remove it: DROP INDEX subcategories_slug_parent_id_key ON subcategories;`, 500);
      }
    }

    // Check if it's a foreign key constraint error
    if (createError.code === 'P2003' || createError.message?.includes('Foreign key constraint')) {
      // Check if it's a parent_id constraint error
      if (createError.meta?.field_name === 'parent_id' || createError.message?.includes('parent_id')) {
        return error(res, `Parent subcategory with ID ${parentSubcategoryId} not found or invalid. Please ensure the parent subcategory exists.`, 400);
      }

      // One more verification - maybe category was deleted between checks?
      const categoryCheck = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true }
      });

      if (!categoryCheck) {
        return error(res, `Category with ID ${categoryId} was not found. The category may have been deleted.`, 404);
      }

      return error(res, `Failed to create subcategory. Foreign key constraint violation. Please ensure category ID ${categoryId} exists and try again.`, 400);
    }

    // Re-throw other errors to be handled by asyncHandler
    throw createError;
  }
});

exports.updateSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category_id, parent_id, parent_subcategory_id, description, is_active, sort_order, slug: newSlug } = req.body;

  const subcategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(id) },
    include: {
      children: {
        select: { id: true }
      }
    }
  });

  if (!subcategory) {
    return error(res, "Subcategory not found", 404);
  }

  const data = {};
  if (name) {
    data.name = name;
    // Check if name is already in use under the same parent (if updating parent_id, check new parent)
    const currentParentId = parent_id !== undefined ? (parent_id ? parseInt(parent_id) : null) :
      (parent_subcategory_id !== undefined ? (parent_subcategory_id ? parseInt(parent_subcategory_id) : null) : subcategory.parent_id);
    const existingByName = await prisma.subCategory.findFirst({
      where: {
        name: name,
        parent_id: currentParentId
      }
    });
    if (existingByName && existingByName.id !== parseInt(id)) {
      return error(res, `Subcategory with name "${name}" already exists under this parent subcategory`, 400);
    }
  }

  // Handle slug update
  if (newSlug !== undefined) {
    if (newSlug && newSlug.trim() && newSlug !== subcategory.slug) {
      // Sanitize the slug
      const sanitizedSlug = newSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!sanitizedSlug) {
        return error(res, "Invalid slug provided", 400);
      }

      data.slug = sanitizedSlug;
    } else if (!newSlug || !newSlug.trim()) {
      // If slug is empty, generate from name
      if (name) {
        data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    }
  }

  // Determine the category ID (use new one if provided, otherwise keep existing)
  const finalCategoryId = category_id ? parseInt(category_id, 10) : subcategory.category_id;

  if (category_id) {
    const categoryId = parseInt(category_id, 10);
    if (isNaN(categoryId)) {
      return error(res, "Invalid Category ID", 400);
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category) {
      return error(res, `Category with ID ${categoryId} not found`, 404);
    }

    data.category_id = categoryId;
  }

  // Handle parent_id (for nested subcategories)
  if (parent_id !== undefined || parent_subcategory_id !== undefined) {
    // If explicitly set to null or empty string, remove parent (make it top-level)
    if (parent_id === null || parent_id === '' || parent_id === 'null' ||
      parent_subcategory_id === null || parent_subcategory_id === '' || parent_subcategory_id === 'null') {
      data.parent_id = null;
    } else {
      const parentSubcategoryId = parseInt(parent_id || parent_subcategory_id, 10);
      if (isNaN(parentSubcategoryId)) {
        return error(res, "Invalid Parent Subcategory ID", 400);
      }

      // Prevent setting itself as parent
      if (parentSubcategoryId === parseInt(id)) {
        return error(res, "Subcategory cannot be its own parent", 400);
      }

      // Prevent converting a parent subcategory (with children) into a sub-subcategory
      if (subcategory.children && subcategory.children.length > 0) {
        return error(res, `Cannot convert this subcategory to a sub-subcategory because it has ${subcategory.children.length} child subcategory(ies). Please remove or reassign the children first.`, 400);
      }

      // Prevent circular references (check if parent is a child of this subcategory)
      const isCircular = await checkCircularReference(parseInt(id), parentSubcategoryId);
      if (isCircular) {
        return error(res, "Cannot set parent: would create circular reference", 400);
      }

      // Verify parent subcategory exists
      const parentSubcategory = await prisma.subCategory.findUnique({
        where: { id: parentSubcategoryId }
      });

      if (!parentSubcategory) {
        return error(res, `Parent subcategory with ID ${parentSubcategoryId} not found`, 404);
      }

      // Verify parent subcategory belongs to the same category
      if (parentSubcategory.category_id !== finalCategoryId) {
        return error(res, `Parent subcategory must belong to the same category (Category ID: ${finalCategoryId})`, 400);
      }

      // Verify parent subcategory is top-level (parent_id must be null)
      if (parentSubcategory.parent_id !== null) {
        return error(res, `Parent subcategory must be a top-level subcategory. The selected subcategory "${parentSubcategory.name}" is itself a sub-subcategory and cannot be used as a parent.`, 400);
      }

      data.parent_id = parentSubcategoryId;
    }
  }

  if (description !== undefined) data.description = description;
  if (is_active !== undefined) data.is_active = is_active === 'true' || is_active === true;
  if (sort_order !== undefined) data.sort_order = parseInt(sort_order);

  if (req.file) {
    if (subcategory.image) {
      await deleteFromS3(subcategory.image);
    }
    data.image = await uploadToS3(req.file, "subcategories");
  }

  // Only update if there's data to update
  if (Object.keys(data).length === 0) {
    // No changes, return current subcategory
    const currentSubcategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            is_active: true
          },
          orderBy: { sort_order: 'asc' }
        }
      }
    });

    const responseData = {
      ...currentSubcategory,
      parent_id: currentSubcategory.parent_id || null
    };

    return success(res, "Subcategory retrieved successfully (no changes)", { subcategory: responseData });
  }

  const updatedSubCategory = await prisma.subCategory.update({
    where: { id: parseInt(id) },
    data,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      parent: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          is_active: true
        },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  // Ensure parent_id is explicitly included in response
  const responseData = {
    ...updatedSubCategory,
    parent_id: updatedSubCategory.parent_id || null
  };

  const message = updatedSubCategory.parent_id
    ? "Nested subcategory updated successfully"
    : "Top-level subcategory updated successfully";

  return success(res, message, { subcategory: responseData });
});

// Helper function to check for circular references in subcategory hierarchy
async function checkCircularReference(subcategoryId, potentialParentId) {
  let currentParentId = potentialParentId;
  const visited = new Set([subcategoryId]); // Start with the subcategory itself

  // Traverse up the parent chain
  while (currentParentId) {
    if (visited.has(currentParentId)) {
      return true; // Circular reference detected
    }
    visited.add(currentParentId);

    const parent = await prisma.subCategory.findUnique({
      where: { id: currentParentId },
      select: { parent_id: true }
    });

    if (!parent || !parent.parent_id) {
      break; // Reached top level
    }

    currentParentId = parent.parent_id;
  }

  return false; // No circular reference
}

exports.deleteSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subcategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      parent: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      children: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          children: true,
          products: true
        }
      }
    }
  });

  if (!subcategory) {
    return error(res, "Subcategory not found", 404);
  }

  // Check if subcategory has children (nested subcategories)
  if (subcategory._count.children > 0) {
    // When deleting, children's parent_id will be set to null (top-level) due to onDelete: SetNull
    // This is handled by the database schema, but we can inform the admin
    console.log(`⚠️  Deleting subcategory with ${subcategory._count.children} children. Children will become top-level subcategories.`);
  }

  // Check if subcategory has products
  if (subcategory._count.products > 0) {
    return error(res, `Cannot delete subcategory: It has ${subcategory._count.products} associated product(s). Please remove or reassign products first.`, 400);
  }

  // Delete image from S3 if exists
  if (subcategory.image) {
    await deleteFromS3(subcategory.image);
  }

  // Delete the subcategory
  // Note: Children's parent_id will be automatically set to null due to schema's onDelete: SetNull
  await prisma.subCategory.delete({
    where: { id: parseInt(id) }
  });

  const responseMessage = subcategory.parent_id
    ? "Nested subcategory deleted successfully"
    : "Top-level subcategory deleted successfully";

  return success(res, responseMessage, {
    deleted: {
      id: subcategory.id,
      name: subcategory.name,
      slug: subcategory.slug,
      wasNested: !!subcategory.parent_id,
      childrenCount: subcategory._count.children
    }
  });
});

// @desc    Get dashboard statistics
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const rangeDays = parseInt(req.query.range || req.query.range_days || 30, 10);
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - rangeDays);
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - rangeDays);

  const lastYearStart = new Date(now);
  lastYearStart.setMonth(now.getMonth() - 11);
  lastYearStart.setDate(1);

  const growthRate = (current, previous) => {
    if (!previous || previous === 0) return null;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  };

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    paidOrdersCurrent,
    paidOrdersPrevious,
    ordersByStatus,
    recentOrders,
    paidOrdersLastYear,
    lensOrderItems,
    topSellingGroups,
    productBasics,
    totalRevenueAggregate,
    prescriptionAverages,
    prescriptionsForTrend,
    pendingCustomizations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: {
        payment_status: "paid",
        created_at: { gte: currentPeriodStart },
      },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: {
        payment_status: "paid",
        created_at: { gte: previousPeriodStart, lt: currentPeriodStart },
      },
      select: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      where: {
        payment_status: "paid",
        created_at: { gte: lastYearStart },
      },
      select: {
        total: true,
        created_at: true,
      },
    }),
    prisma.orderItem.findMany({
      where: {
        order: { payment_status: "paid" },
        product: { lens_type: { not: null } },
      },
      select: {
        quantity: true,
        product: { select: { lens_type: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["product_id"],
      where: { order: { payment_status: "paid" } },
      _sum: { total_price: true, quantity: true },
      orderBy: { _sum: { total_price: "desc" } },
      take: 4,
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        lens_type: true,
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { payment_status: "paid" },
    }),
    prisma.prescription.aggregate({
      _avg: {
        pd_binocular: true,
        ph_od: true,
        ph_os: true,
      },
    }),
    prisma.prescription.findMany({
      where: { created_at: { gte: lastYearStart } },
      select: {
        created_at: true,
        pd_binocular: true,
        ph_od: true,
        ph_os: true,
      },
    }),
    prisma.orderItem.count({
      where: {
        customization: { not: null },
        order: { status: "pending" },
      },
    }),
  ]);

  const revenueCurrent = paidOrdersCurrent.reduce(
    (sum, order) => sum + parseFloat(order.total),
    0
  );
  const revenuePrevious = paidOrdersPrevious.reduce(
    (sum, order) => sum + parseFloat(order.total),
    0
  );
  const totalRevenue = totalRevenueAggregate._sum.total
    ? parseFloat(totalRevenueAggregate._sum.total.toFixed(2))
    : 0;

  const monthlyRevenue = Array(12).fill(0);
  paidOrdersLastYear.forEach((order) => {
    const monthDiff =
      (now.getFullYear() - order.created_at.getFullYear()) * 12 +
      (now.getMonth() - order.created_at.getMonth());
    if (monthDiff >= 0 && monthDiff < 12) {
      const index = 11 - monthDiff; // oldest at 0, newest at 11
      monthlyRevenue[index] += parseFloat(order.total);
    }
  });

  const lensTypeDistribution = lensOrderItems.reduce((acc, item) => {
    const lensType = item.product?.lens_type || "unknown";
    if (!acc[lensType]) acc[lensType] = { lensType, orders: 0, quantity: 0 };
    acc[lensType].orders += 1;
    acc[lensType].quantity += item.quantity || 0;
    return acc;
  }, {});

  const topLensType =
    Object.values(lensTypeDistribution).sort(
      (a, b) => b.orders - a.orders
    )[0] || null;

  const productMap = productBasics.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});

  const topSellingFrames = topSellingGroups.map((group) => ({
    product_id: group.product_id,
    name: productMap[group.product_id]?.name || undefined,
    lens_type: productMap[group.product_id]?.lens_type || null,
    revenue: parseFloat(group._sum.total_price || 0),
    quantity: group._sum.quantity || 0,
  }));

  const pdAverage = prescriptionAverages._avg.pd_binocular
    ? parseFloat(prescriptionAverages._avg.pd_binocular.toFixed(2))
    : null;
  const phAverageRaw = [];
  if (prescriptionAverages._avg.ph_od !== null)
    phAverageRaw.push(prescriptionAverages._avg.ph_od);
  if (prescriptionAverages._avg.ph_os !== null)
    phAverageRaw.push(prescriptionAverages._avg.ph_os);
  const hpAverage = phAverageRaw.length
    ? parseFloat(
      (
        phAverageRaw.reduce((s, v) => s + parseFloat(v), 0) /
        phAverageRaw.length
      ).toFixed(2)
    )
    : null;

  const pdHpTrend = Array(12)
    .fill(null)
    .map((_, idx) => {
      const date = new Date(lastYearStart);
      date.setMonth(lastYearStart.getMonth() + idx);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      return { month: key, pdTotal: 0, pdCount: 0, hpTotal: 0, hpCount: 0 };
    });

  prescriptionsForTrend.forEach((item) => {
    const monthDiff =
      (item.created_at.getFullYear() - lastYearStart.getFullYear()) * 12 +
      (item.created_at.getMonth() - lastYearStart.getMonth());
    if (monthDiff >= 0 && monthDiff < 12) {
      const bucket = pdHpTrend[monthDiff];
      const pd = item.pd_binocular ? parseFloat(item.pd_binocular) : null;
      const hpVals = [];
      if (item.ph_od !== null) hpVals.push(parseFloat(item.ph_od));
      if (item.ph_os !== null) hpVals.push(parseFloat(item.ph_os));
      const hp = hpVals.length
        ? hpVals.reduce((s, v) => s + v, 0) / hpVals.length
        : null;

      if (pd !== null) {
        bucket.pdTotal += pd;
        bucket.pdCount += 1;
      }
      if (hp !== null) {
        bucket.hpTotal += hp;
        bucket.hpCount += 1;
      }
    }
  });

  const stats = {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    ordersByStatus: ordersByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    })),
    recentOrders,
    cards: {
      orders: {
        value: paidOrdersCurrent.length,
        growth: growthRate(paidOrdersCurrent.length, paidOrdersPrevious.length),
      },
      revenue: {
        value: parseFloat(revenueCurrent.toFixed(2)),
        growth: growthRate(revenueCurrent, revenuePrevious),
      },
      average_pd: pdAverage,
      average_hp: hpAverage,
      top_lens_type: topLensType,
      total_users: totalUsers,
      pending_customizations: pendingCustomizations,
    },
    revenueAnalytics: {
      months: monthlyRevenue.map((value, idx) => {
        const date = new Date(lastYearStart);
        date.setMonth(lastYearStart.getMonth() + idx);
        return {
          month: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`,
          revenue: parseFloat(value.toFixed(2)),
        };
      }),
    },
    ordersOverview: ordersByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    })),
    lensTypeDistribution: Object.values(lensTypeDistribution),
    pdHpAnalytics: {
      average_pd: pdAverage,
      average_hp: hpAverage,
      trend: pdHpTrend.map((entry) => ({
        month: entry.month,
        pd: entry.pdCount
          ? parseFloat((entry.pdTotal / entry.pdCount).toFixed(2))
          : null,
        hp: entry.hpCount
          ? parseFloat((entry.hpTotal / entry.hpCount).toFixed(2))
          : null,
        samples: Math.max(entry.pdCount, entry.hpCount),
      })),
    },
    topSellingFrames: topSellingFrames,
    pendingCustomizations,
  };

  return success(res, "Dashboard stats retrieved", { stats });
});

// ==================== PRODUCTS ====================

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search,
    category_id,
    sub_category_id,
    is_active,
    product_type,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    const searchTerm = search.trim(); // Remove leading/trailing spaces
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { not: null, contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
  }

  if (category_id) {
    where.category_id = parseInt(category_id);
  }

  if (sub_category_id) {
    where.sub_category_id = parseInt(sub_category_id);
  }

  if (product_type) {
    // Validate product_type against enum values
    const validProductTypes = ['frame', 'sunglasses', 'contact_lens', 'eye_hygiene'];
    const normalizedType = product_type.toLowerCase().trim();
    if (validProductTypes.includes(normalizedType)) {
      where.product_type = normalizedType;
    }
  }

  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  // Validate sortBy field - only allow valid product fields
  const validSortFields = [
    'id', 'name', 'slug', 'sku', 'price', 'stock_quantity',
    'created_at', 'updated_at', 'rating', 'view_count',
    'is_active', 'is_featured', 'category_id'
  ];
  const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase())
    ? sortOrder.toLowerCase()
    : 'desc';

  // Build include object - conditionally include sizeVolumeVariants if table exists
  const includeObject = {
    category: {
      select: {
        id: true,
        name: true,
        slug: true
      }
    },
    subCategory: {
      select: {
        id: true,
        name: true,
        slug: true
      }
    }
  };

  // Try to include sizeVolumeVariants if the table exists (migration has been run)
  // If table doesn't exist, Prisma will throw an error, so we'll catch it and retry without it
  let products, total;
  try {
    [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          ...includeObject,
          sizeVolumeVariants: {
            orderBy: [
              { sort_order: 'asc' },
              { size_volume: 'asc' },
              { pack_type: 'asc' }
            ]
          }
        },
        take: parseInt(limit),
        skip: skip,
        orderBy: { [validSortBy]: validSortOrder }
      }),
      prisma.product.count({ where })
    ]);
  } catch (err) {
    // If error is about missing table/model, retry without sizeVolumeVariants
    if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
      console.warn('⚠️  ProductSizeVolume table does not exist yet. Run migration: npx prisma migrate dev');
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: includeObject,
          take: parseInt(limit),
          skip: skip,
          orderBy: { [validSortBy]: validSortOrder }
        }),
        prisma.product.count({ where })
      ]);
    } else {
      // Re-throw other errors
      throw err;
    }
  }

  // Helper function to get hex code from color name
  const getColorHexCode = (colorName) => {
    if (!colorName) return null;

    const colorMap = {
      'black': '#000000',
      'white': '#FFFFFF',
      'brown': '#8B4513',
      'tortoiseshell': '#8B4513',
      'tortoise': '#8B4513',
      'red': '#FF0000',
      'burgundy': '#800020',
      'pink': '#FFC0CB',
      'rose': '#FF69B4',
      'green': '#008000',
      'blue': '#0000FF',
      'purple': '#800080',
      'yellow': '#FFFF00',
      'cream': '#FFFDD0',
      'grey': '#808080',
      'gray': '#808080',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'navy': '#000080',
      'beige': '#F5F5DC'
    };

    const normalized = colorName.toLowerCase().trim();
    return colorMap[normalized] || null;
  };

  // Helper function to format product media
  const formatProductMedia = (product) => {
    // Format images - parse JSON string to array
    let images = product.images;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        console.error(`Error parsing images for product ${product.id}:`, e);
        images = [];
      }
    }
    if (!Array.isArray(images)) {
      images = images ? [images] : [];
    }

    // Format color_images - parse JSON string to array
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

    // Create colors array for frontend color swatches with variant name and price
    // Support both new format (hexCode) and old format (color) for backward compatibility
    const colors = colorImages.map((colorData, index) => {
      const hexCode = colorData.hexCode || colorData.hex_code || (colorData.color ? getColorHexCode(colorData.color) : null) || '#000000';
      const colorName = colorData.name || (colorData.color ? getColorNameFromHex(hexCode) : null) || `Color ${index + 1}`;

      return {
        name: colorName,
        display_name: colorData.display_name || colorName,
        value: hexCode, // Use hex code as value for matching
        hexCode: hexCode, // Hex code for color picker
        price: colorData.price !== undefined && colorData.price !== null ? parseFloat(colorData.price) : null, // Variant-specific price
        images: Array.isArray(colorData.images) ? colorData.images : (colorData.images ? [colorData.images] : []),
        primaryImage: Array.isArray(colorData.images) && colorData.images.length > 0
          ? colorData.images[0]
          : (colorData.images || null)
      };
    });

    // Determine default/selected color
    const defaultColor = colors.length > 0 ? colors[0].value : null;
    const currentImages = defaultColor && colors.length > 0
      ? colors[0].images.length > 0
        ? colors[0].images
        : images
      : images;

    // Get first image URL for easy access in frontend
    const firstImage = currentImages && currentImages.length > 0 ? currentImages[0] : (images && images.length > 0 ? images[0] : null);

    // Get current variant price (from selected color, or base product price)
    const currentVariantPrice = defaultColor && colors.length > 0 && colors[0].price !== null
      ? colors[0].price
      : parseFloat(product.price);

    return {
      ...product,
      images,
      // Add first image URL for easy access in frontend
      image: firstImage,
      // Also add thumbnail for backward compatibility
      thumbnail: firstImage,
      color_images: colorImages,
      colors: colors, // Array of color objects for swatches with name, display_name, price
      selectedColor: defaultColor, // Default selected color value
      currentVariantPrice: currentVariantPrice, // Current variant price (or base price)
      model_3d_url: product.model_3d_url || null
    };
  };

  // Ensure images are properly formatted (handle JSON strings)
  const formattedProducts = products.map(formatProductMedia);

  return success(res, "Products retrieved successfully", {
    products: formattedProducts,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ==================== SECTION-SPECIFIC PRODUCT ENDPOINTS ====================

// Helper function to get products by section
const getAllProductsBySection = (productType) => {
  return asyncHandler(async (req, res) => {
    req.query.product_type = productType;
    return exports.getAllProducts(req, res);
  });
};

// @desc    Get all sunglasses products (Admin)
// @route   GET /api/admin/products/section/sunglasses
// @access  Private/Admin
exports.getSunglassesProducts = getAllProductsBySection('sunglasses');

// @desc    Get all eyeglasses products (Admin)
// @route   GET /api/admin/products/section/eyeglasses
// @access  Private/Admin
exports.getEyeglassesProducts = getAllProductsBySection('frame');

// @desc    Get all contact lenses products (Admin)
// @route   GET /api/admin/products/section/contact-lenses
// @access  Private/Admin
exports.getContactLensesProducts = getAllProductsBySection('contact_lens');

// @desc    Get all eye hygiene products (Admin)
// @route   GET /api/admin/products/section/eye-hygiene
// @access  Private/Admin
exports.getEyeHygieneProducts = getAllProductsBySection('eye_hygiene');

// @desc    Get single product (Admin)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
exports.getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Build include object - conditionally include sizeVolumeVariants if table exists
  const includeObject = {
    category: true,
    subCategory: true,
    variants: true,
    frameSizes: true,
    lensTypes: {
      include: {
        lensType: true
      }
    },
    lensCoatings: {
      include: {
        lensCoating: true
      }
    }
  };

  // Try to include sizeVolumeVariants if the table exists
  let product;
  try {
    product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        ...includeObject,
        sizeVolumeVariants: {
          orderBy: [
            { sort_order: 'asc' },
            { size_volume: 'asc' },
            { pack_type: 'asc' }
          ]
        }
      }
    });
  } catch (err) {
    // If error is about missing table/model, retry without sizeVolumeVariants
    if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
      console.warn('⚠️  ProductSizeVolume table does not exist yet. Run migration: npx prisma migrate dev');
      product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: includeObject
      });
    } else {
      // Re-throw other errors
      throw err;
    }
  }

  if (!product) {
    return error(res, "Product not found", 404);
  }

  // Format images - parse JSON string to array
  let images = product.images;
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = [];
    }
  }
  if (!Array.isArray(images)) {
    images = images ? [images] : [];
  }

  // Format color_images - parse JSON string to array
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

  const formattedProduct = {
    ...product,
    images,
    image: images && images.length > 0 ? images[0] : null,
    color_images: colorImages,
    model_3d_url: product.model_3d_url || null
  };

  return success(res, "Product retrieved successfully", { product: formattedProduct });
});

// @desc    Create product (Admin)
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
  try {
    console.log('📦 Creating product - Request received');
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

    const productData = { ...req.body };

    // Handle images with color codes
    // New approach: Upload multiple images, each with its own hex color code
    // Format 1: JSON body with images_with_colors array: [{"hexCode": "#000000", "imageUrl": "url1"}, ...]
    // Format 2: Files with pattern: image_#000000, image_#FFD700 (each can have multiple files)
    // Format 3: images array + image_colors array (parallel arrays mapping images to colors)

    let generalImages = [];
    const colorImagesMap = {};

    // Handle general images (without color codes) - these go to main images array
    if (req.files && req.files.images) {
      try {
        const uploadPromises = req.files.images.map(file => uploadToS3(file, "products"));
        const imageUrls = await Promise.all(uploadPromises);
        generalImages = imageUrls;
        productData.images = imageUrls; // Keep as array, will be normalized later
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return error(res, `Image upload failed: ${uploadError.message}`, 500);
      }
    }

    // Handle images with color codes from JSON body
    if (req.body.images_with_colors) {
      try {
        let imagesWithColors = [];
        if (typeof req.body.images_with_colors === 'string') {
          imagesWithColors = JSON.parse(req.body.images_with_colors);
        } else if (Array.isArray(req.body.images_with_colors)) {
          imagesWithColors = req.body.images_with_colors;
        }

        // Group images by hex code
        imagesWithColors.forEach(item => {
          const hexCode = item.hexCode || item.hex_code;
          if (hexCode && hexCode.match(/^#[0-9A-Fa-f]{6}$/) && item.imageUrl) {
            if (!colorImagesMap[hexCode]) {
              colorImagesMap[hexCode] = {
                hexCode: hexCode,
                name: item.name || getColorNameFromHex(hexCode),
                price: item.price !== undefined ? parseFloat(item.price) : null,
                images: []
              };
            }
            colorImagesMap[hexCode].images.push(item.imageUrl);
          }
        });
      } catch (e) {
        console.error("Error parsing images_with_colors:", e);
      }
    }

    // Handle images with color codes from file uploads
    // Pattern: image_#000000, image_#FFD700 (each can have multiple files)
    if (req.files) {
      const colorImageUploadPromises = [];

      Object.keys(req.files).forEach(key => {
        if (key.startsWith('image_#')) {
          const hexCode = key.replace('image_', '');
          // Validate hex code format
          if (hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
            const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];

            // Upload files in parallel for this color
            const uploadPromise = Promise.all(
              files.map(file => uploadToS3(file, `products/colors/${hexCode.replace('#', '')}`))
            ).then(imageUrls => {
              if (!colorImagesMap[hexCode]) {
                colorImagesMap[hexCode] = {
                  hexCode: hexCode,
                  name: getColorNameFromHex(hexCode),
                  price: null,
                  images: []
                };
              }
              colorImagesMap[hexCode].images.push(...imageUrls);
            }).catch(err => {
              console.error(`Error uploading images for ${hexCode}:`, err);
            });

            colorImageUploadPromises.push(uploadPromise);
          }
        }
      });

      // Wait for all color image uploads to complete
      if (colorImageUploadPromises.length > 0) {
        await Promise.all(colorImageUploadPromises);
      }
    }

    // Handle parallel arrays: images array + image_colors array
    if (req.body.image_colors && req.files && req.files.images) {
      try {
        let imageColors = [];
        if (typeof req.body.image_colors === 'string') {
          imageColors = JSON.parse(req.body.image_colors);
        } else if (Array.isArray(req.body.image_colors)) {
          imageColors = req.body.image_colors;
        }

        // Upload images first
        const uploadPromises = req.files.images.map(file => uploadToS3(file, "products"));
        const uploadedUrls = await Promise.all(uploadPromises);

        // Map each uploaded image to its color
        uploadedUrls.forEach((url, index) => {
          const hexCode = imageColors[index];
          if (hexCode && hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
            if (!colorImagesMap[hexCode]) {
              colorImagesMap[hexCode] = {
                hexCode: hexCode,
                name: getColorNameFromHex(hexCode),
                price: null,
                images: []
              };
            }
            colorImagesMap[hexCode].images.push(url);
          } else {
            // No color specified, add to general images
            generalImages.push(url);
          }
        });

        // Update general images if any were added
        if (generalImages.length > 0) {
          productData.images = generalImages;
        }
      } catch (e) {
        console.error("Error processing image_colors:", e);
      }
    }

    // Convert colorImagesMap to array format
    if (Object.keys(colorImagesMap).length > 0) {
      const colorImagesArray = Object.values(colorImagesMap).map(colorData => ({
        hexCode: colorData.hexCode,
        name: colorData.name || getColorNameFromHex(colorData.hexCode),
        price: colorData.price !== undefined && colorData.price !== null ? parseFloat(colorData.price) : null,
        images: Array.isArray(colorData.images) ? colorData.images : [colorData.images]
      }));

      productData.color_images = JSON.stringify(colorImagesArray);
    }

    // Handle 3D model upload
    if (req.files && req.files.model_3d) {
      try {
        const url = await uploadToS3(req.files.model_3d[0], "products/models");
        productData.model_3d_url = url;
      } catch (uploadError) {
        console.error("3D model upload error:", uploadError);
        return error(res, `3D model upload failed: ${uploadError.message}`, 500);
      }
    }

    // Generate slug if not provided, ensuring uniqueness
    if (!productData.slug) {
      let baseSlug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check if slug exists and make it unique if needed - optimized with findFirst
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await prisma.product.findFirst({
          where: { slug },
          select: { id: true }
        });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
        // Safety limit to prevent infinite loops
        if (counter > 1000) {
          slug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }
      productData.slug = slug;
    }

    // Convert price to Decimal
    if (productData.price) {
      productData.price = parseFloat(productData.price);
    }
    if (productData.compare_at_price) {
      productData.compare_at_price = parseFloat(productData.compare_at_price);
    }
    if (productData.cost_price) {
      productData.cost_price = parseFloat(productData.cost_price);
    }

    // Convert stock_quantity to Int
    if (productData.stock_quantity !== undefined) {
      productData.stock_quantity = parseInt(productData.stock_quantity, 10) || 0;
    }

    // Convert boolean fields from strings
    if (productData.is_active !== undefined) {
      productData.is_active = productData.is_active === 'true' || productData.is_active === true || productData.is_active === '1' || productData.is_active === 1;
    }
    if (productData.is_featured !== undefined) {
      productData.is_featured = productData.is_featured === 'true' || productData.is_featured === true || productData.is_featured === '1' || productData.is_featured === 1;
    }
    // Validate and parse category_id
    if (!productData.category_id) {
      return error(res, "Category ID is required", 400);
    }
    productData.category_id = parseInt(productData.category_id, 10);
    if (isNaN(productData.category_id)) {
      return error(res, "Invalid category ID", 400);
    }

    // Check category, slug, and SKU in parallel for better performance
    const [category, existingSlug, existingSku] = await Promise.all([
      prisma.category.findUnique({
        where: { id: productData.category_id },
      }),
      productData.slug ? prisma.product.findFirst({
        where: { slug: productData.slug },
        select: { id: true }
      }) : Promise.resolve(null),
      productData.sku ? prisma.product.findFirst({
        where: { sku: productData.sku },
        select: { id: true }
      }) : Promise.resolve(null)
    ]);

    if (!category) {
      return error(res, `Category with ID ${productData.category_id} not found`, 404);
    }
    if (existingSlug) {
      return error(res, `A product with slug "${productData.slug}" already exists. Please use a different slug.`, 400);
    }
    if (existingSku) {
      return error(res, `A product with SKU "${productData.sku}" already exists. SKU must be unique.`, 400);
    }

    // Validate sub_category_id if provided
    if (productData.sub_category_id !== undefined && productData.sub_category_id !== null && productData.sub_category_id !== '') {
      productData.sub_category_id = parseInt(productData.sub_category_id, 10);
      if (isNaN(productData.sub_category_id)) {
        return error(res, "Invalid sub_category_id", 400);
      }
      // Verify subcategory exists and belongs to category (can be nested subcategory)
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: productData.sub_category_id },
        include: {
          category: {
            select: { id: true, name: true }
          },
          parent: {
            select: { id: true, name: true, slug: true }
          }
        }
      });
      if (!subCategory) {
        return error(res, `SubCategory with ID ${productData.sub_category_id} not found`, 404);
      }
      if (subCategory.category_id !== productData.category_id) {
        return error(res, `SubCategory does not belong to the selected Category. Subcategory belongs to "${subCategory.category.name}" (ID: ${subCategory.category_id})`, 400);
      }

      // Log if it's a nested subcategory
      if (subCategory.parent) {
        console.log(`✅ Using nested subcategory: ${subCategory.name} (parent: ${subCategory.parent.name})`);
      }
    }


    // Validate and normalize product_type enum
    const validProductTypes = ['frame', 'sunglasses', 'contact_lens', 'eye_hygiene'];
    if (productData.product_type !== undefined) {
      const productType = String(productData.product_type).toLowerCase().trim();

      // Map common invalid values to valid ones
      const productTypeMap = {
        'lens': 'contact_lens',
        'lenses': 'contact_lens',
        'contact': 'contact_lens',
        'glasses': 'frame',
        'eyeglass': 'frame',
        'eyeglasses': 'frame',
        'sunglass': 'sunglasses'
      };

      const normalizedType = productTypeMap[productType] || productType;

      if (!validProductTypes.includes(normalizedType)) {
        return error(res, `Invalid product_type "${productData.product_type}". Valid values are: ${validProductTypes.join(', ')}`, 400);
      }

      productData.product_type = normalizedType;
    } else {
      // Default to 'frame' if not provided
      productData.product_type = 'frame';
    }

    // Validate and normalize stock_status enum
    if (productData.stock_status !== undefined) {
      const validStockStatuses = ['in_stock', 'out_of_stock', 'backorder'];
      const stockStatus = String(productData.stock_status).toLowerCase().trim();

      // Map common invalid values to valid ones
      const stockStatusMap = {
        'on_backorder': 'backorder',
        'back_order': 'backorder',
        'back-order': 'backorder',
        'instock': 'in_stock',
        'in-stock': 'in_stock',
        'in stock': 'in_stock',
        'outofstock': 'out_of_stock',
        'out-of-stock': 'out_of_stock',
        'out of stock': 'out_of_stock'
      };

      const normalizedStatus = stockStatusMap[stockStatus] || stockStatus;

      if (!validStockStatuses.includes(normalizedStatus)) {
        return error(res, `Invalid stock_status "${productData.stock_status}". Valid values are: ${validStockStatuses.join(', ')}`, 400);
      }

      productData.stock_status = normalizedStatus;
    }

    // Validate and normalize gender enum
    if (productData.gender !== undefined) {
      const validGenders = ['men', 'women', 'unisex', 'kids'];
      const gender = String(productData.gender).toLowerCase().trim();

      if (!validGenders.includes(gender)) {
        return error(res, `Invalid gender "${productData.gender}". Valid values are: ${validGenders.join(', ')}`, 400);
      }

      productData.gender = gender;
    }

    // Normalize frame_shape - just trim whitespace, accept any value
    if (productData.frame_shape !== undefined && productData.frame_shape !== null && productData.frame_shape !== '') {
      productData.frame_shape = String(productData.frame_shape).trim();
      if (productData.frame_shape === '') {
        productData.frame_shape = null;
      }
    }

    // Normalize frame_material - handle array format from frontend, store as JSON string
    if (productData.frame_material !== undefined && productData.frame_material !== null && productData.frame_material !== '') {
      let frameMaterial = productData.frame_material;

      // Handle JSON array string like "[\"acetate\"]" or "[\"acetate\", \"metal\"]"
      if (typeof frameMaterial === 'string' && frameMaterial.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(frameMaterial);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Store the array as JSON string to preserve multiple selections
            productData.frame_material = JSON.stringify(parsed);
            // If only one value, store it as a simple string
            if (parsed.length === 1) {
              productData.frame_material = String(parsed[0]).trim();
            } else {
              productData.frame_material = JSON.stringify(parsed);
            }
          } else {
            productData.frame_material = null;
          }
        } catch (e) {
          // If parsing fails, use the string as-is
          productData.frame_material = String(frameMaterial).trim();
        }
      } else if (Array.isArray(frameMaterial) && frameMaterial.length > 0) {
        // If it's an actual array, store as JSON string if multiple, or string if single
        if (frameMaterial.length === 1) {
          productData.frame_material = String(frameMaterial[0]).trim();
        } else {
          productData.frame_material = JSON.stringify(frameMaterial);
        }
      } else {
        // Single value - store as string
        productData.frame_material = String(frameMaterial).trim();
      }

      // If empty after processing, set to null
      if (productData.frame_material === '') {
        productData.frame_material = null;
      }
    }

    // Normalize lens_type - just trim whitespace, accept any value
    if (productData.lens_type !== undefined && productData.lens_type !== null && productData.lens_type !== '') {
      productData.lens_type = String(productData.lens_type).trim();
      if (productData.lens_type === '') {
        productData.lens_type = null;
      }
    }

    // Normalize images coming from form-data / JSON
    // Images are stored as JSON string in database, but we work with arrays in code
    let imagesArray = [];

    // If images were uploaded as files, they're already in productData.images as an array
    if (req.files && req.files.images && Array.isArray(productData.images) && productData.images.length > 0) {
      // Images uploaded as files - already set as array in productData.images from S3 uploads
      imagesArray = productData.images;
      console.log('📸 Using uploaded images:', imagesArray);
    } else if (productData.images !== undefined) {
      // Images provided in body (form-data or JSON)
      if (typeof productData.images === "string") {
        if (productData.images.trim() === "") {
          imagesArray = [];
        } else {
          try {
            imagesArray = JSON.parse(productData.images);
          } catch (e) {
            console.error("Error parsing images:", e);
            imagesArray = [];
          }
        }
      } else if (Array.isArray(productData.images)) {
        imagesArray = productData.images;
      } else {
        imagesArray = [];
      }
    }

    // Convert images array to JSON string for database storage
    // Set to null if empty array (Prisma expects String or Null)
    productData.images = imagesArray.length > 0 ? JSON.stringify(imagesArray) : null;
    console.log('💾 Saving images to DB:', productData.images ? `${imagesArray.length} image(s)` : 'null');

    // Normalize color_images - similar to images
    if (productData.color_images !== undefined) {
      let colorImagesArray = [];
      if (typeof productData.color_images === "string") {
        if (productData.color_images.trim() === "") {
          colorImagesArray = [];
        } else {
          try {
            colorImagesArray = JSON.parse(productData.color_images);
          } catch (e) {
            console.error("Error parsing color_images:", e);
            colorImagesArray = [];
          }
        }
      } else if (Array.isArray(productData.color_images)) {
        colorImagesArray = productData.color_images;
      }

      // Convert color_images array to JSON string for database storage
      productData.color_images = colorImagesArray.length > 0 ? JSON.stringify(colorImagesArray) : null;
      console.log('💾 Saving color_images to DB:', productData.color_images ? `${colorImagesArray.length} color(s)` : 'null');
    }

    // Handle variants
    let variantsData = [];
    if (productData.variants) {
      try {
        variantsData =
          typeof productData.variants === "string"
            ? JSON.parse(productData.variants)
            : productData.variants;
        delete productData.variants;
      } catch (e) {
        console.error("Error parsing variants:", e);
      }
    }

    // Handle size/volume variants
    let sizeVolumeVariantsData = [];
    if (productData.sizeVolumeVariants) {
      try {
        sizeVolumeVariantsData =
          typeof productData.sizeVolumeVariants === "string"
            ? JSON.parse(productData.sizeVolumeVariants)
            : productData.sizeVolumeVariants;
        delete productData.sizeVolumeVariants;
      } catch (e) {
        console.error("Error parsing sizeVolumeVariants:", e);
      }
    }

    // Clean productData - only include valid Prisma fields
    // List of valid Product model fields (excluding relations and auto-generated fields)
    const validProductFields = [
      'name', 'slug', 'sku', 'description', 'short_description',
      'category_id', 'sub_category_id', 'price', 'compare_at_price', 'cost_price',
      'stock_quantity', 'stock_status', 'images', 'color_images',
      'frame_shape', 'frame_material', 'frame_color', 'gender', 'lens_type',
      'lens_index_options', 'treatment_options', 'model_3d_url', 'try_on_image',
      'is_featured', 'is_active', 'meta_title', 'meta_description', 'meta_keywords',
      'product_type', 'contact_lens_brand', 'contact_lens_material', 'contact_lens_color',
      'contact_lens_type', 'replacement_frequency', 'water_content', 'powers_range',
      'base_curve_options', 'diameter_options', 'can_sleep_with', 'is_medical_device', 'has_uv_filter',
      'size_volume', 'pack_type', 'expiry_date' // Eye Hygiene fields
    ];

    // Optional fields that should be null if empty string
    const optionalStringFields = [
      'description', 'short_description', 'frame_material', 'frame_color',
      'lens_index_options', 'treatment_options', 'model_3d_url', 'try_on_image',
      'meta_title', 'meta_description', 'meta_keywords',
      'contact_lens_brand', 'contact_lens_material', 'contact_lens_color',
      'contact_lens_type', 'replacement_frequency', 'water_content', 'powers_range',
      'base_curve_options', 'diameter_options', 'images', 'color_images',
      'size_volume', 'pack_type' // Eye Hygiene string fields
    ];

    // Handle expiry_date - convert string to DateTime or null
    if (productData.expiry_date !== undefined) {
      if (productData.expiry_date === '' || productData.expiry_date === null || productData.expiry_date === 'null') {
        productData.expiry_date = null;
      } else if (typeof productData.expiry_date === 'string') {
        try {
          // Try to parse the date string
          const date = new Date(productData.expiry_date);
          if (isNaN(date.getTime())) {
            productData.expiry_date = null;
          } else {
            productData.expiry_date = date;
          }
        } catch (e) {
          productData.expiry_date = null;
        }
      }
    }

    // Filter productData to only include valid fields and handle empty strings
    const cleanedProductData = {};
    for (const key of validProductFields) {
      if (productData[key] !== undefined) {
        // Convert empty strings to null for optional fields
        if (optionalStringFields.includes(key) && productData[key] === '') {
          cleanedProductData[key] = null;
        }
        // Handle sub_category_id - convert empty string to null
        else if (key === 'sub_category_id' && (productData[key] === '' || productData[key] === 'null' || productData[key] === null)) {
          cleanedProductData[key] = null;
        }
        // Handle boolean fields - ensure they're proper booleans
        else if ((key === 'is_featured' || key === 'is_active' || key === 'can_sleep_with' || key === 'is_medical_device' || key === 'has_uv_filter') && typeof productData[key] === 'string') {
          cleanedProductData[key] = productData[key] === 'true' || productData[key] === '1';
        }
        else {
          cleanedProductData[key] = productData[key];
        }
      }
    }

    // Log cleaned data for debugging (remove sensitive data)
    console.log('📝 Cleaned product data keys:', Object.keys(cleanedProductData));
    console.log('📝 Required fields check:', {
      name: !!cleanedProductData.name,
      slug: !!cleanedProductData.slug,
      sku: !!cleanedProductData.sku,
      category_id: !!cleanedProductData.category_id,
      price: cleanedProductData.price !== undefined
    });

    // Create the product first
    let product;
    try {
      product = await prisma.product.create({
        data: cleanedProductData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          subCategory: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });
    } catch (prismaError) {
      console.error('❌ Prisma validation error:', {
        name: prismaError.name,
        message: prismaError.message,
        code: prismaError.code,
        meta: prismaError.meta,
        cleanedDataKeys: Object.keys(cleanedProductData),
        cleanedDataSample: {
          name: cleanedProductData.name,
          slug: cleanedProductData.slug,
          sku: cleanedProductData.sku,
          category_id: cleanedProductData.category_id,
          price: cleanedProductData.price,
          priceType: typeof cleanedProductData.price,
          stock_quantity: cleanedProductData.stock_quantity,
          stock_quantityType: typeof cleanedProductData.stock_quantity
        }
      });
      throw prismaError; // Re-throw to be caught by asyncHandler
    }

    // Format images - parse JSON string to array for response
    let images = product.images;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        images = [];
      }
    }
    if (!Array.isArray(images)) {
      images = images ? [images] : [];
    }

    // Format color_images - parse JSON string to array for response
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

    const formattedProduct = {
      ...product,
      images,
      image: images && images.length > 0 ? images[0] : null,
      color_images: colorImages
    };

    // Create size/volume variants separately if any exist
    if (sizeVolumeVariantsData && sizeVolumeVariantsData.length > 0) {
      try {
        await prisma.productSizeVolume.createMany({
          data: sizeVolumeVariantsData.map((variant) => ({
            size_volume: variant.size_volume || variant.sizeVolume || '',
            pack_type: variant.pack_type || variant.packType || null,
            expiry_date: variant.expiry_date || variant.expiryDate ? new Date(variant.expiry_date || variant.expiryDate) : null,
            price: parseFloat(variant.price || 0),
            compare_at_price: variant.compare_at_price || variant.compareAtPrice ? parseFloat(variant.compare_at_price || variant.compareAtPrice) : null,
            cost_price: variant.cost_price || variant.costPrice ? parseFloat(variant.cost_price || variant.costPrice) : null,
            stock_quantity: parseInt(variant.stock_quantity || variant.stockQuantity || 0, 10),
            stock_status: variant.stock_status || variant.stockStatus || 'in_stock',
            sku: variant.sku || null,
            is_active: variant.is_active !== undefined ? (variant.is_active === 'true' || variant.is_active === true) : true,
            sort_order: parseInt(variant.sort_order || variant.sortOrder || 0, 10),
            product_id: product.id,
          })),
        });
      } catch (err) {
        // If table doesn't exist, log warning but don't fail product creation
        if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
          console.warn('⚠️  ProductSizeVolume table does not exist yet. Product created but variants were not saved. Run migration: npx prisma migrate deploy');
        } else {
          // Re-throw other errors
          throw err;
        }
      }
    }

    // If there were variants of either type, re-fetch including them
    if ((variantsData && variantsData.length > 0) || (sizeVolumeVariantsData && sizeVolumeVariantsData.length > 0)) {
      // Build include object - conditionally include sizeVolumeVariants if table exists
      const includeObject = {
        variants: true,
        category: {
          select: { id: true, name: true, slug: true }
        },
        subCategory: {
          select: { id: true, name: true, slug: true }
        }
      };

      let fullProduct;
      try {
        fullProduct = await prisma.product.findUnique({
          where: { id: product.id },
          include: {
            ...includeObject,
            sizeVolumeVariants: {
              orderBy: [
                { sort_order: 'asc' },
                { size_volume: 'asc' },
                { pack_type: 'asc' }
              ]
            }
          },
        });
      } catch (err) {
        // If error is about missing table/model, retry without sizeVolumeVariants
        if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
          console.warn('⚠️  ProductSizeVolume table does not exist yet. Fetching product without variants. Run migration: npx prisma migrate deploy');
          fullProduct = await prisma.product.findUnique({
            where: { id: product.id },
            include: includeObject,
          });
        } else {
          // Re-throw other errors
          throw err;
        }
      }

      // Format images
      let finalImages = fullProduct.images;
      if (typeof finalImages === 'string') {
        try {
          finalImages = JSON.parse(finalImages);
        } catch (e) {
          finalImages = [];
        }
      }
      if (!Array.isArray(finalImages)) {
        finalImages = finalImages ? [finalImages] : [];
      }

      // Format color_images
      let finalColorImages = fullProduct.color_images;
      if (typeof finalColorImages === 'string') {
        try {
          finalColorImages = JSON.parse(finalColorImages);
        } catch (e) {
          finalColorImages = [];
        }
      }
      if (!Array.isArray(finalColorImages)) {
        finalColorImages = finalColorImages ? [finalColorImages] : [];
      }

      const finalFormattedProduct = {
        ...fullProduct,
        images: finalImages,
        image: finalImages && finalImages.length > 0 ? finalImages[0] : null,
        color_images: finalColorImages
      };

      return success(res, "Product created successfully", { product: finalFormattedProduct }, 201);
    }

    return success(res, "Product created successfully", { product: formattedProduct }, 201);
  } catch (err) {
    console.error('❌ Product creation error:', err);
    throw err; // Let asyncHandler catch it
  }
});

// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productData = { ...req.body };

  // Validate and parse id parameter - handle "undefined" string as well
  if (!id || id === undefined || id === null || id === '' || id === 'undefined' || id === 'null') {
    console.error('Missing product ID in request params:', { params: req.params, url: req.url, id, idType: typeof id });
    return error(res, "Product ID is required", 400);
  }

  const productId = parseInt(String(id), 10);
  if (isNaN(productId) || productId <= 0) {
    console.error('Invalid product ID:', { id, parsed: productId, type: typeof id });
    return error(res, `Invalid product ID "${id}". Must be a positive integer`, 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    return error(res, "Product not found", 404);
  }

  // Handle images with color codes (same approach as create)
  let generalImages = [];
  const colorImagesMap = {};

  // Parse existing color images
  if (product.color_images) {
    try {
      const existingColorImages = typeof product.color_images === 'string'
        ? JSON.parse(product.color_images)
        : (Array.isArray(product.color_images) ? product.color_images : []);

      // Group existing by hex code
      existingColorImages.forEach(item => {
        const hexCode = item.hexCode || item.hex_code || (item.color ? getColorHexCode(item.color) : null);
        if (hexCode && hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
          colorImagesMap[hexCode] = {
            hexCode: hexCode,
            name: item.name || getColorNameFromHex(hexCode),
            price: item.price !== undefined ? parseFloat(item.price) : null,
            images: item.images ? (Array.isArray(item.images) ? item.images : [item.images]) : []
          };
        }
      });
    } catch (e) {
      console.error("Error parsing existing color_images:", e);
    }
  }

  // Handle general images (without color codes)
  // First, get existing images for comparison
  let existingImages = [];
  if (product.images) {
    try {
      existingImages = typeof product.images === 'string'
        ? JSON.parse(product.images)
        : (Array.isArray(product.images) ? product.images : []);
    } catch (e) {
      console.error("Error parsing existing images:", e);
      existingImages = [];
    }
  }

  // Check if images array is provided in body (for replace/delete operations)
  let baseImages = null;
  let shouldUpdateImages = false;

  if (req.body.images !== undefined) {
    // Frontend sent the complete list of images to keep/replace
    shouldUpdateImages = true;
    if (typeof req.body.images === 'string') {
      if (req.body.images.trim() === "") {
        baseImages = [];
      } else {
        try {
          baseImages = JSON.parse(req.body.images);
        } catch (e) {
          console.error("Error parsing images from body:", e);
          baseImages = [];
        }
      }
    } else if (Array.isArray(req.body.images)) {
      baseImages = req.body.images;
    } else {
      baseImages = [];
    }
  } else if (req.files && req.files.images) {
    // No images in body, but files uploaded - use existing images as base
    shouldUpdateImages = true;
    baseImages = [...existingImages];
  }

  // If new images are uploaded, add them to the base images
  if (req.files && req.files.images) {
    const uploadPromises = req.files.images.map(file => uploadToS3(file, "products"));
    const newImageUrls = await Promise.all(uploadPromises);
    baseImages = baseImages !== null ? [...baseImages, ...newImageUrls] : newImageUrls;
    shouldUpdateImages = true;
  }

  // Delete images that were removed (exist in old list but not in new list)
  if (shouldUpdateImages && baseImages !== null) {
    const imagesToDelete = existingImages.filter(oldImage => !baseImages.includes(oldImage));

    // If baseImages is empty array, all existing images should be deleted
    if (baseImages.length === 0 && existingImages.length > 0) {
      console.log(`🗑️  Clearing all images, deleting ${existingImages.length} image(s) from storage...`);
      for (const imageUrl of existingImages) {
        try {
          // Extract the key/path from the URL
          let key = imageUrl;
          if (imageUrl.includes('/uploads/')) {
            // Extract path after /uploads/
            key = imageUrl.split('/uploads/')[1];
          } else if (imageUrl.includes('.com/')) {
            // For S3 URLs, extract key after domain
            key = imageUrl.split('.com/')[1];
          }

          await deleteFromS3(key);
          console.log(`✅ Deleted image: ${key}`);
        } catch (err) {
          console.error(`❌ Error deleting image ${imageUrl}:`, err);
          // Continue with other deletions even if one fails
        }
      }
    } else if (imagesToDelete.length > 0) {
      console.log(`🗑️  Deleting ${imagesToDelete.length} removed image(s) from storage...`);
      for (const imageUrl of imagesToDelete) {
        try {
          // Extract the key/path from the URL
          let key = imageUrl;
          if (imageUrl.includes('/uploads/')) {
            // Extract path after /uploads/
            key = imageUrl.split('/uploads/')[1];
          } else if (imageUrl.includes('.com/')) {
            // For S3 URLs, extract key after domain
            key = imageUrl.split('.com/')[1];
          }

          await deleteFromS3(key);
          console.log(`✅ Deleted image: ${key}`);
        } catch (err) {
          console.error(`❌ Error deleting image ${imageUrl}:`, err);
          // Continue with other deletions even if one fails
        }
      }
    }

    // Set the final images array
    generalImages = baseImages;
    // Explicitly set to empty array if cleared, will be converted to null later
    productData.images = baseImages.length === 0 ? [] : baseImages;
  }

  // Handle images with color codes from JSON body
  if (req.body.images_with_colors) {
    try {
      let imagesWithColors = [];
      if (typeof req.body.images_with_colors === 'string') {
        imagesWithColors = JSON.parse(req.body.images_with_colors);
      } else if (Array.isArray(req.body.images_with_colors)) {
        imagesWithColors = req.body.images_with_colors;
      }

      // Group images by hex code
      imagesWithColors.forEach(item => {
        const hexCode = item.hexCode || item.hex_code;
        if (hexCode && hexCode.match(/^#[0-9A-Fa-f]{6}$/) && item.imageUrl) {
          if (!colorImagesMap[hexCode]) {
            colorImagesMap[hexCode] = {
              hexCode: hexCode,
              name: item.name || getColorNameFromHex(hexCode),
              price: item.price !== undefined ? parseFloat(item.price) : null,
              images: []
            };
          }
          colorImagesMap[hexCode].images.push(item.imageUrl);
        }
      });
    } catch (e) {
      console.error("Error parsing images_with_colors:", e);
    }
  }

  // Handle images with color codes from file uploads
  // Pattern: image_#000000, image_#FFD700 (each can have multiple files)
  if (req.files) {
    const colorImageUploadPromises = [];

    Object.keys(req.files).forEach(key => {
      if (key.startsWith('image_#')) {
        const hexCode = key.replace('image_', '');
        // Validate hex code format
        if (hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
          const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];

          // Upload files in parallel for this color
          const uploadPromise = Promise.all(
            files.map(file => uploadToS3(file, `products/colors/${hexCode.replace('#', '')}`))
          ).then(imageUrls => {
            if (!colorImagesMap[hexCode]) {
              colorImagesMap[hexCode] = {
                hexCode: hexCode,
                name: getColorNameFromHex(hexCode),
                price: null,
                images: []
              };
            }
            colorImagesMap[hexCode].images.push(...imageUrls);
          }).catch(err => {
            console.error(`Error uploading images for ${hexCode}:`, err);
          });

          colorImageUploadPromises.push(uploadPromise);
        }
      }
    });

    // Wait for all color image uploads to complete
    if (colorImageUploadPromises.length > 0) {
      await Promise.all(colorImageUploadPromises);
    }
  }

  // Handle parallel arrays: images array + image_colors array
  if (req.body.image_colors && req.files && req.files.images) {
    try {
      let imageColors = [];
      if (typeof req.body.image_colors === 'string') {
        imageColors = JSON.parse(req.body.image_colors);
      } else if (Array.isArray(req.body.image_colors)) {
        imageColors = req.body.image_colors;
      }

      // Upload images first
      const uploadPromises = req.files.images.map(file => uploadToS3(file, "products"));
      const uploadedUrls = await Promise.all(uploadPromises);

      // Map each uploaded image to its color
      uploadedUrls.forEach((url, index) => {
        const hexCode = imageColors[index];
        if (hexCode && hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
          if (!colorImagesMap[hexCode]) {
            colorImagesMap[hexCode] = {
              hexCode: hexCode,
              name: getColorNameFromHex(hexCode),
              price: null,
              images: []
            };
          }
          colorImagesMap[hexCode].images.push(url);
        } else {
          // No color specified, add to general images
          generalImages.push(url);
        }
      });

      // Update general images if any were added
      if (generalImages.length > 0) {
        productData.images = generalImages;
      }
    } catch (e) {
      console.error("Error processing image_colors:", e);
    }
  }

  // Handle old format for backward compatibility (color_images_#HEXCODE)
  if (req.files && Object.keys(req.files).some(key => key.startsWith('color_images_'))) {
    try {
      const colorImageFiles = {};
      Object.keys(req.files || {}).forEach(key => {
        if (key.startsWith('color_images_')) {
          const hexCode = key.replace('color_images_', '');
          // Validate hex code format
          if (hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
            if (!colorImageFiles[hexCode]) {
              colorImageFiles[hexCode] = [];
            }
            const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
            files.forEach(file => colorImageFiles[hexCode].push(file));
          }
        }
      });

      // Upload new color images and merge - upload in parallel for better performance
      const colorUploadPromises = Object.entries(colorImageFiles).map(async ([hexCode, files]) => {
        // Use hex code without # for folder name
        const folderName = hexCode.replace('#', '');
        const uploadPromises = files.map(file => uploadToS3(file, `products/colors/${folderName}`));
        const imageUrls = await Promise.all(uploadPromises);
        return { hexCode, imageUrls };
      });
      const colorUploadResults = await Promise.all(colorUploadPromises);
      colorUploadResults.forEach(({ hexCode, imageUrls }) => {
        // Merge with existing or create new
        if (colorImagesMap[hexCode]) {
          // Merge images, preserve existing metadata
          colorImagesMap[hexCode].images = [...colorImagesMap[hexCode].images, ...imageUrls];
        } else {
          // Create new entry
          colorImagesMap[hexCode] = {
            hexCode: hexCode,
            name: getColorNameFromHex(hexCode),
            price: null,
            images: imageUrls
          };
        }
      });
    } catch (uploadError) {
      console.error("Color image upload error:", uploadError);
      return error(res, `Color image upload failed: ${uploadError.message}`, 500);
    }
  }

  // Handle old JSON format for backward compatibility
  // When color_images is sent, it REPLACES existing color images (not merges)
  if (req.body.color_images !== undefined && !req.body.images_with_colors) {
    try {
      let colorImagesData = [];
      if (typeof req.body.color_images === 'string') {
        if (req.body.color_images.trim() === '' || req.body.color_images === '[]' || req.body.color_images === 'null') {
          // Clear all color images - handled by shouldClearAllColorImages flag
          colorImagesData = [];
        } else {
          colorImagesData = JSON.parse(req.body.color_images);
        }
      } else if (Array.isArray(req.body.color_images)) {
        colorImagesData = req.body.color_images;
      }

      // REPLACE existing color images (don't merge)
      // Clear the map first if color_images is explicitly provided
      if (req.body.color_images !== null && req.body.color_images !== '' && req.body.color_images !== '[]') {
        // Only clear if it's not an empty array/null
        Object.keys(colorImagesMap).forEach(key => {
          // Keep only colors that are in the new data
          const existsInNew = colorImagesData.some(item => {
            const hexCode = item.hexCode || item.hex_code || (item.color ? getColorHexCode(item.color) : null);
            return hexCode === key;
          });
          if (!existsInNew) {
            delete colorImagesMap[key];
          }
        });
      }

      // Add/update color images from the provided data
      colorImagesData.forEach(item => {
        const hexCode = item.hexCode || item.hex_code || (item.color ? getColorHexCode(item.color) : null);
        if (hexCode && hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
          const existingUrls = item.images ? (Array.isArray(item.images) ? item.images : [item.images]) : [];
          // REPLACE images for this color, don't merge
          colorImagesMap[hexCode] = {
            hexCode: hexCode,
            name: item.name || getColorNameFromHex(hexCode),
            price: item.price !== undefined ? parseFloat(item.price) : null,
            images: existingUrls
          };
        }
      });
    } catch (e) {
      console.error("Error parsing color_images:", e);
    }
  }

  // Delete removed color images from storage
  // Get existing color images for comparison
  let existingColorImages = [];
  if (product.color_images) {
    try {
      const parsed = typeof product.color_images === 'string'
        ? JSON.parse(product.color_images)
        : (Array.isArray(product.color_images) ? product.color_images : []);
      existingColorImages = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error parsing existing color_images for deletion:", e);
      existingColorImages = [];
    }
  }

  // Check if color_images is explicitly set to clear all
  let shouldClearAllColorImages = false;
  if (req.body.color_images !== undefined) {
    if (req.body.color_images === null || req.body.color_images === '' || req.body.color_images === '[]') {
      shouldClearAllColorImages = true;
    } else if (typeof req.body.color_images === 'string') {
      try {
        const parsed = JSON.parse(req.body.color_images);
        if (Array.isArray(parsed) && parsed.length === 0) {
          shouldClearAllColorImages = true;
        }
      } catch (e) {
        // Not a valid JSON, ignore
      }
    } else if (Array.isArray(req.body.color_images) && req.body.color_images.length === 0) {
      shouldClearAllColorImages = true;
    }
  }

  // Compare existing and new color images to find deleted ones
  // Always check for deletions if there are existing color images
  if (existingColorImages.length > 0) {
    const newColorImagesMap = {};
    Object.values(colorImagesMap).forEach(colorData => {
      const hexCode = colorData.hexCode;
      newColorImagesMap[hexCode] = new Set(colorData.images || []);
    });

    // Collect all images to delete
    const colorImagesToDelete = [];

    // If all color images are being cleared, delete all existing color images
    if (shouldClearAllColorImages || Object.keys(colorImagesMap).length === 0) {
      console.log(`🗑️  Clearing all color images, deleting ${existingColorImages.length} color image group(s)...`);
      existingColorImages.forEach(existingColor => {
        const existingImageUrls = existingColor.images ? (Array.isArray(existingColor.images) ? existingColor.images : [existingColor.images]) : [];
        existingImageUrls.forEach(imageUrl => {
          // Extract key from URL - deleteFromS3 handles both full URLs and relative paths
          colorImagesToDelete.push({ key: imageUrl, imageUrl });
        });
      });
    } else {
      // Find individual images that were removed
      existingColorImages.forEach(existingColor => {
        const hexCode = existingColor.hexCode || existingColor.hex_code || (existingColor.color ? getColorHexCode(existingColor.color) : null);
        if (hexCode && hexCode.match(/^#[0-9A-Fa-f]{6}$/)) {
          const existingImageUrls = existingColor.images ? (Array.isArray(existingColor.images) ? existingColor.images : [existingColor.images]) : [];
          const newImageSet = newColorImagesMap[hexCode] || new Set();

          existingImageUrls.forEach(imageUrl => {
            if (!newImageSet.has(imageUrl)) {
              // This image was removed, mark it for deletion
              // deleteFromS3 handles both full URLs and relative paths
              colorImagesToDelete.push({ key: imageUrl, imageUrl });
            }
          });
        }
      });
    }

    // Delete all marked color images
    if (colorImagesToDelete.length > 0) {
      console.log(`🗑️  Deleting ${colorImagesToDelete.length} removed color image(s) from storage...`);
      const deletePromises = colorImagesToDelete.map(({ key, imageUrl }) =>
        deleteFromS3(key)
          .then(() => {
            console.log(`✅ Deleted color image: ${key}`);
          })
          .catch(err => {
            console.error(`❌ Error deleting color image ${imageUrl}:`, err);
          })
      );
      await Promise.all(deletePromises);
    }
  }

  // Convert colorImagesMap to array format
  if (Object.keys(colorImagesMap).length > 0) {
    const colorImagesArray = Object.values(colorImagesMap).map(colorData => ({
      hexCode: colorData.hexCode,
      name: colorData.name || getColorNameFromHex(colorData.hexCode),
      price: colorData.price !== undefined && colorData.price !== null ? parseFloat(colorData.price) : null,
      images: Array.isArray(colorData.images) ? colorData.images : [colorData.images]
    }));

    productData.color_images = JSON.stringify(colorImagesArray);
  } else if (shouldClearAllColorImages || req.body.color_images === null || req.body.color_images === '' || req.body.color_images === '[]') {
    // Allow clearing color images - explicitly set to null when cleared
    productData.color_images = null;
    console.log('💾 Clearing color_images - setting to null in database');
  }

  // Handle 3D model upload
  if (req.files && req.files.model_3d) {
    const url = await uploadToS3(req.files.model_3d[0], "products/models");
    productData.model_3d_url = url;
  }

  // Convert price to Decimal if provided
  if (productData.price) {
    productData.price = parseFloat(productData.price);
  }
  if (productData.compare_at_price) {
    productData.compare_at_price = parseFloat(productData.compare_at_price);
  }
  if (productData.cost_price) {
    productData.cost_price = parseFloat(productData.cost_price);
  }

  // Convert stock_quantity to Int (form-data sends as string)
  if (productData.stock_quantity !== undefined) {
    productData.stock_quantity = parseInt(productData.stock_quantity, 10) || 0;
  }

  // Validate and normalize product_type enum if provided
  if (productData.product_type !== undefined) {
    const validProductTypes = ['frame', 'sunglasses', 'contact_lens', 'eye_hygiene'];
    const productType = String(productData.product_type).toLowerCase().trim();

    // Map common invalid values to valid ones
    const productTypeMap = {
      'lens': 'contact_lens',
      'lenses': 'contact_lens',
      'contact': 'contact_lens',
      'glasses': 'frame',
      'eyeglass': 'frame',
      'eyeglasses': 'frame',
      'sunglass': 'sunglasses'
    };

    const normalizedType = productTypeMap[productType] || productType;

    if (!validProductTypes.includes(normalizedType)) {
      return error(res, `Invalid product_type "${productData.product_type}". Valid values are: ${validProductTypes.join(', ')}`, 400);
    }

    productData.product_type = normalizedType;
  }

  // Validate and normalize stock_status enum if provided
  if (productData.stock_status !== undefined) {
    const validStockStatuses = ['in_stock', 'out_of_stock', 'backorder'];
    const stockStatus = String(productData.stock_status).toLowerCase().trim();

    // Map common invalid values to valid ones
    const stockStatusMap = {
      'on_backorder': 'backorder',
      'back_order': 'backorder',
      'back-order': 'backorder',
      'instock': 'in_stock',
      'in-stock': 'in_stock',
      'in stock': 'in_stock',
      'outofstock': 'out_of_stock',
      'out-of-stock': 'out_of_stock',
      'out of stock': 'out_of_stock'
    };

    const normalizedStatus = stockStatusMap[stockStatus] || stockStatus;

    if (!validStockStatuses.includes(normalizedStatus)) {
      return error(res, `Invalid stock_status "${productData.stock_status}". Valid values are: ${validStockStatuses.join(', ')}`, 400);
    }

    productData.stock_status = normalizedStatus;
  }

  // Validate and normalize gender enum if provided
  if (productData.gender !== undefined) {
    const validGenders = ['men', 'women', 'unisex', 'kids'];
    const gender = String(productData.gender).toLowerCase().trim();

    if (!validGenders.includes(gender)) {
      return error(res, `Invalid gender "${productData.gender}". Valid values are: ${validGenders.join(', ')}`, 400);
    }

    productData.gender = gender;
  }

  // Normalize frame_shape - just trim whitespace, accept any value
  if (productData.frame_shape !== undefined && productData.frame_shape !== null && productData.frame_shape !== '') {
    productData.frame_shape = String(productData.frame_shape).trim();
    if (productData.frame_shape === '') {
      productData.frame_shape = null;
    }
  }

  // Normalize frame_material if provided - handle array format from frontend, store as JSON string
  if (productData.frame_material !== undefined && productData.frame_material !== null && productData.frame_material !== '') {
    let frameMaterial = productData.frame_material;

    // Handle JSON array string like "[\"acetate\"]" or "[\"acetate\", \"metal\"]"
    if (typeof frameMaterial === 'string' && frameMaterial.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(frameMaterial);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Store the array as JSON string to preserve multiple selections
          if (parsed.length === 1) {
            productData.frame_material = String(parsed[0]).trim();
          } else {
            productData.frame_material = JSON.stringify(parsed);
          }
        } else {
          productData.frame_material = null;
        }
      } catch (e) {
        // If parsing fails, use the string as-is
        productData.frame_material = String(frameMaterial).trim();
      }
    } else if (Array.isArray(frameMaterial) && frameMaterial.length > 0) {
      // If it's an actual array, store as JSON string if multiple, or string if single
      if (frameMaterial.length === 1) {
        productData.frame_material = String(frameMaterial[0]).trim();
      } else {
        productData.frame_material = JSON.stringify(frameMaterial);
      }
    } else {
      // Single value - store as string
      productData.frame_material = String(frameMaterial).trim();
    }

    // If empty after processing, set to null
    if (productData.frame_material === '') {
      productData.frame_material = null;
    }
  }

  // Normalize lens_type - just trim whitespace, accept any value
  if (productData.lens_type !== undefined && productData.lens_type !== null && productData.lens_type !== '') {
    productData.lens_type = String(productData.lens_type).trim();
    if (productData.lens_type === '') {
      productData.lens_type = null;
    }
  }

  // Convert boolean fields from strings (form-data sends "true"/"false" as strings)
  if (productData.is_active !== undefined) {
    productData.is_active = productData.is_active === 'true' || productData.is_active === true || productData.is_active === '1' || productData.is_active === 1;
  }
  if (productData.is_featured !== undefined) {
    productData.is_featured = productData.is_featured === 'true' || productData.is_featured === true || productData.is_featured === '1' || productData.is_featured === 1;
  }

  // Validate category_id if provided
  if (productData.category_id !== undefined) {
    productData.category_id = parseInt(productData.category_id, 10);
    if (isNaN(productData.category_id)) {
      return error(res, "Invalid category ID", 400);
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: productData.category_id },
    });
    if (!category) {
      return error(res, `Category with ID ${productData.category_id} not found`, 404);
    }
  }

  // Determine the category ID that will be used (new category or existing)
  const finalCategoryId = productData.category_id || product.category_id;

  // Validate sub_category_id if provided
  if (productData.sub_category_id !== undefined) {
    if (productData.sub_category_id === 'null' || productData.sub_category_id === null || productData.sub_category_id === '') {
      productData.sub_category_id = null;
    } else {
      productData.sub_category_id = parseInt(productData.sub_category_id, 10);
      if (isNaN(productData.sub_category_id)) {
        return error(res, "Invalid sub_category_id", 400);
      }
      // Verify subcategory exists (can be nested subcategory)
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: productData.sub_category_id },
        include: {
          category: {
            select: { id: true, name: true }
          },
          parent: {
            select: { id: true, name: true, slug: true }
          }
        }
      });
      if (!subCategory) {
        return error(res, `SubCategory with ID ${productData.sub_category_id} not found`, 404);
      }
      // Validate that subcategory belongs to the final category (new or existing)
      if (subCategory.category_id !== finalCategoryId) {
        return error(res, `SubCategory does not belong to the product's Category. Subcategory belongs to "${subCategory.category.name}" (ID: ${subCategory.category_id})`, 400);
      }

      // Log if it's a nested subcategory
      if (subCategory.parent) {
        console.log(`✅ Updating product with nested subcategory: ${subCategory.name} (parent: ${subCategory.parent.name})`);
      }
    }
  } else if (productData.category_id && productData.category_id !== product.category_id) {
    // If category is being changed but sub_category_id is not provided,
    // check if existing subcategory belongs to new category
    if (product.sub_category_id) {
      const existingSubCategory = await prisma.subCategory.findUnique({
        where: { id: product.sub_category_id }
      });
      // If existing subcategory doesn't belong to new category, clear it
      if (existingSubCategory && existingSubCategory.category_id !== finalCategoryId) {
        productData.sub_category_id = null;
      }
    }
  }
  // Normalize images - convert array to JSON string for database storage
  if (productData.images !== undefined) {
    let imagesArray = [];

    if (Array.isArray(productData.images)) {
      // Already an array (from file uploads or direct array input)
      imagesArray = productData.images;
    } else if (typeof productData.images === "string") {
      if (productData.images.trim() === "" || productData.images.trim() === "null") {
        imagesArray = [];
      } else {
        try {
          imagesArray = JSON.parse(productData.images);
        } catch (e) {
          console.error("Error parsing images:", e);
          imagesArray = [];
        }
      }
    } else if (productData.images === null) {
      // Already null, keep it null
      imagesArray = [];
    }

    // Convert images array to JSON string for database storage
    // Set to null if empty array (Prisma expects String or Null)
    // This ensures that when images are cleared, they are properly set to null
    productData.images = imagesArray.length > 0 ? JSON.stringify(imagesArray) : null;
    console.log('💾 Final images value:', productData.images === null ? 'null (cleared)' : `${imagesArray.length} image(s)`);
  }

  // Normalize color_images - convert array to JSON string for database storage
  if (productData.color_images !== undefined) {
    let colorImagesArray = [];

    if (Array.isArray(productData.color_images)) {
      colorImagesArray = productData.color_images;
    } else if (typeof productData.color_images === "string") {
      if (productData.color_images.trim() === "") {
        colorImagesArray = [];
      } else {
        try {
          colorImagesArray = JSON.parse(productData.color_images);
        } catch (e) {
          console.error("Error parsing color_images:", e);
          colorImagesArray = [];
        }
      }
    }

    // Convert color_images array to JSON string for database storage
    productData.color_images = colorImagesArray.length > 0 ? JSON.stringify(colorImagesArray) : null;
  }

  // Handle variants
  let variantsData = null;
  if (req.body.variants !== undefined) {
    try {
      variantsData =
        typeof req.body.variants === "string"
          ? JSON.parse(req.body.variants)
          : req.body.variants;
    } catch (e) {
      console.error("Error parsing variants:", e);
    }
  }

  // Handle size/volume variants
  let sizeVolumeVariantsData = null;
  if (req.body.sizeVolumeVariants !== undefined) {
    try {
      sizeVolumeVariantsData =
        typeof req.body.sizeVolumeVariants === "string"
          ? JSON.parse(req.body.sizeVolumeVariants)
          : req.body.sizeVolumeVariants;
    } catch (e) {
      console.error("Error parsing sizeVolumeVariants:", e);
    }
  }

  // Remove non-Prisma fields that might be in the request
  const fieldsToRemove = ['replace_images', 'variants', 'sizeVolumeVariants'];
  fieldsToRemove.forEach(field => {
    delete productData[field];
  });

  // Clean productData - only include valid Prisma fields
  // List of valid Product model fields (excluding relations and auto-generated fields)
  const validProductFields = [
    'name', 'slug', 'sku', 'description', 'short_description',
    'category_id', 'sub_category_id', 'price', 'compare_at_price', 'cost_price',
    'stock_quantity', 'stock_status', 'images', 'color_images',
    'frame_shape', 'frame_material', 'frame_color', 'gender', 'lens_type',
    'lens_index_options', 'treatment_options', 'model_3d_url', 'try_on_image',
    'is_featured', 'is_active', 'meta_title', 'meta_description', 'meta_keywords',
    'product_type', 'contact_lens_brand', 'contact_lens_material', 'contact_lens_color',
    'contact_lens_type', 'replacement_frequency', 'water_content', 'powers_range',
    'base_curve_options', 'diameter_options', 'can_sleep_with', 'is_medical_device', 'has_uv_filter',
    'size_volume', 'pack_type', 'expiry_date' // Eye Hygiene fields
  ];

  // Handle expiry_date - convert string to DateTime or null
  if (productData.expiry_date !== undefined) {
    if (productData.expiry_date === '' || productData.expiry_date === null || productData.expiry_date === 'null') {
      productData.expiry_date = null;
    } else if (typeof productData.expiry_date === 'string') {
      try {
        // Try to parse the date string
        const date = new Date(productData.expiry_date);
        if (isNaN(date.getTime())) {
          productData.expiry_date = null;
        } else {
          productData.expiry_date = date;
        }
      } catch (e) {
        productData.expiry_date = null;
      }
    }
  }

  // Optional fields that should be null if empty string
  const optionalStringFields = [
    'description', 'short_description', 'frame_material', 'frame_color',
    'lens_index_options', 'treatment_options', 'model_3d_url', 'try_on_image',
    'meta_title', 'meta_description', 'meta_keywords',
    'contact_lens_brand', 'contact_lens_material', 'contact_lens_color',
    'contact_lens_type', 'replacement_frequency', 'water_content', 'powers_range',
    'base_curve_options', 'diameter_options', 'images', 'color_images',
    'size_volume', 'pack_type' // Eye Hygiene string fields
  ];

  // Filter productData to only include valid fields
  const cleanedProductData = {};
  for (const key of validProductFields) {
    if (productData[key] !== undefined) {
      // Convert empty strings to null for optional fields
      if (optionalStringFields.includes(key) && productData[key] === '') {
        cleanedProductData[key] = null;
      }
      // Handle images and color_images - ensure null is explicitly set when cleared
      else if ((key === 'images' || key === 'color_images') && (productData[key] === null || (Array.isArray(productData[key]) && productData[key].length === 0))) {
        cleanedProductData[key] = null;
      }
      // Handle sub_category_id - convert empty string to null
      else if (key === 'sub_category_id' && (productData[key] === '' || productData[key] === 'null' || productData[key] === null)) {
        cleanedProductData[key] = null;
      }
      // Handle boolean fields - ensure they're proper booleans
      else if ((key === 'is_featured' || key === 'is_active' || key === 'can_sleep_with' || key === 'is_medical_device' || key === 'has_uv_filter') && typeof productData[key] === 'string') {
        cleanedProductData[key] = productData[key] === 'true' || productData[key] === '1';
      }
      else {
        cleanedProductData[key] = productData[key];
      }
    }
  }

  // Convert category_id and sub_category_id to Prisma relation syntax if they exist
  const updateData = { ...cleanedProductData };

  // Handle category relation
  if (updateData.category_id !== undefined) {
    updateData.category = {
      connect: { id: updateData.category_id }
    };
    delete updateData.category_id;
  }

  // Handle subCategory relation
  if (updateData.sub_category_id !== undefined) {
    if (updateData.sub_category_id === null || updateData.sub_category_id === 'null' || updateData.sub_category_id === '') {
      updateData.subCategory = {
        disconnect: true
      };
    } else {
      updateData.subCategory = {
        connect: { id: updateData.sub_category_id }
      };
    }
    delete updateData.sub_category_id;
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: updateData,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  // Handle variants sync if provided
  if (variantsData !== null) {
    // Current approach: Delete and recreate variants for simplicity, or sync if IDs provided
    // For now, let's do a simple sync if IDs are present
    const existingVariants = await prisma.productVariant.findMany({
      where: { product_id: updatedProduct.id }
    });
    const existingVariantIds = existingVariants.map(v => v.id);
    const providedVariantIds = variantsData.filter(v => v.id).map(v => parseInt(v.id));

    // Delete variants not in the provided list
    const variantsToDelete = existingVariantIds.filter(vid => !providedVariantIds.includes(vid));
    if (variantsToDelete.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { id: { in: variantsToDelete } }
      });
    }

    // Update or create variants
    for (const variant of variantsData) {
      if (variant.id) {
        const { id: vid, ...vData } = variant;
        await prisma.productVariant.update({
          where: { id: parseInt(vid) },
          data: { ...vData, product_id: updatedProduct.id }
        });
      } else {
        await prisma.productVariant.create({
          data: { ...variant, product_id: updatedProduct.id }
        });
      }
    }
  }

  // Handle size/volume variants sync if provided
  if (sizeVolumeVariantsData !== null) {
    try {
      let existingSvv = [];
      try {
        existingSvv = await prisma.productSizeVolume.findMany({
          where: { product_id: updatedProduct.id }
        });
      } catch (err) {
        // If table doesn't exist, log warning and skip variant sync
        if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
          console.warn('⚠️  ProductSizeVolume table does not exist yet. Skipping variant sync. Run migration: npx prisma migrate deploy');
          existingSvv = [];
        } else {
          // Re-throw other errors
          throw err;
        }
      }

      // Only proceed if table exists and we got results (or empty array)
      if (existingSvv !== null) {
        const existingSvvIds = existingSvv.map(v => v.id);
        const providedSvvIds = sizeVolumeVariantsData.filter(v => v.id).map(v => parseInt(v.id));

        // Delete variants not in the provided list
        const svvToDelete = existingSvvIds.filter(svvid => !providedSvvIds.includes(svvid));
        if (svvToDelete.length > 0) {
          try {
            await prisma.productSizeVolume.deleteMany({
              where: { id: { in: svvToDelete } }
            });
          } catch (err) {
            if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
              console.warn('⚠️  ProductSizeVolume table does not exist. Skipping variant deletion.');
            } else {
              throw err;
            }
          }
        }

        // Update or create variants
        for (const variant of sizeVolumeVariantsData) {
          const vData = {
            size_volume: variant.size_volume || variant.sizeVolume || '',
            pack_type: variant.pack_type !== undefined ? (variant.pack_type || variant.packType || null) : undefined,
            expiry_date: variant.expiry_date || variant.expiryDate ? new Date(variant.expiry_date || variant.expiryDate) : (variant.expiry_date === null ? null : undefined),
            price: variant.price !== undefined ? parseFloat(variant.price) : undefined,
            compare_at_price: variant.compare_at_price !== undefined ? (variant.compare_at_price ? parseFloat(variant.compare_at_price) : null) : undefined,
            cost_price: variant.cost_price !== undefined ? (variant.cost_price ? parseFloat(variant.cost_price) : null) : undefined,
            stock_quantity: variant.stock_quantity !== undefined ? parseInt(variant.stock_quantity, 10) : undefined,
            stock_status: variant.stock_status || variant.stockStatus || undefined,
            sku: variant.sku !== undefined ? (variant.sku || null) : undefined,
            is_active: variant.is_active !== undefined ? (variant.is_active === 'true' || variant.is_active === true) : undefined,
            sort_order: variant.sort_order !== undefined ? parseInt(variant.sort_order, 10) : undefined,
            product_id: updatedProduct.id
          };

          // Remove undefined fields
          Object.keys(vData).forEach(key => vData[key] === undefined && delete vData[key]);

          try {
            if (variant.id) {
              await prisma.productSizeVolume.update({
                where: { id: parseInt(variant.id) },
                data: vData
              });
            } else {
              await prisma.productSizeVolume.create({
                data: vData
              });
            }
          } catch (err) {
            if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
              console.warn('⚠️  ProductSizeVolume table does not exist. Skipping variant create/update. Run migration: npx prisma migrate deploy');
            } else {
              throw err;
            }
          }
        }
      }
    } catch (err) {
      // Catch any other errors and log warning but don't fail the product update
      if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
        console.warn('⚠️  ProductSizeVolume table does not exist. Product updated but variants were not saved. Run migration: npx prisma migrate deploy');
      } else {
        // Re-throw non-table-existence errors
        throw err;
      }
    }
  }

  // Re-fetch product if variants were modified to include them in response
  let finalProduct = updatedProduct;
  if (variantsData !== null || sizeVolumeVariantsData !== null) {
    // Build include object - conditionally include sizeVolumeVariants if table exists
    const includeObject = {
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
      variants: true
    };

    try {
      finalProduct = await prisma.product.findUnique({
        where: { id: updatedProduct.id },
        include: {
          ...includeObject,
          sizeVolumeVariants: {
            orderBy: [
              { sort_order: 'asc' },
              { size_volume: 'asc' },
              { pack_type: 'asc' }
            ]
          }
        }
      });
    } catch (err) {
      // If error is about missing table/model, retry without sizeVolumeVariants
      if (err.code === 'P2001' || err.code === 'P2025' || err.message?.includes('Unknown model') || err.message?.includes('does not exist')) {
        console.warn('⚠️  ProductSizeVolume table does not exist yet. Fetching product without variants. Run migration: npx prisma migrate deploy');
        finalProduct = await prisma.product.findUnique({
          where: { id: updatedProduct.id },
          include: includeObject
        });
      } else {
        // Re-throw other errors
        throw err;
      }
    }
  }

  // Format images - parse JSON string to array for response
  let finalImages = finalProduct.images;
  if (typeof finalImages === 'string') {
    try {
      finalImages = JSON.parse(finalImages);
    } catch (e) {
      finalImages = [];
    }
  }
  if (!Array.isArray(finalImages)) {
    finalImages = finalImages ? [finalImages] : [];
  }

  // Format color_images - parse JSON string to array for response
  let finalColorImages = finalProduct.color_images;
  if (typeof finalColorImages === 'string') {
    try {
      finalColorImages = JSON.parse(finalColorImages);
    } catch (e) {
      finalColorImages = [];
    }
  }
  if (!Array.isArray(finalColorImages)) {
    finalColorImages = finalColorImages ? [finalColorImages] : [];
  }

  const formattedProduct = {
    ...finalProduct,
    images: finalImages,
    image: finalImages && finalImages.length > 0 ? finalImages[0] : null,
    color_images: finalColorImages
  };

  return success(res, "Product updated successfully", {
    product: formattedProduct,
  });
});

// @desc    Delete product (Admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });
  if (!product) {
    return error(res, "Product not found", 404);
  }

  // Delete images from S3
  // Parse images from JSON string if needed
  let imagesArray = [];
  if (product.images) {
    if (typeof product.images === 'string') {
      try {
        imagesArray = JSON.parse(product.images);
      } catch (e) {
        console.error("Error parsing images for deletion:", e);
        imagesArray = [];
      }
    } else if (Array.isArray(product.images)) {
      imagesArray = product.images;
    }
  }

  if (imagesArray.length > 0) {
    for (const imageUrl of imagesArray) {
      try {
        const key = imageUrl.split(".com/")[1];
        await deleteFromS3(key);
      } catch (err) {
        console.error("Error deleting image from S3:", err);
      }
    }
  }

  await prisma.product.delete({ where: { id: parseInt(id) } });

  return success(res, "Product deleted successfully");
});

// ==================== ORDERS ====================

// @desc    Get all orders (Admin) with filters
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    payment_status,
    search,
    start_date,
    end_date,
  } = req.query;

  const skip = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (payment_status) where.payment_status = payment_status;

  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) where.created_at.gte = new Date(start_date);
    if (end_date) {
      const end = new Date(end_date);
      end.setHours(23, 59, 59, 999);
      where.created_at.lte = end;
    }
  }

  if (search) {
    where.OR = [
      { order_number: { contains: search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      take: parseInt(limit, 10),
      skip: parseInt(skip, 10),
      orderBy: { created_at: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return success(res, "Orders retrieved successfully", {
    orders,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single order (Admin)
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
exports.getOrderDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
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
              lens_type: true,
              frame_material: true,
              frame_shape: true,
            },
          },
          prescription: true,
          progressiveVariant: true,
          lensThicknessMaterial: true,
          lensThicknessOption: true,
          photochromicColor: true,
          prescriptionSunColor: true,
        },
      },
      prescription: true,
    },
  });

  if (!order) {
    return error(res, "Order not found", 404);
  }

  // Parse JSON strings in order items
  const parsedOrder = {
    ...order,
    items: order.items.map(item => {
      const parsedItem = {
        ...item,
        lens_coatings: item.lens_coatings ? (typeof item.lens_coatings === 'string' ? JSON.parse(item.lens_coatings) : item.lens_coatings) : null,
        customization: item.customization ? (typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization) : null,
        prescription_data: item.prescription_data ? (typeof item.prescription_data === 'string' ? JSON.parse(item.prescription_data) : item.prescription_data) : null,
        treatment_ids: item.treatment_ids ? (typeof item.treatment_ids === 'string' ? JSON.parse(item.treatment_ids) : item.treatment_ids) : null
      };

      // Add formatted contact lens details
      const hasContactLensData = item.contact_lens_right_qty !== null ||
        item.contact_lens_left_qty !== null ||
        item.contact_lens_right_power !== null ||
        item.contact_lens_left_power !== null;

      if (hasContactLensData) {
        parsedItem.contact_lens_details = {
          right_eye: {
            quantity: item.contact_lens_right_qty,
            base_curve: item.contact_lens_right_base_curve,
            diameter: item.contact_lens_right_diameter,
            power: item.contact_lens_right_power
          },
          left_eye: {
            quantity: item.contact_lens_left_qty,
            base_curve: item.contact_lens_left_base_curve,
            diameter: item.contact_lens_left_diameter,
            power: item.contact_lens_left_power
          },
          astigmatism: parsedItem.customization && (parsedItem.customization.left_cylinder || parsedItem.customization.right_cylinder) ? {
            left_cylinder: parsedItem.customization.left_cylinder,
            right_cylinder: parsedItem.customization.right_cylinder,
            left_axis: parsedItem.customization.left_axis,
            right_axis: parsedItem.customization.right_axis
          } : null
        };
      } else {
        parsedItem.contact_lens_details = null;
      }

      return parsedItem;
    })
  };

  return success(res, "Order retrieved successfully", { order: parsedOrder });
});

// ==================== USERS ====================

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { first_name: { contains: search } },
      { last_name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        is_active: true,
        email_verified: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
      take: parseInt(limit),
      skip: parseInt(skip),
      orderBy: { created_at: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return success(res, "Users retrieved successfully", {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Create user (Admin)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, phone, role } = req.body;

  // 1. Basic validation
  if (!email || !password || !first_name || !last_name) {
    return error(res, "Please provide all required fields", 400);
  }

  // 2. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return error(res, "User already exists with this email", 400);
  }

  // 3. Validate role (only allow known roles)
  const allowedRoles = ["admin", "customer"]; // add more if you have, e.g. "staff"
  let finalRole = role || "admin";

  if (!allowedRoles.includes(finalRole)) {
    return error(res, `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`, 400);
  }

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 5. Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      first_name,
      last_name,
      phone,
      role: finalRole,
      is_active: true,       // usually admin-created users are active
      email_verified: true,  // admin created users are verified by default
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      phone: true,
      role: true,
      is_active: true,
      email_verified: true,
      avatar: true,
      created_at: true,
      updated_at: true,
    },
  });

  return success(res, "User created successfully", { user }, 201);
});


// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
  if (!user) {
    return error(res, "User not found", 404);
  }

  const updateData = {};
  if (req.body.role) updateData.role = req.body.role;
  if (req.body.is_active !== undefined)
    updateData.is_active = req.body.is_active;
  if (req.body.email_verified !== undefined)
    updateData.email_verified = req.body.email_verified;

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      phone: true,
      role: true,
      is_active: true,
      email_verified: true,
      avatar: true,
      created_at: true,
      updated_at: true,
    },
  });

  return success(res, "User updated successfully", { user: updatedUser });
});

// ==================== CATEGORIES ====================

// @desc    Get all categories (Admin)
// @route   GET /api/admin/categories
// @access  Private/Admin
exports.getAllCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, is_active, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      take: parseInt(limit),
      skip: skip,
      orderBy: { [sortBy]: sortOrder.toLowerCase() }
    }),
    prisma.category.count({ where })
  ]);

  return success(res, "Categories retrieved successfully", {
    categories,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single category (Admin)
// @route   GET /api/admin/categories/:id
// @access  Private/Admin
exports.getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) }
  });

  if (!category) {
    return error(res, "Category not found", 404);
  }

  return success(res, "Category retrieved successfully", { category });
});

// @desc    Create category (Admin)
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const categoryData = { ...req.body };

  if (!categoryData.slug) {
    categoryData.slug = categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const category = await prisma.category.create({
    data: categoryData,
  });

  return success(res, "Category created successfully", { category }, 201);
});

// @desc    Update category (Admin)
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
  });
  if (!category) {
    return error(res, "Category not found", 404);
  }

  const updatedCategory = await prisma.category.update({
    where: { id: parseInt(id) },
    data: req.body,
  });

  return success(res, "Category updated successfully", {
    category: updatedCategory,
  });
});

// @desc    Delete category (Admin)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id: parseInt(id) },
  });
  if (!category) {
    return error(res, "Category not found", 404);
  }

  await prisma.category.delete({ where: { id: parseInt(id) } });

  return success(res, "Category deleted successfully");
});

// ==================== FRAME SIZES ====================

// @desc    Get all frame sizes (Admin)
// @route   GET /api/admin/frame-sizes
// @access  Private/Admin
exports.getAllFrameSizes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, product_id, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    where.OR = [
      { size_label: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (product_id) {
    where.product_id = parseInt(product_id);
  }

  const [frameSizes, total] = await Promise.all([
    prisma.frameSize.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      take: parseInt(limit),
      skip: skip,
      orderBy: { [sortBy]: sortOrder.toLowerCase() }
    }),
    prisma.frameSize.count({ where })
  ]);

  return success(res, "Frame sizes retrieved successfully", {
    frameSizes,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single frame size (Admin)
// @route   GET /api/admin/frame-sizes/:id
// @access  Private/Admin
exports.getFrameSize = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const frameSize = await prisma.frameSize.findUnique({
    where: { id: parseInt(id) },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!frameSize) {
    return error(res, "Frame size not found", 404);
  }

  return success(res, "Frame size retrieved successfully", { frameSize });
});

// @desc    Create frame size (Admin)
// @route   POST /api/admin/frame-sizes
// @access  Private/Admin
exports.createFrameSize = asyncHandler(async (req, res) => {
  const frameSizeData = { ...req.body };

  // Validate product_id is required
  if (!frameSizeData.product_id) {
    return error(res, "Product ID is required", 400);
  }

  const productId = parseInt(frameSizeData.product_id, 10);
  if (isNaN(productId)) {
    return error(res, "Invalid product ID", 400);
  }

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    return error(res, `Product with ID ${productId} not found`, 404);
  }

  frameSizeData.product_id = productId;

  const frameSize = await prisma.frameSize.create({
    data: frameSizeData,
  });
  return success(res, "Frame size created successfully", { frameSize }, 201);
});

// @desc    Update frame size (Admin)
// @route   PUT /api/admin/frame-sizes/:id
// @access  Private/Admin
exports.updateFrameSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const frameSizeData = { ...req.body };

  // Check if frame size exists
  const existingFrameSize = await prisma.frameSize.findUnique({
    where: { id: parseInt(id) },
  });
  if (!existingFrameSize) {
    return error(res, "Frame size not found", 404);
  }

  // Validate product_id if provided
  if (frameSizeData.product_id !== undefined) {
    const productId = parseInt(frameSizeData.product_id, 10);
    if (isNaN(productId)) {
      return error(res, "Invalid product ID", 400);
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return error(res, `Product with ID ${productId} not found`, 404);
    }

    frameSizeData.product_id = productId;
  }

  const frameSize = await prisma.frameSize.update({
    where: { id: parseInt(id) },
    data: frameSizeData,
  });
  return success(res, "Frame size updated successfully", { frameSize });
});

// @desc    Delete frame size (Admin)
// @route   DELETE /api/admin/frame-sizes/:id
// @access  Private/Admin
exports.deleteFrameSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.frameSize.delete({ where: { id: parseInt(id) } });
  return success(res, "Frame size deleted successfully");
});

// ==================== LENS TYPES ====================

// @desc    Get all lens types (Admin)
// @route   GET /api/admin/lens-types
// @access  Private/Admin
exports.getAllLensTypes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, is_active, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  const [lensTypes, total] = await Promise.all([
    prisma.lensType.findMany({
      where,
      take: parseInt(limit),
      skip: skip,
      orderBy: { [sortBy]: sortOrder.toLowerCase() }
    }),
    prisma.lensType.count({ where })
  ]);

  return success(res, "Lens types retrieved successfully", {
    lensTypes,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single lens type (Admin)
// @route   GET /api/admin/lens-types/:id
// @access  Private/Admin
exports.getLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lensType = await prisma.lensType.findUnique({
    where: { id: parseInt(id) }
  });

  if (!lensType) {
    return error(res, "Lens type not found", 404);
  }

  return success(res, "Lens type retrieved successfully", { lensType });
});

// @desc    Create lens type (Admin)
// @route   POST /api/admin/lens-types
// @access  Private/Admin
exports.createLensType = asyncHandler(async (req, res) => {
  const lensTypeData = { ...req.body };

  if (!lensTypeData.slug) {
    lensTypeData.slug = lensTypeData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const lensType = await prisma.lensType.create({
    data: lensTypeData,
  });
  return success(res, "Lens type created successfully", { lensType }, 201);
});

// @desc    Update lens type (Admin)
// @route   PUT /api/admin/lens-types/:id
// @access  Private/Admin
exports.updateLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if lens type exists
  const existingLensType = await prisma.lensType.findUnique({
    where: { id: parseInt(id) },
  });
  if (!existingLensType) {
    return error(res, "Lens type not found", 404);
  }

  const lensType = await prisma.lensType.update({
    where: { id: parseInt(id) },
    data: req.body,
  });
  return success(res, "Lens type updated successfully", { lensType });
});

// @desc    Delete lens type (Admin)
// @route   DELETE /api/admin/lens-types/:id
// @access  Private/Admin
exports.deleteLensType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lensType = await prisma.lensType.findUnique({
    where: { id: parseInt(id) },
  });
  if (!lensType) {
    return error(res, "Lens type not found", 404);
  }

  await prisma.lensType.delete({ where: { id: parseInt(id) } });
  return success(res, "Lens type deleted successfully");
});

// ==================== LENS COATINGS ====================

// @desc    Get all lens coatings (Admin)
// @route   GET /api/admin/lens-coatings
// @access  Private/Admin
exports.getAllLensCoatings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, is_active, type, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  // Apply filters
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  if (type) {
    where.type = type;
  }

  const [lensCoatings, total] = await Promise.all([
    prisma.lensCoating.findMany({
      where,
      take: parseInt(limit),
      skip: skip,
      orderBy: { [sortBy]: sortOrder.toLowerCase() }
    }),
    prisma.lensCoating.count({ where })
  ]);

  return success(res, "Lens coatings retrieved successfully", {
    lensCoatings,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    Get single lens coating (Admin)
// @route   GET /api/admin/lens-coatings/:id
// @access  Private/Admin
exports.getLensCoating = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lensCoating = await prisma.lensCoating.findUnique({
    where: { id: parseInt(id) }
  });

  if (!lensCoating) {
    return error(res, "Lens coating not found", 404);
  }

  return success(res, "Lens coating retrieved successfully", { lensCoating });
});

// @desc    Create lens coating (Admin)
// @route   POST /api/admin/lens-coatings
// @access  Private/Admin
exports.createLensCoating = asyncHandler(async (req, res) => {
  const coatingData = { ...req.body };

  if (!coatingData.slug) {
    coatingData.slug = coatingData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const lensCoating = await prisma.lensCoating.create({
    data: coatingData,
  });
  return success(
    res,
    "Lens coating created successfully",
    { lensCoating },
    201
  );
});

// @desc    Update lens coating (Admin)
// @route   PUT /api/admin/lens-coatings/:id
// @access  Private/Admin
exports.updateLensCoating = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if lens coating exists
  const existingLensCoating = await prisma.lensCoating.findUnique({
    where: { id: parseInt(id) },
  });
  if (!existingLensCoating) {
    return error(res, "Lens coating not found", 404);
  }

  const lensCoating = await prisma.lensCoating.update({
    where: { id: parseInt(id) },
    data: req.body,
  });
  return success(res, "Lens coating updated successfully", { lensCoating });
});

// @desc    Delete lens coating (Admin)
// @route   DELETE /api/admin/lens-coatings/:id
// @access  Private/Admin
exports.deleteLensCoating = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lensCoating = await prisma.lensCoating.findUnique({
    where: { id: parseInt(id) },
  });
  if (!lensCoating) {
    return error(res, "Lens coating not found", 404);
  }

  await prisma.lensCoating.delete({ where: { id: parseInt(id) } });
  return success(res, "Lens coating deleted successfully");
});

// ==================== BULK UPLOAD ====================

// @desc    Bulk upload products (Admin)
// @route   POST /api/admin/products/bulk-upload
// @access  Private/Admin
exports.bulkUploadProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    return error(res, "Please upload a CSV file", 400);
  }

  const results = [];
  const stream = Readable.from(req.file.buffer.toString());

  stream
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        const createdProducts = [];
        for (const item of results) {
          // Basic validation and transformation
          if (!item.name || !item.sku) continue;

          const slug =
            item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

          // Check if product exists
          const existing = await prisma.product.findFirst({
            where: { OR: [{ sku: item.sku }, { slug }] },
          });

          if (existing) continue; // Skip duplicates for now

          const categoryId = parseInt(item.category_id || 1);

          // Validate category exists
          const category = await prisma.category.findUnique({
            where: { id: categoryId },
          });
          if (!category) {
            console.warn(`Skipping product ${item.name}: Category ${categoryId} not found`);
            continue;
          }

          const product = await prisma.product.create({
            data: {
              name: item.name,
              slug,
              sku: item.sku,
              description: item.description,
              price: parseFloat(item.price || 0),
              category_id: categoryId,
              stock_quantity: parseInt(item.stock_quantity || 0),
              product_type: item.product_type || "frame",
              gender: item.gender || "unisex",
            },
          });
          createdProducts.push(product);
        }

        return success(
          res,
          `Processed ${results.length} items. Created ${createdProducts.length} products.`,
          {
            count: createdProducts.length,
          }
        );
      } catch (err) {
        console.error("Bulk upload error:", err);
        return error(res, "Error processing bulk upload", 500);
      }
    });
});
