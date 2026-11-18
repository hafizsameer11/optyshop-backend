const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'controllers', 'cartController.js');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const helperAnchor = `function parseCustomizationField(raw) {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
}`;

const helperInsert = `function parseCustomizationField(raw) {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
}

/** Resolve max purchasable qty: color / size variant stock wins over product stock. */
function resolveAvailableStockForCartItem(product, customization) {
  const custom = parseCustomizationField(customization) || customization || null;
  if (custom && custom.color_stock_quantity != null && custom.color_stock_quantity !== '') {
    const n = Number(custom.color_stock_quantity);
    if (!Number.isNaN(n)) return n;
  }
  if (custom && custom.selected_color && product) {
    let colorImages = product.color_images;
    if (typeof colorImages === 'string') {
      try { colorImages = JSON.parse(colorImages); } catch (e) { colorImages = []; }
    }
    if (!Array.isArray(colorImages)) colorImages = colorImages ? [colorImages] : [];
    const normKey = (v) => {
      const s = String(v ?? '').trim().toLowerCase();
      return s.startsWith('#') ? s.slice(1) : s;
    };
    const selectedKey = normKey(custom.selected_color || custom.hex_code || custom.color_name);
    const match = colorImages.find((c) => {
      const hex = c.hexCode || c.hex_code || null;
      return (hex && normKey(hex) === selectedKey) ||
        (c.color && normKey(c.color) === selectedKey) ||
        (c.name && normKey(c.name) === selectedKey) ||
        (c.value && normKey(c.value) === selectedKey) ||
        (c.display_name && normKey(c.display_name) === selectedKey);
    });
    if (match && match.stock_quantity != null && match.stock_quantity !== '') {
      const n = Number(match.stock_quantity);
      if (!Number.isNaN(n)) return n;
    }
    if (match && match.stock_status === 'out_of_stock') return 0;
  }
  if (custom && custom.stock_quantity != null && custom.stock_quantity !== '') {
    const n = Number(custom.stock_quantity);
    if (!Number.isNaN(n)) return n;
  }
  if (product && product.stock_quantity != null && product.stock_quantity !== '') {
    const n = Number(product.stock_quantity);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}`;

if (!t.includes(helperAnchor)) {
  console.error('MISSING parseCustomizationField');
  process.exit(1);
}
if (!t.includes('resolveAvailableStockForCartItem')) {
  t = t.replace(helperAnchor, helperInsert);
} else {
  console.log('helper already present');
}

const oldMerge = `  if (existingItem && shouldUpdateExisting) {
    // Prepare update data
    const updateData = { 
      quantity: { increment: quantity }
    };`;

const newMerge = `  if (existingItem && shouldUpdateExisting) {
    const mergedQty = Number(existingItem.quantity || 0) + Number(quantity);
    if (stockQuantity != null && mergedQty > Number(stockQuantity)) {
      return error(res, \`Insufficient stock. Only \${stockQuantity} available.\`, 400);
    }

    // Prepare update data
    const updateData = { 
      quantity: { increment: quantity }
    };`;

if (!t.includes(oldMerge)) {
  if (t.includes('mergedQty = Number(existingItem.quantity')) {
    console.log('merge check already present');
  } else {
    console.error('MISSING merge block');
    process.exit(1);
  }
} else {
  t = t.replace(oldMerge, newMerge);
}

const oldUpdate = `  // Check stock if quantity is being increased
  if (quantity && quantity > cartItem.quantity) {
    const stockNeeded = quantity - cartItem.quantity;
    if (cartItem.product.stock_quantity < stockNeeded) {
      return error(res, 'Insufficient stock', 400);
    }
  }`;

const newUpdate = `  // Cap quantity by color/variant stock when present (not product-level total)
  if (quantity !== undefined && quantity > 0) {
    const available = resolveAvailableStockForCartItem(cartItem.product, cartItem.customization);
    if (available != null && Number(quantity) > Number(available)) {
      return error(res, \`Insufficient stock. Only \${available} available.\`, 400);
    }
    if (cartItem.product && cartItem.product.stock_status === 'out_of_stock' && available == null) {
      return error(res, 'This product is out of stock', 400);
    }
  }`;

if (!t.includes(oldUpdate)) {
  if (t.includes('resolveAvailableStockForCartItem(cartItem.product')) {
    console.log('update stock check already patched');
  } else {
    console.error('MISSING update stock block');
    process.exit(1);
  }
} else {
  t = t.replace(oldUpdate, newUpdate);
}

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK backend cart qty color stock');
