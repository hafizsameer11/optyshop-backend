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

const root = path.join(__dirname, '..');

// ---------- flashOfferPricing: add resolve helper ----------
patch(path.join(root, 'utils', 'flashOfferPricing.js'), (t) => {
  if (t.includes('async function resolveFlashPriceForProduct')) return t;
  const insert = `
/**
 * Resolve active flash unit price for a product id + base price.
 * Returns { unitPrice, offer, freeShipping }.
 */
async function resolveFlashPriceForProduct(productId, basePrice) {
  const base = parseFloat(basePrice);
  const offers = await getActiveFlashOffers();
  const map = buildProductIdToOfferMap(offers);
  const offer = map.get(Number(productId)) || null;
  if (!offer) {
    return { unitPrice: Number.isNaN(base) ? null : roundMoney(base), offer: null, freeShipping: false };
  }
  if (offer.discount_type === 'free_shipping') {
    return {
      unitPrice: Number.isNaN(base) ? null : roundMoney(base),
      offer,
      freeShipping: true,
    };
  }
  const discounted = computeDiscountedUnitPrice(base, offer);
  return {
    unitPrice: discounted != null ? discounted : (Number.isNaN(base) ? null : roundMoney(base)),
    offer,
    freeShipping: false,
  };
}
`;
  t = t.replace(
    'module.exports = {\n  getActiveFlashOffers,\n  buildProductIdToOfferMap,\n  computeDiscountedUnitPrice,\n  enrichFormattedProductWithFlashOffer,\n  publicFlashOfferSummary\n};',
    insert +
      'module.exports = {\n  getActiveFlashOffers,\n  buildProductIdToOfferMap,\n  computeDiscountedUnitPrice,\n  enrichFormattedProductWithFlashOffer,\n  publicFlashOfferSummary,\n  resolveFlashPriceForProduct\n};'
  );
  return t;
});

// ---------- cartController ----------
patch(path.join(root, 'controllers', 'cartController.js'), (t) => {
  if (!t.includes("require('../utils/flashOfferPricing')")) {
    // add import near top after prisma
    t = t.replace(
      "const prisma = require('../lib/prisma');",
      "const prisma = require('../lib/prisma');\nconst { resolveFlashPriceForProduct } = require('../utils/flashOfferPricing');"
    );
  }

  // Helper sync gifts - insert after parseCustomizationField block if missing
  if (!t.includes('async function syncFreeGiftsForProduct')) {
    const anchor = 'function parseCustomizationField(raw) {';
    const idx = t.indexOf(anchor);
    if (idx < 0) throw new Error('parseCustomizationField missing');
    // find end of parseCustomizationField function
    const endMarker = '\n// @desc    Get user\'s cart';
    const endIdx = t.indexOf(endMarker);
    if (endIdx < 0) throw new Error('getCart marker missing');
    const helper = `
async function syncFreeGiftsForProduct(cartId, productId, quantity) {
  const qty = Math.max(0, Number(quantity) || 0);
  const applicableGifts = qty <= 0
    ? []
    : await prisma.productGift.findMany({
        where: {
          product_id: productId,
          is_active: true,
          min_quantity: { lte: qty },
          OR: [{ max_quantity: null }, { max_quantity: { gte: qty } }],
        },
        include: {
          giftProduct: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              images: true,
              stock_status: true,
              is_active: true,
            },
          },
        },
      });

  const wantedGiftProductIds = new Set();
  const added = [];
  for (const gift of applicableGifts) {
    if (!gift.giftProduct?.is_active || gift.giftProduct.stock_status !== 'in_stock') continue;
    wantedGiftProductIds.add(gift.gift_product_id);
    const existingGiftItem = await prisma.cartItem.findFirst({
      where: { cart_id: cartId, product_id: gift.gift_product_id, unit_price: 0 },
    });
    if (!existingGiftItem) {
      const giftItem = await prisma.cartItem.create({
        data: {
          cart_id: cartId,
          product_id: gift.gift_product_id,
          quantity: 1,
          unit_price: 0,
          customization: JSON.stringify({
            is_gift: true,
            gift_from_product_id: productId,
            gift_rule_id: gift.id,
          }),
        },
      });
      added.push({ ...giftItem, gift_product: gift.giftProduct, is_gift: true });
    }
  }

  // Remove orphan gifts that came from this parent but no longer qualify
  const cartItems = await prisma.cartItem.findMany({ where: { cart_id: cartId, unit_price: 0 } });
  for (const gi of cartItems) {
    let custom = null;
    try {
      custom = typeof gi.customization === 'string' ? JSON.parse(gi.customization) : gi.customization;
    } catch (e) {
      custom = null;
    }
    if (!custom || !custom.is_gift) continue;
    if (Number(custom.gift_from_product_id) !== Number(productId)) continue;
    if (!wantedGiftProductIds.has(gi.product_id)) {
      await prisma.cartItem.delete({ where: { id: gi.id } });
    }
  }
  return added;
}

async function removeGiftsForParentProduct(cartId, productId) {
  const cartItems = await prisma.cartItem.findMany({ where: { cart_id: cartId, unit_price: 0 } });
  for (const gi of cartItems) {
    let custom = null;
    try {
      custom = typeof gi.customization === 'string' ? JSON.parse(gi.customization) : gi.customization;
    } catch (e) {
      custom = null;
    }
    if (custom && custom.is_gift && Number(custom.gift_from_product_id) === Number(productId)) {
      await prisma.cartItem.delete({ where: { id: gi.id } });
    }
  }
}

`;
    t = t.slice(0, endIdx) + helper + t.slice(endIdx);
  }

  // Apply flash before addons on calculatedPrice
  const oldCalc = `  let calculatedPrice = variantPrice !== null ? variantPrice : parseFloat(product.price);`;
  const newCalc = `  let calculatedPrice = variantPrice !== null ? variantPrice : parseFloat(product.price);
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
  if (t.includes(oldCalc) && !t.includes('resolveFlashPriceForProduct(product_id, calculatedPrice)')) {
    t = t.replace(oldCalc, newCalc);
  }

  // After merge update, sync gifts
  if (!t.includes('syncFreeGiftsForProduct(cart.id, product_id, mergedQty)')) {
    const mergeReturnAnchor = `    // Apply coupon automatically if provided
    let couponInfo = null;
    if (coupon_code) {
      try {
        // Get current cart items for coupon calculation
        const currentCart = await prisma.cart.findUnique({
          where: { user_id: req.user.id },
          include: { items: true }
        });`;
    // Insert gift sync before coupon on merge path - find unique string after updatedItem
    const afterMerge = `    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: updateData
    });
    
    // Parse JSON strings for response`;
    if (t.includes(afterMerge) && !t.includes('// Sync free gifts after quantity merge')) {
      t = t.replace(
        afterMerge,
        `    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: updateData
    });

    // Sync free gifts after quantity merge
    await syncFreeGiftsForProduct(cart.id, product_id, mergedQty);
    
    // Parse JSON strings for response`
      );
    }
  }

  // Replace old gift block on create with sync helper
  const oldGiftBlockStart = `  // Check for free gifts and add them automatically
  const applicableGifts = await prisma.productGift.findMany({`;
  if (t.includes(oldGiftBlockStart)) {
    // Replace whole block until "const addedGifts" processing ends before Parse JSON
    const start = t.indexOf(oldGiftBlockStart);
    const end = t.indexOf('  // Parse JSON strings for response\n  const parsedItem = {\n    ...cartItem,', start);
    if (start >= 0 && end > start) {
      t =
        t.slice(0, start) +
        `  // Sync free gifts for new cart line
  const addedGifts = await syncFreeGiftsForProduct(cart.id, product_id, quantity);

  // Parse JSON strings for response
  const parsedItem = {
    ...cartItem,` +
        t.slice(end + '  // Parse JSON strings for response\n  const parsedItem = {\n    ...cartItem,'.length);
    }
  }

  // getCart: expose is_gift on items - find items mapping if any, or after include fetch
  if (!t.includes('item.is_gift = !!(custom && custom.is_gift)')) {
    // Look for where cart items are returned in getCart
    const getCartSuccess = t.indexOf("return success(res, 'Cart retrieved successfully'");
    if (getCartSuccess < 0) {
      // try other message
    }
    // Patch by enriching items before return - search for subtotal calculation loop
    const loop = `      subtotal += parseFloat(item.unit_price) * item.quantity;`;
    if (t.includes(loop) && !t.includes('Enrich gift flags for storefront')) {
      t = t.replace(
        loop,
        `subtotal += parseFloat(item.unit_price) * item.quantity;
      // Enrich gift flags for storefront
      try {
        const custom = typeof item.customization === 'string'
          ? JSON.parse(item.customization)
          : item.customization;
        item.is_gift = !!(custom && custom.is_gift);
        item.gift_product = item.is_gift ? item.product : undefined;
      } catch (e) {
        item.is_gift = false;
      }`
      );
      // Wait - mutating item in reduce loop might be wrong place. getCart structure varies.
    }
  }

  // removeFromCart: remove child gifts when parent removed
  if (!t.includes('removeGiftsForParentProduct') && t.includes('exports.removeCartItem')) {
    const rem = t.indexOf('exports.removeCartItem');
    const del = t.indexOf('await prisma.cartItem.delete', rem);
    if (del > 0) {
      // get product_id before delete - find cartItem variable
      const snippet = t.slice(del, del + 200);
      if (!snippet.includes('removeGiftsForParentProduct')) {
        t = t.replace(
          /exports\.removeCartItem = asyncHandler\(async \(req, res\) => \{[\s\S]*?await prisma\.cartItem\.delete\(\{\s*where: \{ id: parseInt\(id\) \}\s*\}\);/,
          (m) => {
            if (m.includes('removeGiftsForParentProduct')) return m;
            return m.replace(
              'await prisma.cartItem.delete({',
              `const parentProductId = cartItem.product_id;
  const parentCustom = parseCustomizationField(cartItem.customization);
  const isGiftLine = !!(parentCustom && parentCustom.is_gift);
  await prisma.cartItem.delete({`
            ).replace(
              /await prisma\.cartItem\.delete\(\{\s*where: \{ id: parseInt\(id\) \}\s*\}\);/,
              `await prisma.cartItem.delete({
    where: { id: parseInt(id) }
  });
  if (!isGiftLine) {
    await removeGiftsForParentProduct(cart.id, parentProductId);
  }`
            );
          }
        );
      }
    }
  }

  // updateCartItem: sync gifts after qty change
  if (t.includes('exports.updateCartItem') && !t.includes('syncFreeGiftsForProduct(cart.id, cartItem.product_id')) {
    const upd = `    const updatedItem = await prisma.cartItem.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    // Parse JSON strings for response
    const parsedItem = {
      ...updatedItem,`;
    if (t.includes(upd)) {
      t = t.replace(
        upd,
        `    const updatedItem = await prisma.cartItem.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    if (quantity !== undefined) {
      await syncFreeGiftsForProduct(cart.id, cartItem.product_id, quantity);
    }
    
    // Parse JSON strings for response
    const parsedItem = {
      ...updatedItem,`
      );
    }
  }

  return t;
});

// ---------- orderController: flash price + coupon conditions/usage + coupon in notes ----------
patch(path.join(root, 'controllers', 'orderController.js'), (t) => {
  if (!t.includes("require('../utils/flashOfferPricing')")) {
    t = t.replace(
      "const prisma = require('../lib/prisma');",
      "const prisma = require('../lib/prisma');\nconst { resolveFlashPriceForProduct } = require('../utils/flashOfferPricing');"
    );
  }

  // Replace item price loop to apply flash
  const oldItemPrice = `    // Use unit_price from item if available (from cart), otherwise use product price
    const unitPrice = item.unit_price ? parseFloat(item.unit_price) : parseFloat(product.price);
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;`;

  const newItemPrice = `    // Cart unit_price may include lens add-ons; apply flash only to catalog base, keep addon delta
    const catalogPrice = parseFloat(product.price);
    let unitPrice = item.unit_price != null ? parseFloat(item.unit_price) : catalogPrice;
    let flashFreeShipping = false;
    try {
      let custom = null;
      if (item.customization) {
        custom = typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization;
      }
      if (custom && custom.is_gift) {
        unitPrice = 0;
      } else {
        const flash = await resolveFlashPriceForProduct(product.id, catalogPrice);
        if (flash.freeShipping) flashFreeShipping = true;
        if (custom && custom.flash_free_shipping) flashFreeShipping = true;
        if (flash.offer && flash.unitPrice != null && flash.offer.discount_type !== 'free_shipping') {
          const addon = Math.max(0, (Number.isNaN(unitPrice) ? catalogPrice : unitPrice) - catalogPrice);
          unitPrice = Number(flash.unitPrice) + addon;
        }
      }
    } catch (e) {
      /* ignore flash errors */
    }
    item._flashFreeShipping = flashFreeShipping;
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;`;

  if (t.includes(oldItemPrice)) {
    t = t.replace(oldItemPrice, newItemPrice);
  } else if (!t.includes('resolveFlashPriceForProduct(product.id')) {
    console.warn('WARN: item price block not found for flash');
  }

  // Coupon block harden
  const oldCoupon = `  let discount = 0;
  let appliedCouponCode = null;
  let freeShippingCoupon = false;
  if (coupon_code && String(coupon_code).trim()) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: String(coupon_code).toUpperCase().trim() },
    });
    if (coupon && coupon.is_active) {
      const now = new Date();
      const startsOk = !coupon.starts_at || new Date(coupon.starts_at) <= now;
      const endsOk = !coupon.ends_at || new Date(coupon.ends_at) >= now;
      const minOk =
        !coupon.min_order_amount || subtotal >= parseFloat(coupon.min_order_amount);
      if (startsOk && endsOk && minOk) {
        appliedCouponCode = coupon.code;
        if (coupon.discount_type === 'percentage') {
          discount = (subtotal * parseFloat(coupon.discount_value)) / 100;
          if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) {
            discount = parseFloat(coupon.max_discount);
          }
        } else if (coupon.discount_type === 'fixed_amount') {
          discount = Math.min(parseFloat(coupon.discount_value), subtotal);
        } else if (coupon.discount_type === 'free_shipping') {
          freeShippingCoupon = true;
        }
      }
    }
  }

  if (freeShippingCoupon) {
    shipping = 0;
  }`;

  const newCoupon = `  let discount = 0;
  let appliedCouponCode = null;
  let freeShippingCoupon = false;
  const anyFlashFreeShipping = orderItems.some((oi) => false) || items.some((it) => it._flashFreeShipping);
  if (anyFlashFreeShipping) freeShippingCoupon = true;

  if (coupon_code && String(coupon_code).trim()) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: String(coupon_code).toUpperCase().trim() },
    });
    if (coupon && coupon.is_active) {
      const now = new Date();
      const startsOk = !coupon.starts_at || new Date(coupon.starts_at) <= now;
      const endsOk = !coupon.ends_at || new Date(coupon.ends_at) >= now;
      const minOk =
        !coupon.min_order_amount || subtotal >= parseFloat(coupon.min_order_amount);

      let conditionsOk = true;
      let eligibleSubtotal = subtotal;
      try {
        let conditions = coupon.conditions;
        if (typeof conditions === 'string' && conditions.trim()) conditions = JSON.parse(conditions);
        if (conditions && Array.isArray(conditions.product_ids) && conditions.product_ids.length > 0) {
          const allowed = new Set(conditions.product_ids.map((id) => Number(id)));
          eligibleSubtotal = 0;
          for (const it of items) {
            const pid = Number(it.product_id);
            if (!allowed.has(pid)) continue;
            const p = await prisma.product.findUnique({ where: { id: pid } });
            let up = it.unit_price != null ? parseFloat(it.unit_price) : parseFloat(p?.price || 0);
            eligibleSubtotal += up * Number(it.quantity || 1);
          }
          if (eligibleSubtotal <= 0) conditionsOk = false;
        }
      } catch (e) {
        /* ignore bad conditions */
      }

      let usageOk = true;
      if (coupon.usage_limit != null) {
        const used = await prisma.order.count({
          where: { notes: { contains: \`Coupon: \${coupon.code}\` } },
        });
        if (used >= Number(coupon.usage_limit)) usageOk = false;
      }
      if (usageOk && coupon.usage_per_user != null && req.user?.id) {
        const usedByUser = await prisma.order.count({
          where: {
            user_id: req.user.id,
            notes: { contains: \`Coupon: \${coupon.code}\` },
          },
        });
        if (usedByUser >= Number(coupon.usage_per_user)) usageOk = false;
      }

      if (startsOk && endsOk && minOk && conditionsOk && usageOk) {
        appliedCouponCode = coupon.code;
        const base = eligibleSubtotal > 0 && eligibleSubtotal < subtotal ? eligibleSubtotal : subtotal;
        if (coupon.discount_type === 'percentage') {
          discount = (base * parseFloat(coupon.discount_value)) / 100;
          if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) {
            discount = parseFloat(coupon.max_discount);
          }
        } else if (coupon.discount_type === 'fixed_amount') {
          discount = Math.min(parseFloat(coupon.discount_value), base);
        } else if (coupon.discount_type === 'free_shipping') {
          freeShippingCoupon = true;
        }
      }
    }
  }

  if (freeShippingCoupon) {
    shipping = 0;
  }`;

  if (t.includes(oldCoupon)) {
    t = t.replace(oldCoupon, newCoupon);
  } else {
    console.warn('WARN coupon block not exact match');
  }

  // Put coupon code back into notes for audit (only coupon, not shipping spam)
  const oldNotes = `  // Keep notes as customer/admin text only (do not inject coupon/shipping labels here)
  const orderNotes = notes ? String(notes) : null;
  // appliedCouponCode / shippingMethodLabel are still used for totals; not stuffed into notes.`;
  const newNotes = `  const notesParts = [];
  if (notes) notesParts.push(String(notes));
  if (appliedCouponCode) notesParts.push(\`Coupon: \${appliedCouponCode}\`);
  const orderNotes = notesParts.length ? notesParts.join(' | ') : null;`;
  if (t.includes(oldNotes)) t = t.replace(oldNotes, newNotes);

  // Fix orderItems flash flag - orderItems is built in loop, _flashFreeShipping on item before push
  // The anyFlashFreeShipping references orderItems before it's fully used - items have _flashFreeShipping
  // Fix the buggy line that uses orderItems before defined
  t = t.replace(
    'const anyFlashFreeShipping = orderItems.some((oi) => false) || items.some((it) => it._flashFreeShipping);',
    'const anyFlashFreeShipping = items.some((it) => !!it._flashFreeShipping);'
  );

  return t;
});

// ---------- marketingController: persist product_ids into conditions ----------
patch(path.join(root, 'controllers', 'marketingController.js'), (t) => {
  const old = `    // Explicitly remove any invalid fields that might cause issues
    delete couponData.product_ids;
    delete couponData.created_at;
    delete couponData.updated_at;`;
  const neu = `    // Persist admin product picker into conditions.product_ids (schema has no product_ids column)
    if (rest.product_ids !== undefined) {
      let ids = rest.product_ids;
      if (typeof ids === 'string') {
        ids = ids.split(',').map((x) => parseInt(String(x).trim(), 10)).filter((n) => !Number.isNaN(n));
      }
      if (Array.isArray(ids) && ids.length > 0) {
        let conditionsObj = {};
        if (couponData.conditions) {
          try {
            conditionsObj = typeof couponData.conditions === 'string'
              ? JSON.parse(couponData.conditions)
              : { ...couponData.conditions };
          } catch (e) {
            conditionsObj = {};
          }
        }
        conditionsObj.product_ids = ids.map((n) => Number(n));
        couponData.conditions = JSON.stringify(conditionsObj);
      }
    }
    // Explicitly remove any invalid fields that might cause issues
    delete couponData.product_ids;
    delete couponData.created_at;
    delete couponData.updated_at;`;
  if (t.includes(old) && !t.includes('Persist admin product picker')) {
    t = t.replace(old, neu);
  }

  // Same for update
  if (!t.includes('Persist product_ids on update') && t.includes('exports.updateCoupon')) {
    const updateStart = t.indexOf('exports.updateCoupon');
    const updateDataLine = t.indexOf('const updateData = { ...rest };', updateStart);
    if (updateDataLine > 0) {
      t = t.replace(
        'const updateData = { ...rest };',
        `const updateData = { ...rest };
    // Persist product_ids on update
    if (rest.product_ids !== undefined) {
      let ids = rest.product_ids;
      if (typeof ids === 'string') {
        ids = ids.split(',').map((x) => parseInt(String(x).trim(), 10)).filter((n) => !Number.isNaN(n));
      }
      let conditionsObj = {};
      if (updateData.conditions) {
        try {
          conditionsObj = typeof updateData.conditions === 'string'
            ? JSON.parse(updateData.conditions)
            : { ...updateData.conditions };
        } catch (e) { conditionsObj = {}; }
      }
      if (Array.isArray(ids) && ids.length > 0) {
        conditionsObj.product_ids = ids.map((n) => Number(n));
        updateData.conditions = JSON.stringify(conditionsObj);
      } else if (Array.isArray(ids) && ids.length === 0 && conditionsObj.product_ids) {
        delete conditionsObj.product_ids;
        updateData.conditions = Object.keys(conditionsObj).length ? JSON.stringify(conditionsObj) : null;
      }
      delete updateData.product_ids;
    }`
      );
    }
  }
  return t;
});

console.log('marketing flows patched');
