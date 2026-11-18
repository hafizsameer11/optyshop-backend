const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'controllers', 'orderController.js');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const helper = `
function parseOrderCustomization(raw) {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
}

function normColorKey(v) {
  const s = String(v ?? '').trim().toLowerCase();
  return s.startsWith('#') ? s.slice(1) : s;
}

function parseColorImages(product) {
  let colorImages = product && product.color_images;
  if (typeof colorImages === 'string') {
    try { colorImages = JSON.parse(colorImages); } catch (e) { colorImages = []; }
  }
  if (!Array.isArray(colorImages)) colorImages = colorImages ? [colorImages] : [];
  return colorImages;
}

function findColorVariant(product, customization) {
  const custom = parseOrderCustomization(customization) || customization || null;
  if (!custom) return null;
  const selectedKey = normColorKey(custom.selected_color || custom.hex_code || custom.color_name || custom.color_value);
  if (!selectedKey) return null;
  const colorImages = parseColorImages(product);
  return colorImages.find((c) => {
    const hex = c.hexCode || c.hex_code || null;
    return (hex && normColorKey(hex) === selectedKey) ||
      (c.color && normColorKey(c.color) === selectedKey) ||
      (c.name && normColorKey(c.name) === selectedKey) ||
      (c.value && normColorKey(c.value) === selectedKey) ||
      (c.display_name && normColorKey(c.display_name) === selectedKey);
  }) || null;
}

/** Color/variant stock wins over product-level stock (live color_images first). */
function resolveOrderItemAvailableStock(product, customization) {
  const custom = parseOrderCustomization(customization) || customization || null;
  const match = findColorVariant(product, custom);
  if (match) {
    if (match.stock_status === 'out_of_stock') return 0;
    if (match.stock_quantity != null && match.stock_quantity !== '') {
      const n = Number(match.stock_quantity);
      if (!Number.isNaN(n)) return n;
    }
  }
  if (custom && custom.color_stock_quantity != null && custom.color_stock_quantity !== '') {
    const n = Number(custom.color_stock_quantity);
    if (!Number.isNaN(n)) return n;
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
}

async function decrementProductStockForOrderItem(productId, quantity, customization) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const match = findColorVariant(product, customization);
  if (match && (match.stock_quantity != null || match.stock_status)) {
    const colorImages = parseColorImages(product);
    const selectedKey = normColorKey(
      (parseOrderCustomization(customization) || {}).selected_color ||
      (parseOrderCustomization(customization) || {}).hex_code ||
      (parseOrderCustomization(customization) || {}).color_name
    );
    const nextColors = colorImages.map((c) => {
      const hex = c.hexCode || c.hex_code || null;
      const isMatch =
        (hex && normColorKey(hex) === selectedKey) ||
        (c.color && normColorKey(c.color) === selectedKey) ||
        (c.name && normColorKey(c.name) === selectedKey) ||
        (c.value && normColorKey(c.value) === selectedKey) ||
        (c.display_name && normColorKey(c.display_name) === selectedKey);
      if (!isMatch) return c;
      const current = c.stock_quantity != null ? Number(c.stock_quantity) : null;
      if (current == null || Number.isNaN(current)) return c;
      const left = Math.max(0, current - Number(quantity));
      return {
        ...c,
        stock_quantity: left,
        stock_status: left <= 0 ? 'out_of_stock' : (c.stock_status || 'in_stock'),
      };
    });
    await prisma.product.update({
      where: { id: productId },
      data: { color_images: JSON.stringify(nextColors) },
    });
    return;
  }

  const current = Number(product.stock_quantity || 0);
  const left = Math.max(0, current - Number(quantity));
  await prisma.product.update({
    where: { id: productId },
    data: {
      stock_quantity: left,
      ...(left <= 0 ? { stock_status: 'out_of_stock' } : {}),
    },
  });
}
`;

if (!t.includes('function resolveOrderItemAvailableStock')) {
  const anchor = "const { sendOrderStatusEmailIT, sendOrderCancellationEmailIT, sendOrderRefundEmailIT } = require('../utils/email');\n";
  if (!t.includes(anchor)) {
    console.error('MISSING email import anchor');
    process.exit(1);
  }
  t = t.replace(anchor, anchor + '\n' + helper + '\n');
} else {
  console.log('helpers already present');
}

const oldCheck = `    if (product.stock_quantity < item.quantity) {
      return error(res, \`Insufficient stock for product \${product.name}\`, 400);
    }`;

const newCheck = `    const availableStock = resolveOrderItemAvailableStock(product, item.customization);
    if (availableStock != null && Number(availableStock) < Number(item.quantity)) {
      return error(res, \`Insufficient stock for product \${product.name}\`, 400);
    }
    if (availableStock == null && product.stock_quantity != null && Number(product.stock_quantity) < Number(item.quantity)) {
      return error(res, \`Insufficient stock for product \${product.name}\`, 400);
    }
    if (product.stock_status === 'out_of_stock' && availableStock == null) {
      return error(res, \`Insufficient stock for product \${product.name}\`, 400);
    }`;

if (!t.includes(oldCheck)) {
  if (t.includes('resolveOrderItemAvailableStock(product, item.customization)')) {
    console.log('stock check already patched');
  } else {
    console.error('MISSING stock check');
    process.exit(1);
  }
} else {
  t = t.replace(oldCheck, newCheck);
}

const oldDec = `  // Update product stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.product_id },
      data: {
        stock_quantity: { decrement: item.quantity },
        stock_status: await (async () => {
          const product = await prisma.product.findUnique({ where: { id: item.product_id } });
          return product.stock_quantity <= item.quantity ? 'out_of_stock' : undefined;
        })()
      }
    });
  }`;

const newDec = `  // Update stock (per-color when a colour was selected)
  for (const item of items) {
    await decrementProductStockForOrderItem(item.product_id, item.quantity, item.customization);
  }`;

if (!t.includes(oldDec)) {
  if (t.includes('decrementProductStockForOrderItem')) {
    console.log('decrement already patched');
  } else {
    console.error('MISSING stock decrement');
    process.exit(1);
  }
} else {
  t = t.replace(oldDec, newDec);
}

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK order color stock');
