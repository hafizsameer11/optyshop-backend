const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'controllers', 'cartController.js');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const old = `  if (!cartItem) {
    return error(res, 'Cart item not found', 404);
  }

  await prisma.cartItem.delete({ where: { id: parseInt(id) } });

  return success(res, 'Item removed from cart');
});`;

const neu = `  if (!cartItem) {
    return error(res, 'Cart item not found', 404);
  }

  const parentProductId = cartItem.product_id;
  const parentCustom = parseCustomizationField(cartItem.customization);
  const isGiftLine = !!(parentCustom && parentCustom.is_gift);

  await prisma.cartItem.delete({ where: { id: parseInt(id) } });

  if (!isGiftLine) {
    await removeGiftsForParentProduct(cart.id, parentProductId);
  }

  return success(res, 'Item removed from cart');
});`;

if (!t.includes(old)) {
  if (t.includes('removeGiftsForParentProduct(cart.id, parentProductId)')) console.log('already');
  else {
    console.error('MISSING remove block');
    process.exit(1);
  }
} else {
  t = t.replace(old, neu);
}

// Ensure parsedItem keeps is_gift after customization parse
const oldParsed = `      const parsedItem = {
        ...item,
        lens_coatings: item.lens_coatings ? JSON.parse(item.lens_coatings) : null,
        customization: item.customization ? (typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization) : null,
        prescription_data: item.prescription_data ? JSON.parse(item.prescription_data) : null,
        treatment_ids: item.treatment_ids ? JSON.parse(item.treatment_ids) : null
      };`;

const newParsed = `      const parsedCustomization = item.customization
        ? (typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization)
        : null;
      const parsedItem = {
        ...item,
        lens_coatings: item.lens_coatings ? JSON.parse(item.lens_coatings) : null,
        customization: parsedCustomization,
        prescription_data: item.prescription_data ? JSON.parse(item.prescription_data) : null,
        treatment_ids: item.treatment_ids ? JSON.parse(item.treatment_ids) : null,
        is_gift: !!(parsedCustomization && parsedCustomization.is_gift),
      };`;

if (t.includes(oldParsed) && !t.includes('is_gift: !!(parsedCustomization')) {
  t = t.replace(oldParsed, newParsed);
}

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK gift remove');
