const prisma = require('../lib/prisma');

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Active flash offers, newest first (same tie-break as /api/flash-offers/active pick order).
 */
async function getActiveFlashOffers() {
  const now = new Date();
  return prisma.flashOffer.findMany({
    where: {
      is_active: true,
      starts_at: { lte: now },
      ends_at: { gte: now }
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * First winning offer per product id (newest campaign wins).
 */
function buildProductIdToOfferMap(offers) {
  const map = new Map();
  for (const offer of offers) {
    let ids = [];
    try {
      ids = offer.product_ids ? JSON.parse(offer.product_ids) : [];
    } catch {
      continue;
    }
    for (const raw of ids) {
      const pid = Number(raw);
      if (!Number.isFinite(pid)) continue;
      if (!map.has(pid)) map.set(pid, offer);
    }
  }
  return map;
}

function computeDiscountedUnitPrice(basePrice, offer) {
  if (!offer?.discount_type || offer.discount_type === 'free_shipping') return null;
  const b = parseFloat(basePrice);
  if (Number.isNaN(b)) return null;
  const dv = parseFloat(offer.discount_value);
  if (Number.isNaN(dv)) return null;
  if (offer.discount_type === 'percentage') {
    return roundMoney(Math.max(0, b * (1 - dv / 100)));
  }
  if (offer.discount_type === 'fixed_amount') {
    return roundMoney(Math.max(0, b - dv));
  }
  return null;
}

function publicFlashOfferSummary(offer) {
  return {
    id: offer.id,
    title: offer.title,
    discount_type: offer.discount_type,
    discount_value:
      offer.discount_value != null && offer.discount_value !== ''
        ? String(offer.discount_value)
        : null,
    starts_at: offer.starts_at,
    ends_at: offer.ends_at
  };
}

/**
 * Apply flash pricing to a formatted product (output of formatProductMedia).
 * Sets `price` / `currentVariantPrice` to discounted values when applicable;
 * sets `original_price` and optionally `compare_at_price` for display.
 */
function enrichFormattedProductWithFlashOffer(formattedProduct, offer) {
  const out = { ...formattedProduct, flash_offer: null };
  if (!offer) return out;

  out.flash_offer = publicFlashOfferSummary(offer);

  if (!offer.discount_type || offer.discount_type === 'free_shipping') {
    return out;
  }

  const base = parseFloat(formattedProduct.price);
  if (Number.isNaN(base)) return out;

  const discounted = computeDiscountedUnitPrice(base, offer);
  if (discounted === null) return out;

  const origStr =
    formattedProduct.price != null ? String(formattedProduct.price) : String(base);

  out.original_price = origStr;
  out.price = String(discounted);
  out.currentVariantPrice = discounted;

  if (
    formattedProduct.compare_at_price == null ||
    formattedProduct.compare_at_price === ''
  ) {
    out.compare_at_price = origStr;
  }

  if (out.colors && out.colors.length > 0) {
    out.colors = out.colors.map((c) => {
      if (c.price == null || Number.isNaN(parseFloat(c.price))) return { ...c };
      const newP = computeDiscountedUnitPrice(parseFloat(c.price), offer);
      if (newP === null) return { ...c };
      return {
        ...c,
        original_price: c.price,
        price: newP
      };
    });
    const first = out.colors[0];
    if (first && first.price != null && typeof first.price === 'number') {
      out.currentVariantPrice = first.price;
    }
  }

  return out;
}

module.exports = {
  getActiveFlashOffers,
  buildProductIdToOfferMap,
  computeDiscountedUnitPrice,
  enrichFormattedProductWithFlashOffer,
  publicFlashOfferSummary
};
