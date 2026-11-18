const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'controllers', 'orderController.js');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const old = `  // Create order with items
  const order = await prisma.order.create({
    data: {
      order_number: \`ORD-\${uuidv4().split('-')[0].toUpperCase()}\`,
      user_id: req.user.id,
      prescription_id: validPrescriptionId, // Will be null if not provided or invalid
      status: 'pending',
      payment_status: 'pending',
      payment_method: validPaymentMethod,`;

const neu = `  // COD: order is accepted, payment collected on delivery (stays pending).
  // Stripe/PayPal: stay pending until webhook / payment page marks paid.
  const initialOrderStatus = validPaymentMethod === 'cod' ? 'confirmed' : 'pending';
  const initialPaymentStatus = 'pending';

  // Create order with items
  const order = await prisma.order.create({
    data: {
      order_number: \`ORD-\${uuidv4().split('-')[0].toUpperCase()}\`,
      user_id: req.user.id,
      prescription_id: validPrescriptionId, // Will be null if not provided or invalid
      status: initialOrderStatus,
      payment_status: initialPaymentStatus,
      payment_method: validPaymentMethod,`;

if (!t.includes(old)) {
  if (t.includes('initialOrderStatus')) console.log('already patched');
  else {
    console.error('MISSING create order block');
    process.exit(1);
  }
} else {
  t = t.replace(old, neu);
}

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK COD order status');
