const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'controllers', 'cartController.js');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const marker = `  // Check stock (use size/volume variant stock when a variant was selected)
  const stockQuantity =
    resolvedVariantStockQuantity != null ? resolvedVariantStockQuantity : product.stock_quantity;`;

const insert = `  // Apply flash to base/variant price early (so merge path also gets discounted unit_price)
  {
    const baseForFlash = variantPrice !== null ? variantPrice : parseFloat(product.price);
    try {
      const flash = await resolveFlashPriceForProduct(product_id, baseForFlash);
      if (flash.offer && flash.unitPrice != null && flash.offer.discount_type !== 'free_shipping') {
        variantPrice = Number(flash.unitPrice);
        if (!customizationData) customizationData = {};
        customizationData.flash_offer_id = flash.offer.id;
        customizationData.flash_offer_title = flash.offer.title;
        customizationData.flash_unit_price = variantPrice;
      } else if (flash.freeShipping) {
        if (!customizationData) customizationData = {};
        customizationData.flash_free_shipping = true;
        customizationData.flash_offer_id = flash.offer?.id;
      }
    } catch (e) {
      console.warn('Flash pricing (pre-merge) skipped:', e.message);
    }
  }

` + marker;

if (t.includes('Apply flash to base/variant price early')) {
  console.log('already early flash');
} else if (!t.includes(marker)) {
  console.error('MISSING stock marker');
  process.exit(1);
} else {
  t = t.replace(marker, insert);
}

// Avoid double-applying flash later: if flash_unit_price already set, skip second apply
const oldSecond = `  let calculatedPrice = variantPrice !== null ? variantPrice : parseFloat(product.price);
  // Apply active flash offer to base/variant unit price (before lens add-ons)
  try {
    const flash = await resolveFlashPriceForProduct(product_id, calculatedPrice);
    if (flash.offer && flash.unitPrice != null && flash.offer.discount_type !== 'free_shipping') {
      calculatedPrice = Number(flash.unitPrice);
      if (!customizationData) customizationData = {};
      customizationData.flash_offer_id = flash.offer.id;
      customizationData.flash_offer_title = flash.offer.title;
      customizationData.flash_unit_price = calculatedPrice;
    } else if (flash.freeShipping) {
      if (!customizationData) customizationData = {};
      customizationData.flash_free_shipping = true;
      customizationData.flash_offer_id = flash.offer?.id;
    }
  } catch (e) {
    console.warn('Flash pricing skipped:', e.message);
  }`;

const newSecond = `  let calculatedPrice = variantPrice !== null ? variantPrice : parseFloat(product.price);
  // Flash already applied above when possible; keep customization flags`;

if (t.includes(oldSecond)) t = t.replace(oldSecond, newSecond);

fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK early flash');
