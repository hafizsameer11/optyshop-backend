const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// =============== PUBLIC NAVIGATION =================

// @desc    Get all active menus with nested items
// @route   GET /api/navigation
// @access  Public
exports.getActiveMenus = asyncHandler(async (req, res) => {
  const menus = await prisma.navigationMenu.findMany({
    where: { is_active: true },
    include: {
      items: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    },
    orderBy: { id: 'asc' }
  });

  const data = menus.map((menu) => ({
    ...menu,
    items: buildTree(menu.items)
  }));

  return success(res, 'Navigation menus retrieved successfully', { menus: data });
});

// @desc    Get a single active menu (by code) with nested items
// @route   GET /api/navigation/:code
// @access  Public
exports.getMenuByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const menu = await prisma.navigationMenu.findFirst({
    where: { code, is_active: true },
    include: {
      items: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  if (!menu) {
    return error(res, 'Navigation menu not found', 404);
  }

  const tree = buildTree(menu.items);
  return success(res, 'Navigation menu retrieved successfully', { menu: { ...menu, items: tree } });
});

// Helper: build tree from flat items using parent_id
function buildTree(items) {
  const byId = {};
  const roots = [];

  items.forEach((item) => {
    byId[item.id] = { ...item, children: [] };
  });

  items.forEach((item) => {
    const node = byId[item.id];
    if (item.parent_id && byId[item.parent_id]) {
      byId[item.parent_id].children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children arrays by sort_order
  const sortChildren = (nodes) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((child) => {
      if (child.children && child.children.length > 0) {
        sortChildren(child.children);
      }
    });
  };

  sortChildren(roots);
  return roots;
}

// =============== ADMIN MENUS =================

// @desc    Get all menus (admin)
// @route   GET /api/admin/menus
// @access  Private/Admin
exports.getAllMenus = asyncHandler(async (req, res) => {
  const menus = await prisma.navigationMenu.findMany({
    orderBy: { created_at: 'desc' }
  });

  return success(res, 'Navigation menus retrieved successfully', { menus });
});

// @desc    Get single menu with flat items (admin)
// @route   GET /api/admin/menus/:id
// @access  Private/Admin
exports.getMenuAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menu = await prisma.navigationMenu.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      items: {
        orderBy: { sort_order: 'asc' }
      }
    }
  });

  if (!menu) {
    return error(res, 'Navigation menu not found', 404);
  }

  return success(res, 'Navigation menu retrieved successfully', { menu });
});

// @desc    Create a new navigation menu
// @route   POST /api/admin/menus
// @access  Private/Admin
exports.createMenu = asyncHandler(async (req, res) => {
  const { name, code, description, is_active } = req.body;

  if (!name || !code) {
    return error(res, 'Name and code are required', 400);
  }

  const existing = await prisma.navigationMenu.findUnique({
    where: { code }
  });

  if (existing) {
    return error(res, 'A menu with this code already exists', 400);
  }

  const menu = await prisma.navigationMenu.create({
    data: {
      name,
      code,
      description: description || null,
      is_active: is_active === 'false' ? false : true
    }
  });

  return success(res, 'Navigation menu created successfully', { menu }, 201);
});

// @desc    Update a navigation menu
// @route   PUT /api/admin/menus/:id
// @access  Private/Admin
exports.updateMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, description, is_active } = req.body;

  const menu = await prisma.navigationMenu.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!menu) {
    return error(res, 'Navigation menu not found', 404);
  }

  // If code is being changed, ensure uniqueness
  if (code && code !== menu.code) {
    const existing = await prisma.navigationMenu.findUnique({
      where: { code }
    });
    if (existing) {
      return error(res, 'Another menu with this code already exists', 400);
    }
  }

  const updated = await prisma.navigationMenu.update({
    where: { id: menu.id },
    data: {
      name: name !== undefined ? name : menu.name,
      code: code !== undefined ? code : menu.code,
      description: description !== undefined ? description : menu.description,
      is_active:
        is_active !== undefined
          ? is_active === 'true' || is_active === true || is_active === '1' || is_active === 1
          : menu.is_active
    }
  });

  return success(res, 'Navigation menu updated successfully', { menu: updated });
});

// @desc    Delete a navigation menu (and its items)
// @route   DELETE /api/admin/menus/:id
// @access  Private/Admin
exports.deleteMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menu = await prisma.navigationMenu.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!menu) {
    return error(res, 'Navigation menu not found', 404);
  }

  await prisma.navigationMenu.delete({
    where: { id: menu.id }
  });

  return success(res, 'Navigation menu deleted successfully');
});

// =============== ADMIN MENU ITEMS =================

// @desc    Get menu items (optionally by menu_id / parent_id)
// @route   GET /api/admin/menu-items
// @access  Private/Admin
exports.getMenuItems = asyncHandler(async (req, res) => {
  const { menu_id, parent_id } = req.query;

  const where = {};
  if (menu_id) {
    where.menu_id = parseInt(menu_id, 10);
  }
  if (parent_id) {
    where.parent_id = parseInt(parent_id, 10);
  }

  const items = await prisma.navigationItem.findMany({
    where,
    orderBy: { sort_order: 'asc' }
  });

  return success(res, 'Navigation items retrieved successfully', { items });
});

// @desc    Create a menu item
// @route   POST /api/admin/menu-items
// @access  Private/Admin
exports.createMenuItem = asyncHandler(async (req, res) => {
  const {
    menu_id,
    parent_id,
    label,
    slug,
    url,
    icon,
    sort_order,
    is_active,
    is_featured,
    meta
  } = req.body;

  if (!menu_id || !label) {
    return error(res, 'menu_id and label are required', 400);
  }

  const menuId = parseInt(menu_id, 10);
  const parentId = parent_id ? parseInt(parent_id, 10) : null;

  // Ensure menu exists
  const menu = await prisma.navigationMenu.findUnique({
    where: { id: menuId }
  });
  if (!menu) {
    return error(res, `Navigation menu with id ${menuId} not found`, 404);
  }

  // If parentId is provided, ensure it belongs to same menu
  if (parentId) {
    const parent = await prisma.navigationItem.findUnique({
      where: { id: parentId }
    });
    if (!parent || parent.menu_id !== menuId) {
      return error(res, 'Parent item not found in this menu', 400);
    }
  }

  let metaString = null;
  if (meta !== undefined) {
    if (typeof meta === 'string') {
      metaString = meta;
    } else {
      // Assume object/array, store as JSON
      metaString = JSON.stringify(meta);
    }
  }

  const item = await prisma.navigationItem.create({
    data: {
      menu_id: menuId,
      parent_id: parentId,
      label,
      slug: slug || null,
      url: url || null,
      icon: icon || null,
      sort_order: sort_order !== undefined ? parseInt(sort_order, 10) || 0 : 0,
      is_active: is_active === undefined ? true : isTruthy(is_active),
      is_featured: is_featured ? isTruthy(is_featured) : false,
      meta: metaString
    }
  });

  return success(res, 'Navigation item created successfully', { item }, 201);
});

// @desc    Update a menu item
// @route   PUT /api/admin/menu-items/:id
// @access  Private/Admin
exports.updateMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    menu_id,
    parent_id,
    label,
    slug,
    url,
    icon,
    sort_order,
    is_active,
    is_featured,
    meta
  } = req.body;

  const existing = await prisma.navigationItem.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!existing) {
    return error(res, 'Navigation item not found', 404);
  }

  const data = {};

  if (menu_id !== undefined) {
    const menuId = parseInt(menu_id, 10);
    const menu = await prisma.navigationMenu.findUnique({
      where: { id: menuId }
    });
    if (!menu) {
      return error(res, `Navigation menu with id ${menuId} not found`, 404);
    }
    data.menu_id = menuId;
  }

  if (parent_id !== undefined) {
    const parentId = parent_id ? parseInt(parent_id, 10) : null;
    if (parentId) {
      const parent = await prisma.navigationItem.findUnique({
        where: { id: parentId }
      });
      if (!parent) {
        return error(res, 'Parent item not found', 404);
      }
      // Ensure same menu if menu_id is being changed or keep existing
      const targetMenuId = data.menu_id || existing.menu_id;
      if (parent.menu_id !== targetMenuId) {
        return error(res, 'Parent item must belong to the same menu', 400);
      }
    }
    data.parent_id = parentId;
  }

  if (label !== undefined) data.label = label;
  if (slug !== undefined) data.slug = slug || null;
  if (url !== undefined) data.url = url || null;
  if (icon !== undefined) data.icon = icon || null;
  if (sort_order !== undefined) {
    data.sort_order = parseInt(sort_order, 10) || 0;
  }
  if (is_active !== undefined) {
    data.is_active = isTruthy(is_active);
  }
  if (is_featured !== undefined) {
    data.is_featured = isTruthy(is_featured);
  }
  if (meta !== undefined) {
    if (meta === null || meta === '') {
      data.meta = null;
    } else if (typeof meta === 'string') {
      data.meta = meta;
    } else {
      data.meta = JSON.stringify(meta);
    }
  }

  const item = await prisma.navigationItem.update({
    where: { id: existing.id },
    data
  });

  return success(res, 'Navigation item updated successfully', { item });
});

// @desc    Delete a menu item (and its children)
// @route   DELETE /api/admin/menu-items/:id
// @access  Private/Admin
exports.deleteMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.navigationItem.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!existing) {
    return error(res, 'Navigation item not found', 404);
  }

  // Deleting a parent will cascade to children because of self relation with default behavior
  await prisma.navigationItem.delete({
    where: { id: existing.id }
  });

  return success(res, 'Navigation item deleted successfully');
});

function isTruthy(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}


