const prisma = require("../lib/prisma");
const asyncHandler = require("../middleware/asyncHandler");
const { success, error } = require("../utils/response");
const { uploadToS3, deleteFromS3 } = require("../config/aws");
const csv = require("csv-parser");
const { Readable } = require("stream");
const bcrypt = require('bcryptjs');

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

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
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
      },
      take: parseInt(limit),
      skip: skip,
      orderBy: { [validSortBy]: validSortOrder }
    }),
    prisma.product.count({ where })
  ]);

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

    // Create colors array for frontend color swatches
    const colors = colorImages.map((colorData, index) => ({
      name: colorData.color || `Color ${index + 1}`,
      value: colorData.color?.toLowerCase() || `color-${index + 1}`,
      images: Array.isArray(colorData.images) ? colorData.images : (colorData.images ? [colorData.images] : []),
      primaryImage: Array.isArray(colorData.images) && colorData.images.length > 0 
        ? colorData.images[0] 
        : (colorData.images || null),
      hexCode: getColorHexCode(colorData.color) || '#000000'
    }));

    // Determine default/selected color
    const defaultColor = colors.length > 0 ? colors[0].value : null;
    const currentImages = defaultColor && colors.length > 0 
      ? colors[0].images.length > 0 
        ? colors[0].images 
        : images
      : images;

    // Get first image URL for easy access in frontend
    const firstImage = currentImages && currentImages.length > 0 ? currentImages[0] : (images && images.length > 0 ? images[0] : null);

    return {
      ...product,
      images,
      // Add first image URL for easy access in frontend
      image: firstImage,
      // Also add thumbnail for backward compatibility
      thumbnail: firstImage,
      color_images: colorImages,
      colors: colors, // Array of color objects for swatches
      selectedColor: defaultColor, // Default selected color value
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

// @desc    Get single product (Admin)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
exports.getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
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
    }
  });

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

    // Handle image uploads if present
    if (req.files && req.files.images) {
      try {
        const imageUrls = [];
        for (const file of req.files.images) {
          const url = await uploadToS3(file, "products");
          imageUrls.push(url);
        }
        productData.images = imageUrls; // Keep as array, will be normalized later
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return error(res, `Image upload failed: ${uploadError.message}`, 500);
      }
    }

    // Handle color-specific image uploads
    // Expected format: color_images[color_name] = [files]
    // Or color_images as JSON string in body: [{color: "black", images: ["url1", "url2"]}]
    // Also handle file uploads with field names like color_images_black, color_images_brown, etc.
    const hasColorImagesInBody = req.body.color_images;
    const hasColorImageFiles = req.files && Object.keys(req.files).some(key => key.startsWith('color_images_'));
    
    if (hasColorImagesInBody || hasColorImageFiles) {
      try {
        let colorImagesData = [];
        
        // If color_images is provided in body, parse it
        if (hasColorImagesInBody) {
          if (typeof req.body.color_images === 'string') {
            try {
              colorImagesData = JSON.parse(req.body.color_images);
            } catch (e) {
              console.error("Error parsing color_images JSON:", e);
              colorImagesData = [];
            }
          } else if (Array.isArray(req.body.color_images)) {
            colorImagesData = req.body.color_images;
          }
        }

        // Handle file uploads for color images
        // Look for files with pattern: color_images_<color_name>
        const colorImageFiles = {};
        Object.keys(req.files || {}).forEach(key => {
          if (key.startsWith('color_images_')) {
            const colorName = key.replace('color_images_', '');
            if (!colorImageFiles[colorName]) {
              colorImageFiles[colorName] = [];
            }
            const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
            files.forEach(file => colorImageFiles[colorName].push(file));
          }
        });

        // Upload color-specific images and build color_images structure
        const colorImagesMap = {};
        
        // Process uploaded files
        for (const [colorName, files] of Object.entries(colorImageFiles)) {
          const imageUrls = [];
          for (const file of files) {
            const url = await uploadToS3(file, `products/colors/${colorName}`);
            imageUrls.push(url);
          }
          colorImagesMap[colorName] = imageUrls;
        }

        // Merge with existing color_images data from body
        if (Array.isArray(colorImagesData) && colorImagesData.length > 0) {
          colorImagesData.forEach(item => {
            if (item.color && item.images) {
              // If images are URLs, use them; otherwise merge with uploaded files
              const existingUrls = Array.isArray(item.images) ? item.images : [];
              const uploadedUrls = colorImagesMap[item.color] || [];
              colorImagesMap[item.color] = [...existingUrls, ...uploadedUrls];
            }
          });
        }

        // Convert to array format: [{color: "black", images: ["url1", "url2"]}, ...]
        const colorImagesArray = Object.entries(colorImagesMap).map(([color, images]) => ({
          color,
          images: Array.isArray(images) ? images : [images]
        }));

        if (colorImagesArray.length > 0) {
          productData.color_images = JSON.stringify(colorImagesArray);
        }
      } catch (uploadError) {
        console.error("Color image upload error:", uploadError);
        return error(res, `Color image upload failed: ${uploadError.message}`, 500);
      }
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

      // Check if slug exists and make it unique if needed
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await prisma.product.findUnique({
          where: { slug },
          select: { id: true }
        });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      productData.slug = slug;
    } else {
      // If slug is provided, check if it's unique
      const existing = await prisma.product.findUnique({
        where: { slug: productData.slug },
        select: { id: true }
      });
      if (existing) {
        return error(res, `A product with slug "${productData.slug}" already exists. Please use a different slug.`, 400);
      }
    }

    // Check if SKU already exists
    if (productData.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: productData.sku },
        select: { id: true }
      });
      if (existingSku) {
        return error(res, `A product with SKU "${productData.sku}" already exists. SKU must be unique.`, 400);
      }
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

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: productData.category_id },
    });
    if (!category) {
      return error(res, `Category with ID ${productData.category_id} not found`, 404);
    }

    // Validate sub_category_id if provided
    if (productData.sub_category_id) {
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
    const validProductTypes = ['frame', 'sunglasses', 'contact_lens', 'accessory'];
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
        'sunglass': 'sunglasses',
        'accessories': 'accessory'
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

    // Validate and normalize frame_shape enum
    if (productData.frame_shape !== undefined && productData.frame_shape !== null && productData.frame_shape !== '') {
      const validFrameShapes = ['round', 'square', 'oval', 'cat_eye', 'aviator', 'rectangle', 'wayfarer', 'geometric'];
      const frameShape = String(productData.frame_shape).toLowerCase().trim();

      const frameShapeMap = {
        'cat-eye': 'cat_eye',
        'cat eye': 'cat_eye'
      };

      const normalizedShape = frameShapeMap[frameShape] || frameShape;

      if (!validFrameShapes.includes(normalizedShape)) {
        return error(res, `Invalid frame_shape "${productData.frame_shape}". Valid values are: ${validFrameShapes.join(', ')}`, 400);
      }

      productData.frame_shape = normalizedShape;
    }

    // Validate and normalize frame_material enum
    if (productData.frame_material !== undefined && productData.frame_material !== null && productData.frame_material !== '') {
      const validFrameMaterials = ['acetate', 'metal', 'tr90', 'titanium', 'wood', 'mixed'];
      const frameMaterial = String(productData.frame_material).toLowerCase().trim();

      if (!validFrameMaterials.includes(frameMaterial)) {
        return error(res, `Invalid frame_material "${productData.frame_material}". Valid values are: ${validFrameMaterials.join(', ')}`, 400);
      }

      productData.frame_material = frameMaterial;
    }

    // Validate and normalize lens_type enum (LensTypeEnum)
    if (productData.lens_type !== undefined && productData.lens_type !== null && productData.lens_type !== '') {
      const validLensTypes = ['prescription', 'sunglasses', 'reading', 'computer', 'photochromic', 'plastic', 'glass', 'polycarbonate', 'trivex', 'high_index'];
      const lensType = String(productData.lens_type).toLowerCase().trim();

      if (!validLensTypes.includes(lensType)) {
        return error(res, `Invalid lens_type "${productData.lens_type}". Valid values are: ${validLensTypes.join(', ')}`, 400);
      }

      productData.lens_type = lensType;
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

    // Create the product first
    const product = await prisma.product.create({
      data: productData,
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

    // Create variants separately if any exist
    if (variantsData && variantsData.length > 0) {
      await prisma.productVariant.createMany({
        data: variantsData.map((variant) => ({
          ...variant,
          product_id: product.id,
        })),
      });

      // Fetch the product with variants to return
      const productWithVariants = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          variants: true,
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
        },
      });

      // Format images for product with variants
      let variantImages = productWithVariants.images;
      if (typeof variantImages === 'string') {
        try {
          variantImages = JSON.parse(variantImages);
        } catch (e) {
          variantImages = [];
        }
      }
      if (!Array.isArray(variantImages)) {
        variantImages = variantImages ? [variantImages] : [];
      }

      // Format color_images for product with variants
      let variantColorImages = productWithVariants.color_images;
      if (typeof variantColorImages === 'string') {
        try {
          variantColorImages = JSON.parse(variantColorImages);
        } catch (e) {
          variantColorImages = [];
        }
      }
      if (!Array.isArray(variantColorImages)) {
        variantColorImages = variantColorImages ? [variantColorImages] : [];
      }

      const formattedProductWithVariants = {
        ...productWithVariants,
        images: variantImages,
        image: variantImages && variantImages.length > 0 ? variantImages[0] : null,
        color_images: variantColorImages
      };

      return success(res, "Product created successfully", { product: formattedProductWithVariants }, 201);
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

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });
  if (!product) {
    return error(res, "Product not found", 404);
  }

  // Handle image uploads
  if (req.files && req.files.images) {
    // Parse existing images from JSON string to array
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

    // Upload new images and add to existing
    const imageUrls = [...existingImages];
    for (const file of req.files.images) {
      const url = await uploadToS3(file, "products");
      imageUrls.push(url);
    }
    productData.images = imageUrls; // Will be converted to JSON string later
  }

  // Handle color-specific image uploads (same logic as create)
  if (req.body.color_images || (req.files && Object.keys(req.files).some(key => key.startsWith('color_images_')))) {
    try {
      let colorImagesData = [];
      
      // Parse existing color_images
      if (product.color_images) {
        try {
          colorImagesData = typeof product.color_images === 'string'
            ? JSON.parse(product.color_images)
            : (Array.isArray(product.color_images) ? product.color_images : []);
        } catch (e) {
          console.error("Error parsing existing color_images:", e);
          colorImagesData = [];
        }
      }

      // If color_images is provided in body, use it (replaces existing)
      if (req.body.color_images) {
        if (typeof req.body.color_images === 'string') {
          try {
            colorImagesData = JSON.parse(req.body.color_images);
          } catch (e) {
            console.error("Error parsing color_images JSON:", e);
            colorImagesData = [];
          }
        } else if (Array.isArray(req.body.color_images)) {
          colorImagesData = req.body.color_images;
        }
      }

      // Handle file uploads for color images
      const colorImageFiles = {};
      Object.keys(req.files || {}).forEach(key => {
        if (key.startsWith('color_images_')) {
          const colorName = key.replace('color_images_', '');
          if (!colorImageFiles[colorName]) {
            colorImageFiles[colorName] = [];
          }
          const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
          files.forEach(file => colorImageFiles[colorName].push(file));
        }
      });

      // Upload color-specific images
      const colorImagesMap = {};
      
      // Start with existing color_images data
      if (Array.isArray(colorImagesData) && colorImagesData.length > 0) {
        colorImagesData.forEach(item => {
          if (item.color && item.images) {
            colorImagesMap[item.color] = Array.isArray(item.images) ? item.images : [item.images];
          }
        });
      }

      // Upload new color images and merge
      for (const [colorName, files] of Object.entries(colorImageFiles)) {
        const imageUrls = [];
        for (const file of files) {
          const url = await uploadToS3(file, `products/colors/${colorName}`);
          imageUrls.push(url);
        }
        // Merge with existing or create new
        if (colorImagesMap[colorName]) {
          colorImagesMap[colorName] = [...colorImagesMap[colorName], ...imageUrls];
        } else {
          colorImagesMap[colorName] = imageUrls;
        }
      }

      // Convert to array format
      const colorImagesArray = Object.entries(colorImagesMap).map(([color, images]) => ({
        color,
        images: Array.isArray(images) ? images : [images]
      }));

      productData.color_images = colorImagesArray.length > 0 ? JSON.stringify(colorImagesArray) : null;
    } catch (uploadError) {
      console.error("Color image upload error:", uploadError);
      return error(res, `Color image upload failed: ${uploadError.message}`, 500);
    }
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
    const validProductTypes = ['frame', 'sunglasses', 'contact_lens', 'accessory'];
    const productType = String(productData.product_type).toLowerCase().trim();

    // Map common invalid values to valid ones
    const productTypeMap = {
      'lens': 'contact_lens',
      'lenses': 'contact_lens',
      'contact': 'contact_lens',
      'glasses': 'frame',
      'eyeglass': 'frame',
      'eyeglasses': 'frame',
      'sunglass': 'sunglasses',
      'accessories': 'accessory'
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

  // Validate and normalize frame_shape enum if provided
  if (productData.frame_shape !== undefined && productData.frame_shape !== null && productData.frame_shape !== '') {
    const validFrameShapes = ['round', 'square', 'oval', 'cat_eye', 'aviator', 'rectangle', 'wayfarer', 'geometric'];
    const frameShape = String(productData.frame_shape).toLowerCase().trim();

    const frameShapeMap = {
      'cat-eye': 'cat_eye',
      'cat eye': 'cat_eye'
    };

    const normalizedShape = frameShapeMap[frameShape] || frameShape;

    if (!validFrameShapes.includes(normalizedShape)) {
      return error(res, `Invalid frame_shape "${productData.frame_shape}". Valid values are: ${validFrameShapes.join(', ')}`, 400);
    }

    productData.frame_shape = normalizedShape;
  }

  // Validate and normalize frame_material enum if provided
  if (productData.frame_material !== undefined && productData.frame_material !== null && productData.frame_material !== '') {
    const validFrameMaterials = ['acetate', 'metal', 'tr90', 'titanium', 'wood', 'mixed'];
    const frameMaterial = String(productData.frame_material).toLowerCase().trim();

    if (!validFrameMaterials.includes(frameMaterial)) {
      return error(res, `Invalid frame_material "${productData.frame_material}". Valid values are: ${validFrameMaterials.join(', ')}`, 400);
    }

    productData.frame_material = frameMaterial;
  }

  // Validate and normalize lens_type enum (LensTypeEnum) if provided
  if (productData.lens_type !== undefined && productData.lens_type !== null && productData.lens_type !== '') {
    const validLensTypes = ['prescription', 'sunglasses', 'reading', 'computer', 'photochromic', 'plastic', 'glass', 'polycarbonate', 'trivex', 'high_index'];
    const lensType = String(productData.lens_type).toLowerCase().trim();

    if (!validLensTypes.includes(lensType)) {
      return error(res, `Invalid lens_type "${productData.lens_type}". Valid values are: ${validLensTypes.join(', ')}`, 400);
    }

    productData.lens_type = lensType;
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
    }

    // Convert images array to JSON string for database storage
    // Set to null if empty array (Prisma expects String or Null)
    productData.images = imagesArray.length > 0 ? JSON.stringify(imagesArray) : null;
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

  // Remove non-Prisma fields that might be in the request
  const fieldsToRemove = ['replace_images', 'variants'];
  fieldsToRemove.forEach(field => {
    delete productData[field];
  });

  // Convert category_id and sub_category_id to Prisma relation syntax if they exist
  const updateData = { ...productData };
  
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
    where: { id: parseInt(id) },
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

  // Format images - parse JSON string to array for response
  let images = updatedProduct.images;
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
  let colorImages = updatedProduct.color_images;
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
    ...updatedProduct,
    images,
    image: images && images.length > 0 ? images[0] : null,
    color_images: colorImages
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
        },
      },
      prescription: true,
    },
  });

  if (!order) {
    return error(res, "Order not found", 404);
  }

  return success(res, "Order retrieved successfully", { order });
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
