const fs = require('fs');
const path = require('path');

function patch(abs, apply) {
  const raw = fs.readFileSync(abs, 'utf8');
  const hadCrlf = raw.includes('\r\n');
  let t = raw.replace(/\r\n/g, '\n');
  t = apply(t);
  fs.writeFileSync(abs, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
  console.log('OK', path.relative(process.cwd(), abs));
}

patch(path.join(__dirname, '..', 'controllers', 'adminController.js'), (t) => {
  const old = `  // Parse JSON strings in order items
  const parsedOrder = {
    ...order,
    items: order.items.map(item => {`;

  const neu = `  const parseAddr = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch (e) { return null; }
  };

  // Parse JSON strings in order items + addresses (checkout uses address/zip_code/first_name)
  const parsedOrder = {
    ...order,
    shipping_address: parseAddr(order.shipping_address),
    billing_address: parseAddr(order.billing_address),
    items: order.items.map(item => {`;

  if (!t.includes(old)) {
    if (t.includes('shipping_address: parseAddr(order.shipping_address)')) console.log('admin parse already');
    else throw new Error('admin getOrderDetail parse block missing');
  } else {
    t = t.replace(old, neu);
  }
  return t;
});

patch(path.join(__dirname, '..', 'controllers', 'orderController.js'), (t) => {
  // Stop auto-appending Coupon/Shipping into notes (was showing as mystery text on order)
  const old = `  const notesParts = [];
  if (notes) notesParts.push(String(notes));
  if (appliedCouponCode) notesParts.push(\`Coupon: \${appliedCouponCode}\`);
  if (shippingMethodLabel) notesParts.push(\`Shipping: \${shippingMethodLabel}\`);
  const orderNotes = notesParts.length ? notesParts.join(' | ') : null;`;

  const neu = `  // Keep notes as customer/admin text only (do not inject coupon/shipping labels here)
  const orderNotes = notes ? String(notes) : null;
  // appliedCouponCode / shippingMethodLabel are still used for totals; not stuffed into notes.`;

  if (!t.includes(old)) {
    if (t.includes('Keep notes as customer/admin text only')) console.log('notes already clean');
    else throw new Error('notesParts block missing');
  } else {
    t = t.replace(old, neu);
  }
  return t;
});
