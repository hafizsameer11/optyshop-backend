const prisma = require('../lib/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

// Helper function to parse JSON fields
const parseJsonField = (value) => {
  if (value === undefined || value === null || value === '') return null;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed).filter((v) => v != null && v !== '');
    }
    return parsed;
  } catch (e) {
    if (typeof value === 'string' && value.trim() !== '') return [value.trim()];
    return value;
  }
};

/** multipart/form-data sends booleans as strings */
const parseMultipartBoolean = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const s = String(value).toLowerCase().trim();
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  return undefined;
};

const parseMultipartTruthy = (value) => {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'boolean') return value;
  const s = String(value).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
};

/**
 * Parse product.color_images (JSON string, array, or legacy object keyed by hex/name).
 * @returns {Array<{ hexCode?: string|null, name?: string|null, value?: string|null, images: string[] }>}
 */
function parseProductColorImagesList(color_images) {
  if (!color_images) return [];
  let raw = color_images;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw.map((c) => {
      const hex = c.hexCode || c.hex_code || null;
      const name = c.name || c.color || null;
      const imgs = Array.isArray(c.images)
        ? c.images.filter(Boolean)
        : c.images
          ? [c.images].filter(Boolean)
          : [];
      return { hexCode: hex, name, images: imgs, value: c.value };
    });
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([key, v]) => {
      const valueObj = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
      const hk = String(key).trim();
      const hexFromKey = /^#[0-9A-Fa-f]{3,8}$/i.test(hk) ? hk : null;
      const hexCode = valueObj.hexCode || valueObj.hex_code || hexFromKey;
      const name = valueObj.name || valueObj.color || (!hexFromKey && hk && !hk.includes('//') ? hk : null);
      const imgs = Array.isArray(valueObj.images)
        ? valueObj.images.filter(Boolean)
        : Array.isArray(v)
          ? v.filter(Boolean)
          : typeof v === 'string' && v
            ? [v]
            : [];
      return { hexCode, name, images: imgs, value: valueObj.value };
    });
  }
  return [];
}

/**
 * Persist selected color on cart line (same keys as frame color flow) so cart display_images resolve correctly.
 */
function buildContactLensColorCustomization(product, selectedColorRaw, colorDisplayName) {
  const selRaw = selectedColorRaw == null ? '' : String(selectedColorRaw).trim();
  if (!selRaw) return null;
  const selLower = selRaw.toLowerCase();
  const list = parseProductColorImagesList(product.color_images);
  if (!list.length) {
    return {
      selected_color: selRaw,
      color_display_name: colorDisplayName || selRaw
    };
  }
  const variant = list.find((c) => {
    const hex = String(c.hexCode || '').toLowerCase();
    const val = String(c.value || '').toLowerCase();
    const nm = String(c.name || '').toLowerCase();
    return (
      (hex && (hex === selLower || hex.replace('#', '') === selLower.replace('#', ''))) ||
      (val && (val === selLower || val.replace('#', '') === selLower.replace('#', ''))) ||
      (nm && nm === selLower)
    );
  });
  const primaryHex = variant && variant.hexCode ? String(variant.hexCode) : selRaw.startsWith('#') ? selRaw : null;
  const payload = {
    selected_color: primaryHex || selRaw,
    color_display_name: colorDisplayName || (variant && variant.name ? String(variant.name) : null) || selRaw
  };
  if (variant && Array.isArray(variant.images) && variant.images.length) {
    payload.variant_images = variant.images;
  }
  if (primaryHex) payload.hex_code = primaryHex;
  return payload;
}

/**
 * Eye dropdown fields are stored as JSON arrays. Clients often send JSON strings e.g. '["3"]'.
 */
const normalizeJsonArrayLikeField = (val) => {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [val];
    }
  }
  return [val];
};

const stringifyEyeArrayForDb = (val) => JSON.stringify(normalizeJsonArrayLikeField(val));

const normalizeLastIfArray = (val) => {
  if (val === undefined || val === null) return val;
  if (Array.isArray(val)) return val[val.length - 1];
  return val;
};

const parseJsonObjectFragment = (item) => {
  if (item === undefined || item === null || item === '') return null;
  if (typeof item === 'object' && !Array.isArray(item)) return item;
  if (typeof item === 'string') {
    const t = item.trim();
    if (!t) return null;
    try {
      const parsed = JSON.parse(t);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
};

/** unit_prices: duplicate multipart keys may become an array — merge all fragments */
const normalizeUnitPricesForDb = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (Array.isArray(val)) {
    const merged = {};
    val.forEach((item) => {
      const obj = parseJsonObjectFragment(item);
      if (obj) Object.assign(merged, obj);
    });
    return Object.keys(merged).length > 0 ? JSON.stringify(merged) : null;
  }
  const raw = normalizeLastIfArray(val);
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return JSON.stringify(raw);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed);
    } catch {
      return raw;
    }
  }
  return JSON.stringify(raw);
};

const normalizeAvailableUnitsForDb = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const collect = (arr) =>
    arr
      .map((v) => {
        const n = typeof v === 'number' ? v : parseInt(String(v), 10);
        return !Number.isNaN(n) && n > 0 ? n : null;
      })
      .filter((n) => n !== null);

  if (Array.isArray(val)) {
    const all = [];
    val.forEach((item) => {
      if (Array.isArray(item)) {
        all.push(...collect(item));
        return;
      }
      if (typeof item === 'string') {
        const t = item.trim();
        if (!t) return;
        try {
          const parsed = JSON.parse(t);
          if (Array.isArray(parsed)) all.push(...collect(parsed));
          else all.push(...collect([parsed]));
        } catch {
          all.push(...collect([item]));
        }
        return;
      }
      all.push(...collect([item]));
    });
    const unique = [...new Set(all)];
    return unique.length > 0 ? JSON.stringify(unique) : null;
  }

  const raw = normalizeLastIfArray(val);
  if (Array.isArray(raw)) return JSON.stringify([...new Set(collect(raw))]);
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return null;
    try {
      const parsed = JSON.parse(t);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return JSON.stringify([...new Set(collect(arr))]);
    } catch {
      return JSON.stringify(collect([raw]));
    }
  }
  return JSON.stringify(collect([raw]));
};

/** unit_images from JSON body or multipart field (stringified JSON). Empty object {} means clear all URLs. */
const parseUnitImagesBody = (unit_images) => {
  if (unit_images === undefined || unit_images === null || unit_images === '') return undefined;
  if (Array.isArray(unit_images)) {
    const merged = {};
    unit_images.forEach((item) => {
      const obj = parseJsonObjectFragment(item);
      if (obj) Object.assign(merged, obj);
    });
    return Object.keys(merged).length > 0 ? merged : undefined;
  }
  if (typeof unit_images === 'object' && !Array.isArray(unit_images)) return unit_images;
  if (typeof unit_images === 'string') {
    const t = unit_images.trim();
    if (!t) return undefined;
    try {
      const parsed = JSON.parse(t);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const parseJsonFieldToObject = (val, fallback = {}) => {
  if (val === undefined || val === null || val === '') return { ...fallback };
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : { ...fallback };
  } catch {
    return { ...fallback };
  }
};

const parseJsonFieldToUnitArray = (val) => {
  if (val === undefined || val === null || val === '') return [];
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr
      .map((v) => (typeof v === 'number' ? v : parseInt(String(v), 10)))
      .filter((n) => !Number.isNaN(n) && n > 0);
  } catch {
    return [];
  }
};

/**
 * Apply pack fields on config update.
 * When admin sends available_units (+ prices/images), treat as authoritative replacement
 * so removed packs are deleted from DB — do not merge leftover keys from existing row.
 */
const reconcilePackFieldsForUpdate = (existingConfig, { available_units, unit_prices, unit_images }) => {
  const existingUnits = parseJsonFieldToUnitArray(existingConfig.available_units);
  const existingPrices = parseJsonFieldToObject(existingConfig.unit_prices);
  const existingImages = parseJsonFieldToObject(existingConfig.unit_images);

  const unitsExplicit = available_units !== undefined;
  const pricesExplicit = unit_prices !== undefined;
  const imagesExplicit = unit_images !== undefined;

  const incomingUnits = unitsExplicit
    ? parseJsonFieldToUnitArray(normalizeAvailableUnitsForDb(available_units))
    : null;
  const incomingPrices = pricesExplicit
    ? parseJsonFieldToObject(normalizeUnitPricesForDb(unit_prices))
    : null;
  let incomingImages = null;
  if (imagesExplicit) {
    if (unit_images === null || unit_images === '') {
      incomingImages = {};
    } else if (typeof unit_images === 'string') {
      incomingImages = parseJsonFieldToObject(unit_images);
    } else if (typeof unit_images === 'object' && !Array.isArray(unit_images)) {
      incomingImages = unit_images;
    } else {
      incomingImages = {};
    }
  }

  const isFullPackReplace = unitsExplicit && (pricesExplicit || imagesExplicit);

  if (isFullPackReplace) {
    const allowed = [...new Set(incomingUnits || [])]
      .map((u) => (typeof u === 'number' ? u : parseInt(String(u), 10)))
      .filter((n) => !Number.isNaN(n) && n > 0);
    const allowedKeys = new Set(allowed.map(String));

    const prunedPrices = {};
    if (incomingPrices) {
      Object.entries(incomingPrices).forEach(([k, v]) => {
        if (allowedKeys.has(String(k))) prunedPrices[k] = v;
      });
    }

    const prunedImages = {};
    allowedKeys.forEach((k) => {
      prunedImages[k] = incomingImages && Object.prototype.hasOwnProperty.call(incomingImages, k)
        ? incomingImages[k]
        : [];
    });

    return {
      available_units: allowed.length > 0 ? JSON.stringify(allowed) : null,
      unit_prices: Object.keys(prunedPrices).length > 0 ? JSON.stringify(prunedPrices) : null,
      unit_images: allowed.length > 0 ? JSON.stringify(prunedImages) : null,
    };
  }

  // Partial update (legacy): merge with existing
  const mergedPrices = pricesExplicit ? { ...existingPrices, ...incomingPrices } : { ...existingPrices };
  const mergedImages = imagesExplicit ? { ...existingImages, ...incomingImages } : { ...existingImages };

  let allowed;
  if (unitsExplicit) {
    allowed = [...new Set(incomingUnits || [])]
      .map((u) => (typeof u === 'number' ? u : parseInt(String(u), 10)))
      .filter((n) => !Number.isNaN(n) && n > 0);
  } else {
    allowed = [
      ...new Set([...existingUnits, ...Object.keys(mergedPrices), ...Object.keys(mergedImages)]),
    ]
      .map((u) => (typeof u === 'number' ? u : parseInt(String(u), 10)))
      .filter((n) => !Number.isNaN(n) && n > 0);
  }
  const allowedKeys = new Set(allowed.map(String));

  const prunedPrices = {};
  Object.entries(mergedPrices).forEach(([k, v]) => {
    if (allowedKeys.has(String(k))) prunedPrices[k] = v;
  });

  const prunedImages = {};
  Object.entries(mergedImages).forEach(([k, v]) => {
    if (allowedKeys.has(String(k))) prunedImages[k] = v;
  });

  return {
    available_units: allowed.length > 0 ? JSON.stringify(allowed) : null,
    unit_prices: Object.keys(prunedPrices).length > 0 ? JSON.stringify(prunedPrices) : null,
    unit_images: Object.keys(prunedImages).length > 0 ? JSON.stringify(prunedImages) : null,
  };
};

const lookupUnitPackValue = (map, unit) => {
  if (!map || typeof map !== 'object') return undefined;
  const unitKey = String(unit);
  if (map[unitKey] !== undefined) return map[unitKey];
  const target = String(unit)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/packs?$/i, '');
  for (const [key, value] of Object.entries(map)) {
    const normalized = String(key)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/packs?$/i, '');
    if (normalized === target) return value;
  }
  return undefined;
};

/** Build /uploads/<relative> from multer disk path (handles absolute /app/... paths). */
const uploadRelativePathForUrl = (filePath) => {
  const normalized = String(filePath || '').replace(/\\/g, '/');
  const m = normalized.match(/\/uploads\/(.+)$/i);
  return m ? m[1] : normalized.split('/').slice(-2).join('/');
};

/**
 * List filter:
 * - With product_id: rows for that product OR shared rows (product_id null) for sub_category_id when given.
 * - Product-linked rows are not gated on sub_category_id (avoids wrong leaf id on the storefront).
 */
const applyContactLensListScope = (where, query) => {
  const { sub_category_id, product_id } = query;
  const subCatId =
    sub_category_id !== undefined && sub_category_id !== null && sub_category_id !== ''
      ? parseInt(sub_category_id, 10)
      : NaN;
  const hasSubCat = !Number.isNaN(subCatId);

  if (product_id !== undefined && product_id !== null && product_id !== '') {
    const pid = parseInt(product_id, 10);
    if (!Number.isNaN(pid)) {
      if (hasSubCat) {
        where.OR = [{ product_id: pid }, { product_id: null, sub_category_id: subCatId }];
      } else {
        where.product_id = pid;
      }
      return;
    }
  }
  if (hasSubCat) {
    where.sub_category_id = subCatId;
  }
};

// Helper function to process uploaded unit images and convert to JSON format
const processUnitImages = (req, files, existingUnitImages = null) => {
  let unitImages = {};
  if (existingUnitImages) {
    try {
      unitImages =
        typeof existingUnitImages === 'string' ? JSON.parse(existingUnitImages) : existingUnitImages;
      if (!unitImages || typeof unitImages !== 'object' || Array.isArray(unitImages)) unitImages = {};
    } catch (e) {
      console.error('processUnitImages: could not parse existing unit_images', e);
      unitImages = {};
    }
  }
  
  if (files && typeof files === 'object') {
    // Process each unit image field (e.g., unit_images_10, unit_images_20, etc.)
    Object.keys(files).forEach(fieldname => {
      if (fieldname.startsWith('unit_images_')) {
        let unitNumber = fieldname.slice('unit_images_'.length);
        if (unitNumber.endsWith('[]')) unitNumber = unitNumber.slice(0, -2);
        const uploadedFiles = files[fieldname];

        if (uploadedFiles && Array.isArray(uploadedFiles)) {
          const fileUrls = uploadedFiles.map(file => {
            const relativePath = uploadRelativePathForUrl(file.path);
            return `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
          });
          const prev = Array.isArray(unitImages[unitNumber]) ? unitImages[unitNumber] : [];
          unitImages[unitNumber] = [...prev, ...fileUrls];
        }
      }
    });
  }
  
  return unitImages;
};

// @desc    Get form configuration based on sub-sub-category
// @route   GET /api/contact-lens-forms/config/:sub_category_id
// @access  Public
exports.getFormConfig = asyncHandler(async (req, res) => {
  const { sub_category_id } = req.params;

  // Get the sub-sub-category
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(sub_category_id) },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!subCategory) {
    return error(res, 'Sub-sub-category not found', 404);
  }

  // Check if it's a sub-sub-category (has parent)
  if (!subCategory.parent_id) {
    return error(res, 'This is not a sub-sub-category', 400);
  }

  // Determine form type based on sub-sub-category name (case-insensitive)
  const subCategoryName = subCategory.name.toLowerCase();
  let formType = null;

  if (subCategoryName.includes('spherical') || subCategoryName === 'spherical') {
    formType = 'spherical';
  } else if (subCategoryName.includes('astigmatism') || subCategoryName === 'astigmatism') {
    formType = 'astigmatism';
  } else {
    return error(res, 'Unknown form type for this sub-sub-category', 400);
  }

  // Get form configuration
  let formConfig = {
    formType,
    subCategory: {
      id: subCategory.id,
      name: subCategory.name,
      slug: subCategory.slug
    }
  };

  if (formType === 'spherical') {
    // Optimized: Get all dropdown values in a single query, then filter in memory
    // This reduces database round trips from 3 to 1
    const [allDropdownValues, sphericalConfigs] = await Promise.all([
      prisma.astigmatismDropdownValue.findMany({
        where: { 
          field_type: { in: ['qty', 'base_curve', 'diameter'] },
          is_active: true 
        },
        orderBy: [{ field_type: 'asc' }, { sort_order: 'asc' }, { value: 'asc' }]
      }),
      prisma.contactLensConfiguration.findMany({
        where: {
          configuration_type: 'spherical',
          sub_category_id: parseInt(sub_category_id),
          is_active: true
        },
        select: {
          right_power: true,
          left_power: true
        }
      })
    ]);

    // Filter dropdown values in memory (faster than multiple DB queries)
    const qtyValues = allDropdownValues.filter(v => v.field_type === 'qty');
    const baseCurveValues = allDropdownValues.filter(v => v.field_type === 'base_curve');
    const diameterValues = allDropdownValues.filter(v => v.field_type === 'diameter');

    // Extract unique power values from spherical configurations
    const powerValueSet = new Set();
    sphericalConfigs.forEach(config => {
      const rightPower = parseJsonField(config.right_power);
      const leftPower = parseJsonField(config.left_power);
      
      if (Array.isArray(rightPower)) {
        rightPower.forEach(val => {
          if (val !== null && val !== undefined) {
            powerValueSet.add(String(val));
          }
        });
      }
      if (Array.isArray(leftPower)) {
        leftPower.forEach(val => {
          if (val !== null && val !== undefined) {
            powerValueSet.add(String(val));
          }
        });
      }
    });

    // Convert power values to dropdown format (sorted)
    const powerValues = Array.from(powerValueSet)
      .sort((a, b) => {
        // Sort numerically if possible, otherwise alphabetically
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      })
      .map(value => ({
        id: null, // Not from database, so no ID
        field_type: 'power',
        value: value,
        label: value,
        eye_type: null, // Can be used for both eyes
        is_active: true,
        sort_order: 0,
        created_at: null,
        updated_at: null
      }));

    // For Spherical: Return form structure with ALL fields as dropdowns
    formConfig.formFields = {
      rightEye: {
        qty: {
          type: 'select',
          label: 'Qty',
          required: true,
          options: qtyValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        baseCurve: {
          type: 'select',
          label: 'Raggio Base (B.C)',
          required: true,
          options: baseCurveValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        diameter: {
          type: 'select',
          label: 'Diametro (DIA)',
          required: true,
          options: diameterValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        power: {
          type: 'select',
          label: '* Power (PWR)',
          required: true,
          options: powerValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        }
      },
      leftEye: {
        qty: {
          type: 'select',
          label: 'Qty',
          required: true,
          options: qtyValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        baseCurve: {
          type: 'select',
          label: 'Raggio Base (B.C)',
          required: true,
          options: baseCurveValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        diameter: {
          type: 'select',
          label: 'Diametro (DIA)',
          required: true,
          options: diameterValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        power: {
          type: 'select',
          label: '* Power (PWR)',
          required: true,
          options: powerValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        }
      }
    };

    formConfig.dropdownValues = {
      qty: qtyValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      base_curve: baseCurveValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      diameter: diameterValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      power: powerValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type }))
    };
  } else if (formType === 'astigmatism') {
    // Optimized: Get ALL dropdown values in a single query, then filter in memory
    // This reduces database round trips from 6 to 1
    const allDropdownValues = await prisma.astigmatismDropdownValue.findMany({
      where: { 
        field_type: { in: ['qty', 'base_curve', 'diameter', 'power', 'cylinder', 'axis'] },
        is_active: true 
      },
      orderBy: [{ field_type: 'asc' }, { sort_order: 'asc' }, { value: 'asc' }]
    });

    // Filter dropdown values in memory (faster than multiple DB queries)
    const qtyValues = allDropdownValues.filter(v => v.field_type === 'qty');
    const baseCurveValues = allDropdownValues.filter(v => v.field_type === 'base_curve');
    const diameterValues = allDropdownValues.filter(v => v.field_type === 'diameter');
    const powerValues = allDropdownValues.filter(v => v.field_type === 'power');
    const cylinderValues = allDropdownValues.filter(v => v.field_type === 'cylinder');
    const axisValues = allDropdownValues.filter(v => v.field_type === 'axis');

    formConfig.formFields = {
      rightEye: {
        qty: {
          type: 'select',
          label: 'Qty',
          required: true,
          options: qtyValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        baseCurve: {
          type: 'select',
          label: 'Raggio Base (B.C)',
          required: true,
          options: baseCurveValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        diameter: {
          type: 'select',
          label: 'Diametro (DIA)',
          required: true,
          options: diameterValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        }
      },
      leftEye: {
        qty: {
          type: 'select',
          label: 'Qty',
          required: true,
          options: qtyValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        baseCurve: {
          type: 'select',
          label: 'Raggio Base (B.C)',
          required: true,
          options: baseCurveValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        diameter: {
          type: 'select',
          label: 'Diametro (DIA)',
          required: true,
          options: diameterValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        leftPower: {
          type: 'select',
          label: '* Occhio Sinistro PWR Power',
          required: true,
          options: powerValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        rightPower: {
          type: 'select',
          label: '* Occhio Destro PWR Power',
          required: true,
          options: powerValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        leftCylinder: {
          type: 'select',
          label: '* Cilindro (CYL) - Left',
          required: true,
          options: cylinderValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        rightCylinder: {
          type: 'select',
          label: '* Cilindro (CYL) - Right',
          required: true,
          options: cylinderValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        leftAxis: {
          type: 'select',
          label: '* Asse (AX) - Left',
          required: true,
          options: axisValues
            .filter(v => !v.eye_type || v.eye_type === 'left' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        },
        rightAxis: {
          type: 'select',
          label: '* Asse (AX) - Right',
          required: true,
          options: axisValues
            .filter(v => !v.eye_type || v.eye_type === 'right' || v.eye_type === 'both')
            .map(v => ({ value: v.value, label: v.label || v.value }))
        }
      }
    };

    formConfig.dropdownValues = {
      qty: qtyValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      base_curve: baseCurveValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      diameter: diameterValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      power: powerValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      cylinder: cylinderValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type })),
      axis: axisValues.map(v => ({ value: v.value, label: v.label || v.value, eye_type: v.eye_type }))
    };
  }

  // Add caching for form config (5 minutes) - form configs don't change frequently
  return success(res, 'Form configuration retrieved successfully', formConfig, 200, { maxAge: 300 });
});

// ==================== ADMIN ROUTES FOR SPHERICAL CONFIGURATIONS ====================

// @desc    Get all Spherical configurations
// @route   GET /api/admin/contact-lens-forms/spherical
// @access  Admin
exports.getSphericalConfigs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const where = {
    configuration_type: 'spherical',
    is_active: true
  };

  applyContactLensListScope(where, req.query);

  const [configs, total] = await Promise.all([
    prisma.contactLensConfiguration.findMany({
      where,
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            price: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(skip)
    }),
    prisma.contactLensConfiguration.count({ where })
  ]);

  // Parse JSON fields
  const formattedConfigs = configs.map(config => {
    let parsedAvailableUnits = null;
    let parsedUnitPrices = null;
    let parsedUnitImages = null;
    try {
      if (config.available_units) {
        parsedAvailableUnits = typeof config.available_units === 'string' ? JSON.parse(config.available_units) : config.available_units;
      }
      if (config.unit_prices) {
        parsedUnitPrices = typeof config.unit_prices === 'string' ? JSON.parse(config.unit_prices) : config.unit_prices;
      }
      if (config.unit_images) {
        parsedUnitImages = typeof config.unit_images === 'string' ? JSON.parse(config.unit_images) : config.unit_images;
      }
    } catch (e) {
      console.error('Error parsing available_units, unit_prices or unit_images:', e);
    }
    return {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      right_power: parseJsonField(config.right_power),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      left_power: parseJsonField(config.left_power),
      available_units: parsedAvailableUnits,
      unit_prices: parsedUnitPrices,
      unit_images: parsedUnitImages
    };
  });

  return success(res, 'Spherical configurations retrieved successfully', {
    configs: formattedConfigs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Create Spherical configuration
// @route   POST /api/admin/contact-lens-forms/spherical
// @access  Admin
exports.createSphericalConfig = asyncHandler(async (req, res) => {
  const {
    name,
    sub_category_id,
    category_id,
    product_id,
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    price,
    display_name,
    copy_right_to_left, // New flag: if true, copy right eye values to left eye
    same_for_both_eyes, // Alternative flag name for same functionality
    available_units, // JSON array of available units (independent from qty), e.g., [10, 20, 30]
    unit_prices, // JSON object mapping unit to price, e.g., {"10": 32.00, "20": 60.00, "30": 90.00}
    unit_images // JSON object mapping unit to image URLs, e.g., {"10": ["url1"], "20": ["url2"], "30": ["url3"]}
  } = req.body;

  // Validate required fields
  if (!name || !sub_category_id) {
    return error(res, 'Name and sub_category_id are required', 400);
  }

  // Verify sub-category exists and is a sub-sub-category
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(sub_category_id) }
  });

  if (!subCategory) {
    return error(res, 'Sub-sub-category not found', 404);
  }

  if (!subCategory.parent_id) {
    return error(res, 'This is not a sub-sub-category', 400);
  }

  // Validate product_id if provided (must be a contact lens product)
  let productId = null;
  if (product_id) {
    productId = parseInt(product_id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        subCategory: true
      }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    if (product.product_type !== 'contact_lens') {
      return error(res, 'Only contact lens products can be assigned to configurations', 400);
    }

    // Verify product belongs to the same category/subcategory hierarchy
    if (product.category_id !== subCategory.category_id) {
      return error(res, 'Product category does not match the configuration category', 400);
    }
  }

  // Determine if we should copy right to left
  const shouldCopyRightToLeft =
    parseMultipartTruthy(copy_right_to_left) || parseMultipartTruthy(same_for_both_eyes);

  // Prepare left eye values - copy from right if flag is set, otherwise use provided values
  let finalLeftQty = left_qty;
  let finalLeftBaseCurve = left_base_curve;
  let finalLeftDiameter = left_diameter;
  let finalLeftPower = left_power;

  if (shouldCopyRightToLeft) {
    // Copy right eye values to left eye
    finalLeftQty = right_qty;
    finalLeftBaseCurve = right_base_curve;
    finalLeftDiameter = right_diameter;
    finalLeftPower = right_power;
  }

  // Process uploaded unit images (merge uploads onto JSON from client, not only prior DB state)
  const parsedUnitImagesBody = parseUnitImagesBody(unit_images);
  let processedUnitImages = parsedUnitImagesBody;
  if (req.files && Object.keys(req.files).length > 0) {
    processedUnitImages = processUnitImages(req, req.files, parsedUnitImagesBody);
  }

  // Create configuration
  const config = await prisma.contactLensConfiguration.create({
    data: {
      name,
      sub_category_id: parseInt(sub_category_id),
      category_id: category_id ? parseInt(category_id) : subCategory.category_id,
      product_id: productId,
      configuration_type: 'spherical',
      right_qty: right_qty !== undefined ? stringifyEyeArrayForDb(right_qty) : JSON.stringify([1]),
      right_base_curve: right_base_curve !== undefined ? stringifyEyeArrayForDb(right_base_curve) : null,
      right_diameter: right_diameter !== undefined ? stringifyEyeArrayForDb(right_diameter) : null,
      right_power: right_power !== undefined ? stringifyEyeArrayForDb(right_power) : null,
      left_qty: finalLeftQty !== undefined ? stringifyEyeArrayForDb(finalLeftQty) : null,
      left_base_curve: finalLeftBaseCurve !== undefined ? stringifyEyeArrayForDb(finalLeftBaseCurve) : null,
      left_diameter: finalLeftDiameter !== undefined ? stringifyEyeArrayForDb(finalLeftDiameter) : null,
      left_power: finalLeftPower !== undefined ? stringifyEyeArrayForDb(finalLeftPower) : null,
      price: price ? parseFloat(price) : null,
      display_name: display_name || name,
      available_units: available_units !== undefined ? normalizeAvailableUnitsForDb(available_units) : null,
      unit_prices: unit_prices !== undefined ? normalizeUnitPricesForDb(unit_prices) : null,
      // Handle unit_images - convert object to JSON string
      unit_images: processedUnitImages !== undefined ? (typeof processedUnitImages === 'string' ? processedUnitImages : JSON.stringify(processedUnitImages)) : null
    },
    include: {
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true
        }
      }
    }
  });

  // Parse available_units, unit_prices and unit_images for response
  let parsedAvailableUnits = null;
  let parsedUnitPrices = null;
  let parsedUnitImages = null;
  try {
    if (config.available_units) {
      parsedAvailableUnits = typeof config.available_units === 'string' ? JSON.parse(config.available_units) : config.available_units;
    }
    if (config.unit_prices) {
      parsedUnitPrices = typeof config.unit_prices === 'string' ? JSON.parse(config.unit_prices) : config.unit_prices;
    }
    if (config.unit_images) {
      parsedUnitImages = typeof config.unit_images === 'string' ? JSON.parse(config.unit_images) : config.unit_images;
    }
  } catch (e) {
    console.error('Error parsing available_units, unit_prices or unit_images:', e);
  }

  return success(res, 'Spherical configuration created successfully', {
    config: {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      right_power: parseJsonField(config.right_power),
      left_power: parseJsonField(config.left_power),
      available_units: parsedAvailableUnits,
      unit_prices: parsedUnitPrices,
      unit_images: parsedUnitImages
    }
  }, 201);
});

// @desc    Update Spherical configuration
// @route   PUT /api/admin/contact-lens-forms/spherical/:id
// @access  Admin
exports.updateSphericalConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    sub_category_id,
    product_id,
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    price,
    display_name,
    is_active,
    copy_right_to_left, // New flag: if true, copy right eye values to left eye
    same_for_both_eyes, // Alternative flag name for same functionality
    available_units, // JSON array of available units, e.g., [10, 20, 30]
    unit_prices, // JSON object mapping unit (qty) to price, e.g., {"30": 990.00, "60": 1500.00}
    unit_images // JSON object mapping unit (qty) to image URLs, e.g., {"30": ["url1", "url2"], "60": ["url3", "url4"]}
  } = req.body;

  // Check if config exists
  const existingConfig = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingConfig) {
    return error(res, 'Configuration not found', 404);
  }

  if (existingConfig.configuration_type !== 'spherical') {
    return error(res, 'This is not a Spherical configuration', 400);
  }

  // Determine if we should copy right to left
  const shouldCopyRightToLeft =
    parseMultipartTruthy(copy_right_to_left) || parseMultipartTruthy(same_for_both_eyes);

  // Process uploaded unit images: merge new files onto client-sent URLs (removals), else existing DB
  const parsedUnitImagesBody = parseUnitImagesBody(unit_images);
  let processedUnitImages = parsedUnitImagesBody;
  if (req.files && Object.keys(req.files).length > 0) {
    const mergeBase =
      parsedUnitImagesBody !== undefined ? parsedUnitImagesBody : existingConfig.unit_images;
    processedUnitImages = processUnitImages(req, req.files, mergeBase);
  }

  // Prepare update data
  const updateData = {};
  let targetCategoryId = existingConfig.category_id;

  // Allow updating the assigned sub-sub-category for this spherical config.
  if (sub_category_id !== undefined) {
    const parsedSubCategoryId = parseInt(sub_category_id);
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: parsedSubCategoryId }
    });

    if (!subCategory) {
      return error(res, 'Sub-sub-category not found', 404);
    }
    if (!subCategory.parent_id) {
      return error(res, 'This is not a sub-sub-category', 400);
    }

    updateData.sub_category_id = parsedSubCategoryId;
    updateData.category_id = subCategory.category_id;
    targetCategoryId = subCategory.category_id;
  }

  // Validate product_id if provided (must be a contact lens product)
  if (product_id !== undefined) {
    if (product_id === null || product_id === '') {
      updateData.product_id = null;
    } else {
      const productId = parseInt(product_id);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          subCategory: true
        }
      });

      if (!product) {
        return error(res, 'Product not found', 404);
      }

      if (product.product_type !== 'contact_lens') {
        return error(res, 'Only contact lens products can be assigned to configurations', 400);
      }

      // Verify product belongs to the same category/subcategory hierarchy
      if (product.category_id !== targetCategoryId) {
        return error(res, 'Product category does not match the configuration category', 400);
      }

      updateData.product_id = productId;
    }
  }
  if (name) updateData.name = name;
  if (display_name) updateData.display_name = display_name;
  if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
  if (is_active !== undefined) {
    const b = parseMultipartBoolean(is_active);
    if (b !== undefined) updateData.is_active = b;
  }
  const packFieldsTouched =
    available_units !== undefined || unit_prices !== undefined || processedUnitImages !== undefined;
  if (packFieldsTouched) {
    const reconciled = reconcilePackFieldsForUpdate(existingConfig, {
      available_units,
      unit_prices,
      unit_images: processedUnitImages,
    });
    updateData.available_units = reconciled.available_units;
    updateData.unit_prices = reconciled.unit_prices;
    updateData.unit_images = reconciled.unit_images;
  }
  if (right_qty !== undefined) {
    updateData.right_qty = stringifyEyeArrayForDb(right_qty);
  }
  if (right_base_curve !== undefined) {
    updateData.right_base_curve = stringifyEyeArrayForDb(right_base_curve);
  }
  if (right_diameter !== undefined) {
    updateData.right_diameter = stringifyEyeArrayForDb(right_diameter);
  }
  if (right_power !== undefined) {
    updateData.right_power = stringifyEyeArrayForDb(right_power);
  }

  // Handle left eye values - copy from right if flag is set
  if (shouldCopyRightToLeft) {
    const rightQtyToUse = right_qty !== undefined ? right_qty : parseJsonField(existingConfig.right_qty);
    const rightBaseCurveToUse =
      right_base_curve !== undefined ? right_base_curve : parseJsonField(existingConfig.right_base_curve);
    const rightDiameterToUse =
      right_diameter !== undefined ? right_diameter : parseJsonField(existingConfig.right_diameter);
    const rightPowerToUse = right_power !== undefined ? right_power : parseJsonField(existingConfig.right_power);

    updateData.left_qty = stringifyEyeArrayForDb(rightQtyToUse ?? [1]);
    updateData.left_base_curve = stringifyEyeArrayForDb(rightBaseCurveToUse ?? []);
    updateData.left_diameter = stringifyEyeArrayForDb(rightDiameterToUse ?? []);
    updateData.left_power = stringifyEyeArrayForDb(rightPowerToUse ?? []);
  } else {
    if (left_qty !== undefined) {
      updateData.left_qty = stringifyEyeArrayForDb(left_qty);
    }
    if (left_base_curve !== undefined) {
      updateData.left_base_curve = stringifyEyeArrayForDb(left_base_curve);
    }
    if (left_diameter !== undefined) {
      updateData.left_diameter = stringifyEyeArrayForDb(left_diameter);
    }
    if (left_power !== undefined) {
      updateData.left_power = stringifyEyeArrayForDb(left_power);
    }
  }

  const config = await prisma.contactLensConfiguration.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true
        }
      }
    }
  });

  // Parse available_units, unit_prices and unit_images for response
  let parsedAvailableUnits = null;
  let parsedUnitPrices = null;
  let parsedUnitImages = null;
  try {
    if (config.available_units) {
      parsedAvailableUnits = typeof config.available_units === 'string' ? JSON.parse(config.available_units) : config.available_units;
    }
    if (config.unit_prices) {
      parsedUnitPrices = typeof config.unit_prices === 'string' ? JSON.parse(config.unit_prices) : config.unit_prices;
    }
    if (config.unit_images) {
      parsedUnitImages = typeof config.unit_images === 'string' ? JSON.parse(config.unit_images) : config.unit_images;
    }
  } catch (e) {
    console.error('Error parsing available_units, unit_prices or unit_images:', e);
  }

  return success(res, 'Spherical configuration updated successfully', {
    config: {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      right_power: parseJsonField(config.right_power),
      left_power: parseJsonField(config.left_power),
      available_units: parsedAvailableUnits,
      unit_prices: parsedUnitPrices,
      unit_images: parsedUnitImages
    }
  });
});

// @desc    Delete Spherical configuration
// @route   DELETE /api/admin/contact-lens-forms/spherical/:id
// @access  Admin
exports.deleteSphericalConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const config = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!config) {
    return error(res, 'Configuration not found', 404);
  }

  if (config.configuration_type !== 'spherical') {
    return error(res, 'This is not a Spherical configuration', 400);
  }

  await prisma.contactLensConfiguration.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Spherical configuration deleted successfully');
});

// ==================== ADMIN ROUTES FOR ASTIGMATISM CONFIGURATIONS ====================

// @desc    Get all Astigmatism configurations
// @route   GET /api/admin/contact-lens-forms/astigmatism
// @access  Admin
exports.getAstigmatismConfigs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const where = {
    configuration_type: 'astigmatism',
    is_active: true
  };

  applyContactLensListScope(where, req.query);

  const [configs, total] = await Promise.all([
    prisma.contactLensConfiguration.findMany({
      where,
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            price: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(skip)
    }),
    prisma.contactLensConfiguration.count({ where })
  ]);

  // Parse JSON fields
  const formattedConfigs = configs.map(config => {
    let parsedAvailableUnits = null;
    let parsedUnitPrices = null;
    let parsedUnitImages = null;
    try {
      if (config.available_units) {
        parsedAvailableUnits = typeof config.available_units === 'string' ? JSON.parse(config.available_units) : config.available_units;
      }
      if (config.unit_prices) {
        parsedUnitPrices = typeof config.unit_prices === 'string' ? JSON.parse(config.unit_prices) : config.unit_prices;
      }
      if (config.unit_images) {
        parsedUnitImages = typeof config.unit_images === 'string' ? JSON.parse(config.unit_images) : config.unit_images;
      }
    } catch (e) {
      console.error('Error parsing available_units, unit_prices or unit_images:', e);
    }
    return {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      right_power: parseJsonField(config.right_power),
      right_cylinder: parseJsonField(config.right_cylinder),
      right_axis: parseJsonField(config.right_axis),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      left_power: parseJsonField(config.left_power),
      left_cylinder: parseJsonField(config.left_cylinder),
      left_axis: parseJsonField(config.left_axis),
      available_units: parsedAvailableUnits,
      unit_prices: parsedUnitPrices,
      unit_images: parsedUnitImages
    };
  });

  return success(res, 'Astigmatism configurations retrieved successfully', {
    configs: formattedConfigs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Create Astigmatism configuration
// @route   POST /api/admin/contact-lens-forms/astigmatism
// @access  Admin
exports.createAstigmatismConfig = asyncHandler(async (req, res) => {
  const {
    name,
    sub_category_id,
    category_id,
    product_id,
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    right_cylinder,
    right_axis,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    left_cylinder,
    left_axis,
    price,
    display_name,
    copy_right_to_left, // New flag: if true, copy right eye values to left eye
    same_for_both_eyes, // Alternative flag name for same functionality
    available_units, // JSON array of available units (independent from qty), e.g., [10, 20, 30]
    unit_prices, // JSON object mapping unit to price, e.g., {"10": 32.00, "20": 60.00, "30": 90.00}
    unit_images // JSON object mapping unit to image URLs, e.g., {"10": ["url1"], "20": ["url2"], "30": ["url3"]}
  } = req.body;

  // Validate required fields
  if (!name || !sub_category_id) {
    return error(res, 'Name and sub_category_id are required', 400);
  }

  // Verify sub-category exists and is a sub-sub-category
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: parseInt(sub_category_id) }
  });

  if (!subCategory) {
    return error(res, 'Sub-sub-category not found', 404);
  }

  // Validate product_id if provided (must be a contact lens product)
  let productId = null;
  if (product_id) {
    productId = parseInt(product_id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        subCategory: true
      }
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    if (product.product_type !== 'contact_lens') {
      return error(res, 'Only contact lens products can be assigned to configurations', 400);
    }

    // Verify product belongs to the same category/subcategory hierarchy
    if (product.category_id !== subCategory.category_id) {
      return error(res, 'Product category does not match the configuration category', 400);
    }
  }

  // Determine if we should copy right to left
  const shouldCopyRightToLeft =
    parseMultipartTruthy(copy_right_to_left) || parseMultipartTruthy(same_for_both_eyes);

  // Prepare left eye values - copy from right if flag is set, otherwise use provided values
  let finalLeftQty = left_qty;
  let finalLeftBaseCurve = left_base_curve;
  let finalLeftDiameter = left_diameter;
  let finalLeftPower = left_power;
  let finalLeftCylinder = left_cylinder;
  let finalLeftAxis = left_axis;

  const parsedUnitImagesBody = parseUnitImagesBody(unit_images);
  let processedUnitImages = parsedUnitImagesBody;
  if (req.files && Object.keys(req.files).length > 0) {
    processedUnitImages = processUnitImages(req, req.files, parsedUnitImagesBody);
  }

  if (shouldCopyRightToLeft) {
    // Copy right eye values to left eye
    finalLeftQty = right_qty;
    finalLeftBaseCurve = right_base_curve;
    finalLeftDiameter = right_diameter;
    finalLeftPower = right_power;
    finalLeftCylinder = right_cylinder;
    finalLeftAxis = right_axis;
  }

  // Create configuration
  const config = await prisma.contactLensConfiguration.create({
    data: {
      name,
      sub_category_id: parseInt(sub_category_id),
      category_id: category_id ? parseInt(category_id) : subCategory.category_id,
      product_id: productId,
      configuration_type: 'astigmatism',
      right_qty: stringifyEyeArrayForDb(right_qty ?? [1]),
      right_base_curve: stringifyEyeArrayForDb(right_base_curve ?? []),
      right_diameter: stringifyEyeArrayForDb(right_diameter ?? []),
      right_power: stringifyEyeArrayForDb(right_power ?? []),
      right_cylinder: right_cylinder !== undefined ? stringifyEyeArrayForDb(right_cylinder) : null,
      right_axis: right_axis !== undefined ? stringifyEyeArrayForDb(right_axis) : null,
      left_qty: finalLeftQty !== undefined ? stringifyEyeArrayForDb(finalLeftQty) : null,
      left_base_curve: finalLeftBaseCurve !== undefined ? stringifyEyeArrayForDb(finalLeftBaseCurve) : null,
      left_diameter: finalLeftDiameter !== undefined ? stringifyEyeArrayForDb(finalLeftDiameter) : null,
      left_power: finalLeftPower !== undefined ? stringifyEyeArrayForDb(finalLeftPower) : null,
      left_cylinder: finalLeftCylinder !== undefined ? stringifyEyeArrayForDb(finalLeftCylinder) : null,
      left_axis: finalLeftAxis !== undefined ? stringifyEyeArrayForDb(finalLeftAxis) : null,
      price: price ? parseFloat(price) : null,
      display_name: display_name || name,
      available_units: available_units !== undefined ? normalizeAvailableUnitsForDb(available_units) : null,
      unit_prices: unit_prices !== undefined ? normalizeUnitPricesForDb(unit_prices) : null,
      // Handle unit_images - convert object to JSON string
      unit_images: processedUnitImages !== undefined ? (typeof processedUnitImages === 'string' ? processedUnitImages : JSON.stringify(processedUnitImages)) : null
    },
    include: {
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true
        }
      }
    }
  });

  // Parse available_units, unit_prices and unit_images for response
  let parsedAvailableUnits = null;
  let parsedUnitPrices = null;
  let parsedUnitImages = null;
  try {
    if (config.available_units) {
      parsedAvailableUnits = typeof config.available_units === 'string' ? JSON.parse(config.available_units) : config.available_units;
    }
    if (config.unit_prices) {
      parsedUnitPrices = typeof config.unit_prices === 'string' ? JSON.parse(config.unit_prices) : config.unit_prices;
    }
    if (config.unit_images) {
      parsedUnitImages = typeof config.unit_images === 'string' ? JSON.parse(config.unit_images) : config.unit_images;
    }
  } catch (e) {
    console.error('Error parsing available_units, unit_prices or unit_images:', e);
  }

  return success(res, 'Astigmatism configuration created successfully', {
    config: {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      right_power: parseJsonField(config.right_power),
      right_cylinder: parseJsonField(config.right_cylinder),
      right_axis: parseJsonField(config.right_axis),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      left_power: parseJsonField(config.left_power),
      left_cylinder: parseJsonField(config.left_cylinder),
      left_axis: parseJsonField(config.left_axis),
      available_units: parsedAvailableUnits,
      unit_prices: parsedUnitPrices,
      unit_images: parsedUnitImages
    }
  }, 201);
});

// @desc    Update Astigmatism configuration
// @route   PUT /api/admin/contact-lens-forms/astigmatism/:id
// @access  Admin
exports.updateAstigmatismConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    product_id,
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    right_cylinder,
    right_axis,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    left_cylinder,
    left_axis,
    price,
    display_name,
    is_active,
    copy_right_to_left, // New flag: if true, copy right eye values to left eye
    same_for_both_eyes, // Alternative flag name for same functionality
    unit_prices, // JSON object mapping unit (qty) to price, e.g., {"30": 990.00, "60": 1500.00}
    unit_images, // JSON object mapping unit (qty) to image URLs, e.g., {"30": ["url1", "url2"], "60": ["url3", "url4"]}
    available_units // Array of available units, e.g., ["30", "60"]
  } = req.body;

  // Check if config exists
  const existingConfig = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingConfig) {
    return error(res, 'Configuration not found', 404);
  }

  if (existingConfig.configuration_type !== 'astigmatism') {
    return error(res, 'This is not an Astigmatism configuration', 400);
  }

  // Determine if we should copy right to left
  const shouldCopyRightToLeft =
    parseMultipartTruthy(copy_right_to_left) || parseMultipartTruthy(same_for_both_eyes);

  const parsedUnitImagesBody = parseUnitImagesBody(unit_images);
  let processedUnitImages = parsedUnitImagesBody;
  if (req.files && Object.keys(req.files).length > 0) {
    const mergeBase =
      parsedUnitImagesBody !== undefined ? parsedUnitImagesBody : existingConfig.unit_images;
    processedUnitImages = processUnitImages(req, req.files, mergeBase);
  }

  // Prepare update data
  const updateData = {};

  // Validate product_id if provided (must be a contact lens product)
  if (product_id !== undefined) {
    if (product_id === null || product_id === '') {
      updateData.product_id = null;
    } else {
      const productId = parseInt(product_id);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          subCategory: true
        }
      });

      if (!product) {
        return error(res, 'Product not found', 404);
      }

      if (product.product_type !== 'contact_lens') {
        return error(res, 'Only contact lens products can be assigned to configurations', 400);
      }

      // Verify product belongs to the same category/subcategory hierarchy
      if (product.category_id !== existingConfig.category_id) {
        return error(res, 'Product category does not match the configuration category', 400);
      }

      updateData.product_id = productId;
    }
  }
  if (name) updateData.name = name;
  if (display_name) updateData.display_name = display_name;
  if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
  if (is_active !== undefined) {
    const b = parseMultipartBoolean(is_active);
    if (b !== undefined) updateData.is_active = b;
  }
  const packFieldsTouched =
    available_units !== undefined || unit_prices !== undefined || processedUnitImages !== undefined;
  if (packFieldsTouched) {
    const reconciled = reconcilePackFieldsForUpdate(existingConfig, {
      available_units,
      unit_prices,
      unit_images: processedUnitImages,
    });
    updateData.available_units = reconciled.available_units;
    updateData.unit_prices = reconciled.unit_prices;
    updateData.unit_images = reconciled.unit_images;
  }

  const rightFields = ['right_qty', 'right_base_curve', 'right_diameter', 'right_power', 'right_cylinder', 'right_axis'];
  rightFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = stringifyEyeArrayForDb(req.body[field]);
    }
  });

  if (shouldCopyRightToLeft) {
    const rightQtyToUse = right_qty !== undefined ? right_qty : parseJsonField(existingConfig.right_qty);
    const rightBaseCurveToUse =
      right_base_curve !== undefined ? right_base_curve : parseJsonField(existingConfig.right_base_curve);
    const rightDiameterToUse =
      right_diameter !== undefined ? right_diameter : parseJsonField(existingConfig.right_diameter);
    const rightPowerToUse = right_power !== undefined ? right_power : parseJsonField(existingConfig.right_power);
    const rightCylinderToUse =
      right_cylinder !== undefined ? right_cylinder : parseJsonField(existingConfig.right_cylinder);
    const rightAxisToUse = right_axis !== undefined ? right_axis : parseJsonField(existingConfig.right_axis);

    updateData.left_qty = stringifyEyeArrayForDb(rightQtyToUse ?? [1]);
    updateData.left_base_curve = stringifyEyeArrayForDb(rightBaseCurveToUse ?? []);
    updateData.left_diameter = stringifyEyeArrayForDb(rightDiameterToUse ?? []);
    updateData.left_power = stringifyEyeArrayForDb(rightPowerToUse ?? []);
    updateData.left_cylinder = stringifyEyeArrayForDb(rightCylinderToUse ?? []);
    updateData.left_axis = stringifyEyeArrayForDb(rightAxisToUse ?? []);
  } else {
    const leftFields = ['left_qty', 'left_base_curve', 'left_diameter', 'left_power', 'left_cylinder', 'left_axis'];
    leftFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = stringifyEyeArrayForDb(req.body[field]);
      }
    });
  }

  const config = await prisma.contactLensConfiguration.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true
        }
      }
    }
  });

  // Parse available_units, unit_prices and unit_images for response
  let parsedAvailableUnits = null;
  let parsedUnitPrices = null;
  let parsedUnitImages = null;
  try {
    if (config.available_units) {
      parsedAvailableUnits = typeof config.available_units === 'string' ? JSON.parse(config.available_units) : config.available_units;
    }
    if (config.unit_prices) {
      parsedUnitPrices = typeof config.unit_prices === 'string' ? JSON.parse(config.unit_prices) : config.unit_prices;
    }
    if (config.unit_images) {
      parsedUnitImages = typeof config.unit_images === 'string' ? JSON.parse(config.unit_images) : config.unit_images;
    }
  } catch (e) {
    console.error('Error parsing available_units, unit_prices or unit_images:', e);
  }

  return success(res, 'Astigmatism configuration updated successfully', {
    config: {
      ...config,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      right_power: parseJsonField(config.right_power),
      right_cylinder: parseJsonField(config.right_cylinder),
      right_axis: parseJsonField(config.right_axis),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      left_power: parseJsonField(config.left_power),
      left_cylinder: parseJsonField(config.left_cylinder),
      left_axis: parseJsonField(config.left_axis),
      available_units: parsedAvailableUnits,
      unit_prices: parsedUnitPrices,
      unit_images: parsedUnitImages
    }
  });
});

// @desc    Delete Astigmatism configuration
// @route   DELETE /api/admin/contact-lens-forms/astigmatism/:id
// @access  Admin
exports.deleteAstigmatismConfig = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const config = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!config) {
    return error(res, 'Configuration not found', 404);
  }

  if (config.configuration_type !== 'astigmatism') {
    return error(res, 'This is not an Astigmatism configuration', 400);
  }

  await prisma.contactLensConfiguration.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Astigmatism configuration deleted successfully');
});

// ==================== ADMIN ROUTES FOR ASTIGMATISM DROPDOWN VALUES ====================

// @desc    Get all Astigmatism dropdown values
// @route   GET /api/admin/contact-lens-forms/astigmatism/dropdown-values
// @access  Admin
exports.getAstigmatismDropdownValues = asyncHandler(async (req, res) => {
  const { field_type, eye_type } = req.query;

  const where = { is_active: true };
  if (field_type) {
    where.field_type = field_type;
  }
  if (eye_type) {
    where.eye_type = eye_type;
  }

  const values = await prisma.astigmatismDropdownValue.findMany({
    where,
    orderBy: [
      { field_type: 'asc' },
      { sort_order: 'asc' },
      { value: 'asc' }
    ]
  });

  // Group by field type
  const grouped = {
    power: values.filter(v => v.field_type === 'power'),
    cylinder: values.filter(v => v.field_type === 'cylinder'),
    axis: values.filter(v => v.field_type === 'axis')
  };

  return success(res, 'Astigmatism dropdown values retrieved successfully', {
    values,
    grouped
  });
});

// @desc    Create Astigmatism dropdown value
// @route   POST /api/admin/contact-lens-forms/astigmatism/dropdown-values
// @access  Admin
exports.createAstigmatismDropdownValue = asyncHandler(async (req, res) => {
  const { field_type, value, label, eye_type, sort_order } = req.body;

  // Validate required fields
  if (!field_type || !value) {
    return error(res, 'field_type and value are required', 400);
  }

  // Validate field_type
  if (!['qty', 'base_curve', 'diameter', 'power', 'cylinder', 'axis'].includes(field_type)) {
    return error(res, 'field_type must be one of: qty, base_curve, diameter, power, cylinder, axis', 400);
  }

  // Validate eye_type if provided
  if (eye_type && !['left', 'right', 'both'].includes(eye_type)) {
    return error(res, 'eye_type must be one of: left, right, both', 400);
  }

  const dropdownValue = await prisma.astigmatismDropdownValue.create({
    data: {
      field_type,
      value: String(value),
      label: label || null,
      eye_type: eye_type || null,
      sort_order: sort_order || 0
    }
  });

  return success(res, 'Astigmatism dropdown value created successfully', {
    value: dropdownValue
  }, 201);
});

// @desc    Update Astigmatism dropdown value
// @route   PUT /api/admin/contact-lens-forms/astigmatism/dropdown-values/:id
// @access  Admin
exports.updateAstigmatismDropdownValue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { value, label, eye_type, sort_order, is_active } = req.body;

  // Check if value exists
  const existingValue = await prisma.astigmatismDropdownValue.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingValue) {
    return error(res, 'Dropdown value not found', 404);
  }

  // Prepare update data
  const updateData = {};
  if (value !== undefined) updateData.value = String(value);
  if (label !== undefined) updateData.label = label;
  if (eye_type !== undefined) {
    if (eye_type && !['left', 'right', 'both'].includes(eye_type)) {
      return error(res, 'eye_type must be one of: left, right, both', 400);
    }
    updateData.eye_type = eye_type || null;
  }
  if (sort_order !== undefined) updateData.sort_order = sort_order;
  if (is_active !== undefined) {
    const b = parseMultipartBoolean(is_active);
    if (b !== undefined) updateData.is_active = b;
  }

  const dropdownValue = await prisma.astigmatismDropdownValue.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return success(res, 'Astigmatism dropdown value updated successfully', {
    value: dropdownValue
  });
});

// @desc    Delete Astigmatism dropdown value
// @route   DELETE /api/admin/contact-lens-forms/astigmatism/dropdown-values/:id
// @access  Admin
exports.deleteAstigmatismDropdownValue = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const dropdownValue = await prisma.astigmatismDropdownValue.findUnique({
    where: { id: parseInt(id) }
  });

  if (!dropdownValue) {
    return error(res, 'Dropdown value not found', 404);
  }

  await prisma.astigmatismDropdownValue.delete({
    where: { id: parseInt(id) }
  });

  return success(res, 'Astigmatism dropdown value deleted successfully');
});

// ==================== WEBSITE/PUBLIC ROUTES ====================

// @desc    Get Astigmatism dropdown values (public)
// @route   GET /api/contact-lens-forms/astigmatism/dropdown-values
// @access  Public
exports.getAstigmatismDropdownValuesPublic = asyncHandler(async (req, res) => {
  const { field_type, eye_type } = req.query;

  const where = { is_active: true };
  if (field_type) {
    where.field_type = field_type;
  }
  if (eye_type) {
    where.eye_type = eye_type;
  }

  const values = await prisma.astigmatismDropdownValue.findMany({
    where,
    orderBy: [
      { field_type: 'asc' },
      { sort_order: 'asc' },
      { value: 'asc' }
    ]
  });

  // Group by field type
  const grouped = {
    power: values.filter(v => v.field_type === 'power'),
    cylinder: values.filter(v => v.field_type === 'cylinder'),
    axis: values.filter(v => v.field_type === 'axis')
  };

  return success(res, 'Astigmatism dropdown values retrieved successfully', {
    values,
    grouped
  });
});

// @desc    Get Spherical configurations (public)
// @route   GET /api/contact-lens-forms/spherical
// @access  Public
exports.getSphericalConfigsPublic = asyncHandler(async (req, res) => {
  const where = {
    configuration_type: 'spherical',
    is_active: true
  };

  applyContactLensListScope(where, req.query);

  const configs = await prisma.contactLensConfiguration.findMany({
    where,
    include: {
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: { sort_order: 'asc' }
  });

  // Parse JSON fields
  const formattedConfigs = configs.map(config => {
    let parsedAvailableUnits = null;
    let parsedUnitPrices = null;
    let parsedUnitImages = null;
    try {
      if (config.available_units) {
        parsedAvailableUnits = typeof config.available_units === 'string' ? JSON.parse(config.available_units) : config.available_units;
      }
      if (config.unit_prices) {
        parsedUnitPrices = typeof config.unit_prices === 'string' ? JSON.parse(config.unit_prices) : config.unit_prices;
      }
      if (config.unit_images) {
        parsedUnitImages = typeof config.unit_images === 'string' ? JSON.parse(config.unit_images) : config.unit_images;
      }
    } catch (e) {
      console.error('Error parsing available_units, unit_prices or unit_images:', e);
    }
    return {
      id: config.id,
      name: config.name,
      display_name: config.display_name,
      price: config.price,
      subCategory: config.subCategory,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      right_power: parseJsonField(config.right_power),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      left_power: parseJsonField(config.left_power),
      available_units: parsedAvailableUnits,
      unit_prices: parsedUnitPrices,
      unit_images: parsedUnitImages
    };
  });

  // Add caching for public configs (2 minutes) - configs may change but not frequently
  return success(res, 'Spherical configurations retrieved successfully', {
    configs: formattedConfigs
  }, 200, { maxAge: 120 });
});

// @desc    Get Astigmatism configurations (public)
// @route   GET /api/contact-lens-forms/astigmatism
// @access  Public
exports.getAstigmatismConfigsPublic = asyncHandler(async (req, res) => {
  const where = {
    configuration_type: 'astigmatism',
    is_active: true
  };

  applyContactLensListScope(where, req.query);

  const configs = await prisma.contactLensConfiguration.findMany({
    where,
    select: {
      id: true,
      name: true,
      display_name: true,
      price: true,
      right_qty: true,
      right_base_curve: true,
      right_diameter: true,
      right_power: true,
      right_cylinder: true,
      right_axis: true,
      left_qty: true,
      left_base_curve: true,
      left_diameter: true,
      left_power: true,
      left_cylinder: true,
      left_axis: true,
      unit_prices: true,
      unit_images: true,
      subCategory: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: { sort_order: 'asc' }
  });

  // Parse JSON fields
  const formattedConfigs = configs.map(config => {
    let parsedAvailableUnits = null;
    let parsedUnitPrices = null;
    let parsedUnitImages = null;
    try {
      if (config.available_units) {
        parsedAvailableUnits = typeof config.available_units === 'string' ? JSON.parse(config.available_units) : config.available_units;
      }
      if (config.unit_prices) {
        parsedUnitPrices = typeof config.unit_prices === 'string' ? JSON.parse(config.unit_prices) : config.unit_prices;
      }
      if (config.unit_images) {
        parsedUnitImages = typeof config.unit_images === 'string' ? JSON.parse(config.unit_images) : config.unit_images;
      }
    } catch (e) {
      console.error('Error parsing available_units, unit_prices or unit_images:', e);
    }
    return {
      id: config.id,
      name: config.name,
      display_name: config.display_name,
      price: config.price,
      subCategory: config.subCategory,
      right_qty: parseJsonField(config.right_qty),
      right_base_curve: parseJsonField(config.right_base_curve),
      right_diameter: parseJsonField(config.right_diameter),
      right_power: parseJsonField(config.right_power),
      right_cylinder: parseJsonField(config.right_cylinder),
      right_axis: parseJsonField(config.right_axis),
      left_qty: parseJsonField(config.left_qty),
      left_base_curve: parseJsonField(config.left_base_curve),
      left_diameter: parseJsonField(config.left_diameter),
      left_power: parseJsonField(config.left_power),
      left_cylinder: parseJsonField(config.left_cylinder),
      left_axis: parseJsonField(config.left_axis),
      available_units: parsedAvailableUnits,
      unit_prices: parsedUnitPrices,
      unit_images: parsedUnitImages
    };
  });

  // Add caching for public configs (2 minutes) - configs may change but not frequently
  return success(res, 'Astigmatism configurations retrieved successfully', {
    configs: formattedConfigs
  }, 200, { maxAge: 120 });
});

// ==================== CHECKOUT ROUTES ====================

// @desc    Add contact lens to cart (checkout)
// @route   POST /api/contact-lens-forms/checkout
// @access  Private
exports.addContactLensToCart = asyncHandler(async (req, res) => {
  const {
    product_id,
    sub_category_id,
    form_type, // 'spherical' or 'astigmatism'
    // Common form data (both Spherical and Astigmatism)
    right_qty,
    right_base_curve,
    right_diameter,
    right_power,
    left_qty,
    left_base_curve,
    left_diameter,
    left_power,
    // Astigmatism form data only
    left_cylinder,
    right_cylinder,
    left_axis,
    right_axis,
    selected_color,
    selectedColor,
    color_display_name,
    colorDisplayName,
    selected_unit,
    selectedUnit,
    config_id,
    configId,
  } = req.body;

  const selectedColorParam =
    selected_color !== undefined && selected_color !== null && String(selected_color).trim() !== ''
      ? String(selected_color).trim()
      : selectedColor !== undefined && selectedColor !== null && String(selectedColor).trim() !== ''
        ? String(selectedColor).trim()
        : '';
  const colorDisplayNameParam =
    color_display_name !== undefined && color_display_name !== null && String(color_display_name).trim() !== ''
      ? String(color_display_name).trim()
      : colorDisplayName !== undefined && colorDisplayName !== null && String(colorDisplayName).trim() !== ''
        ? String(colorDisplayName).trim()
        : '';

  const selectedUnitRaw =
    selected_unit !== undefined && selected_unit !== null && String(selected_unit).trim() !== ''
      ? selected_unit
      : selectedUnit !== undefined && selectedUnit !== null && String(selectedUnit).trim() !== ''
        ? selectedUnit
        : null;
  const selectedUnitValue =
    selectedUnitRaw !== null && !isNaN(parseInt(String(selectedUnitRaw), 10))
      ? parseInt(String(selectedUnitRaw), 10)
      : null;

  // Validate required fields
  if (!product_id) {
    return error(res, 'Product ID is required', 400);
  }

  if (!form_type || !['spherical', 'astigmatism'].includes(form_type)) {
    return error(res, 'Form type must be either "spherical" or "astigmatism"', 400);
  }

  // Get or create cart
  let cart = await prisma.cart.findUnique({ where: { user_id: req.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { user_id: req.user.id } });
  }

  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id: parseInt(product_id) } });
  if (!product) {
    return error(res, 'Product not found', 404);
  }

  // Prepare contact lens data (common for both Spherical and Astigmatism)
  // All values come from dropdowns as strings, so we parse them carefully
  const parseNum = (val, type = 'float') => {
    if (val === undefined || val === null || val === '') return null;
    const parsed = type === 'int' ? parseInt(String(val), 10) : parseFloat(String(val));
    return isNaN(parsed) ? null : parsed;
  };

  // Allow 0 for a disabled eye — do NOT use `|| 1` (0 is falsy and was forcing qty 2).
  const rightQtyParsed = parseNum(right_qty, 'int');
  const leftQtyParsed = parseNum(left_qty, 'int');
  const rightQty = rightQtyParsed === null ? 0 : Math.max(0, rightQtyParsed);
  const leftQty = leftQtyParsed === null ? 0 : Math.max(0, leftQtyParsed);

  if (rightQty < 1 && leftQty < 1) {
    return error(res, 'Select at least one eye with quantity of 1 or more', 400);
  }

  const contactLensData = {
    contact_lens_right_qty: rightQty,
    contact_lens_right_base_curve: rightQty > 0 ? parseNum(right_base_curve) : null,
    contact_lens_right_diameter: rightQty > 0 ? parseNum(right_diameter) : null,
    contact_lens_right_power: rightQty > 0 ? parseNum(right_power) : null,
    contact_lens_left_qty: leftQty,
    contact_lens_left_base_curve: leftQty > 0 ? parseNum(left_base_curve) : null,
    contact_lens_left_diameter: leftQty > 0 ? parseNum(left_diameter) : null,
    contact_lens_left_power: leftQty > 0 ? parseNum(left_power) : null
  };

  // Resolve pack (unit) price from contact lens configurations for this product
  const productIdInt = parseInt(product_id, 10);
  const configIdInt =
    config_id !== undefined && config_id !== null && String(config_id).trim() !== ''
      ? parseInt(String(config_id), 10)
      : configId !== undefined && configId !== null && String(configId).trim() !== ''
        ? parseInt(String(configId), 10)
        : NaN;

  const packWhereOr = [{ product_id: productIdInt }];
  if (sub_category_id) {
    packWhereOr.push({ sub_category_id: parseInt(String(sub_category_id), 10) });
  }
  if (!isNaN(configIdInt)) {
    packWhereOr.push({ id: configIdInt });
  }

  const packConfigs = await prisma.contactLensConfiguration.findMany({
    where: {
      configuration_type: form_type,
      is_active: true,
      OR: packWhereOr,
    },
    select: {
      id: true,
      product_id: true,
      price: true,
      unit_prices: true,
      available_units: true,
    },
    orderBy: [{ sort_order: 'asc' }],
  });

  // Prefer explicit config_id, then product-linked configs, then shared subcategory configs
  const orderedConfigs = [
    ...(!isNaN(configIdInt) ? packConfigs.filter((c) => c.id === configIdInt) : []),
    ...packConfigs.filter((c) => c.product_id === productIdInt && (isNaN(configIdInt) || c.id !== configIdInt)),
    ...packConfigs.filter(
      (c) =>
        c.product_id !== productIdInt &&
        (isNaN(configIdInt) || c.id !== configIdInt)
    ),
  ];

  let availableUnitsSet = new Set();
  let mergedUnitPrices = {};
  let configFallbackPrice = null;

  for (const cfg of orderedConfigs) {
    if (configFallbackPrice == null && cfg.price != null) {
      const p = parseFloat(cfg.price);
      if (!isNaN(p)) configFallbackPrice = p;
    }
    let unitPrices = null;
    let availableUnits = null;
    try {
      if (cfg.unit_prices) {
        unitPrices =
          typeof cfg.unit_prices === 'string' ? JSON.parse(cfg.unit_prices) : cfg.unit_prices;
      }
      if (cfg.available_units) {
        availableUnits =
          typeof cfg.available_units === 'string'
            ? JSON.parse(cfg.available_units)
            : cfg.available_units;
      }
    } catch (e) {
      console.error('Error parsing pack unit_prices/available_units:', e);
    }
    if (Array.isArray(availableUnits)) {
      availableUnits.forEach((u) => {
        const n = parseInt(String(u), 10);
        if (!isNaN(n)) availableUnitsSet.add(n);
      });
    }
    if (unitPrices && typeof unitPrices === 'object') {
      Object.keys(unitPrices).forEach((k) => {
        const n = parseInt(String(k), 10);
        if (!isNaN(n)) availableUnitsSet.add(n);
        if (mergedUnitPrices[String(k)] === undefined) {
          mergedUnitPrices[String(k)] = unitPrices[k];
        }
      });
    }
  }

  const hasPackOptions = availableUnitsSet.size > 0 || Object.keys(mergedUnitPrices).length > 0;

  if (hasPackOptions && selectedUnitValue == null) {
    return error(res, 'Pack size (selected_unit) is required for this product', 400);
  }

  if (selectedUnitValue != null && availableUnitsSet.size > 0 && !availableUnitsSet.has(selectedUnitValue)) {
    // Still allow if price map has the key via lookupUnitPackValue
    const hasPrice = lookupUnitPackValue(mergedUnitPrices, selectedUnitValue) !== undefined;
    if (!hasPrice) {
      return error(res, `Invalid pack size: ${selectedUnitValue}`, 400);
    }
  }

  let unitPrice = parseFloat(product.price);
  if (selectedUnitValue != null) {
    const rawPackPrice = lookupUnitPackValue(mergedUnitPrices, selectedUnitValue);
    if (rawPackPrice !== undefined && rawPackPrice !== null && String(rawPackPrice).trim() !== '') {
      const parsedPack = parseFloat(rawPackPrice);
      if (!isNaN(parsedPack)) {
        unitPrice = parsedPack;
      }
    } else if (configFallbackPrice != null) {
      unitPrice = configFallbackPrice;
    }
  }

  // Customization: astigmatism (cylinder/axis) + optional color + selected pack
  const colorCustomization = buildContactLensColorCustomization(
    product,
    selectedColorParam,
    colorDisplayNameParam
  );
  let customizationMerged = null;
  if (form_type === 'astigmatism') {
    customizationMerged = {
      left_cylinder: leftQty > 0 ? parseNum(left_cylinder) : null,
      right_cylinder: rightQty > 0 ? parseNum(right_cylinder) : null,
      left_axis: leftQty > 0 ? parseNum(left_axis, 'int') : null,
      right_axis: rightQty > 0 ? parseNum(right_axis, 'int') : null
    };
  }
  if (colorCustomization) {
    customizationMerged = { ...(customizationMerged || {}), ...colorCustomization };
  }
  if (selectedUnitValue != null) {
    customizationMerged = {
      ...(customizationMerged || {}),
      selected_unit: selectedUnitValue,
      pack_price: unitPrice,
    };
  }
  if (customizationMerged && Object.keys(customizationMerged).length) {
    contactLensData.customization = JSON.stringify(customizationMerged);
  }

  // Line quantity = packs for enabled eyes only (exact selection)
  const quantity = rightQty + leftQty;

  // Check stock
  if (product.stock_quantity < quantity) {
    return error(res, 'Insufficient stock', 400);
  }

  // Create cart item with selected pack unit_price
  const cartItem = await prisma.cartItem.create({
    data: {
      cart_id: cart.id,
      product_id: productIdInt,
      quantity: quantity,
      unit_price: unitPrice,
      ...contactLensData
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          color_images: true
        }
      }
    }
  });

  // Parse customization and images for response
  let productImages = cartItem.product.images;
  if (productImages) {
    try {
      productImages = typeof productImages === 'string' ? JSON.parse(productImages) : productImages;
      if (!Array.isArray(productImages)) {
        productImages = productImages ? [productImages] : [];
      }
    } catch (e) {
      productImages = [];
    }
  } else {
    productImages = [];
  }

  let parsedCustomization = null;
  if (cartItem.customization) {
    try {
      parsedCustomization =
        typeof cartItem.customization === 'string'
          ? JSON.parse(cartItem.customization)
          : cartItem.customization;
    } catch (e) {
      parsedCustomization = null;
    }
  }

  const parsedItem = {
    ...cartItem,
    unit_price: parseFloat(cartItem.unit_price),
    customization: parsedCustomization,
    product: {
      ...cartItem.product,
      images: productImages
    }
  };

  // Return success response (using 200 instead of 201 for consistency with frontend expectations)
  return success(res, 'Contact lens added to cart successfully', {
    item: parsedItem
  }, 200);
});

// @desc    Get contact lens products for admin (filtered by category/subcategory hierarchy)
// @route   GET /api/admin/contact-lens-forms/products
// @access  Admin
exports.getContactLensProducts = asyncHandler(async (req, res) => {
  const { category_id, sub_category_id, sub_sub_category_id } = req.query;

  // Build where clause - only contact lens products
  const where = {
    product_type: 'contact_lens',
    is_active: true
  };

  // Filter by category if provided
  if (category_id) {
    where.category_id = parseInt(category_id);
  }

  // Filter by subcategory (can be parent or child)
  if (sub_category_id) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(sub_category_id) },
      include: {
        children: {
          select: { id: true }
        }
      }
    });

    if (subCategory) {
      // If it has children, include products from both parent and children
      if (subCategory.children && subCategory.children.length > 0) {
        const subcategoryIds = [subCategory.id, ...subCategory.children.map(c => c.id)];
        where.sub_category_id = { in: subcategoryIds };
      } else {
        where.sub_category_id = subCategory.id;
      }
    }
  }

  // Filter by sub-sub-category (must be a child subcategory)
  if (sub_sub_category_id) {
    const subSubCategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(sub_sub_category_id) }
    });

    if (subSubCategory && subSubCategory.parent_id) {
      where.sub_category_id = subSubCategory.id;
    } else if (subSubCategory) {
      return error(res, 'The provided sub_sub_category_id is not a sub-sub-category (it does not have a parent)', 400);
    }
  }

  // Get products with category and subcategory info
  const products = await prisma.product.findMany({
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
          slug: true,
          parent_id: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Format products
  const formattedProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price.toString(),
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug
    } : null,
    subcategory: product.subCategory ? {
      id: product.subCategory.id,
      name: product.subCategory.name,
      slug: product.subCategory.slug,
      parent_id: product.subCategory.parent_id,
      parent: product.subCategory.parent ? {
        id: product.subCategory.parent.id,
        name: product.subCategory.parent.name,
        slug: product.subCategory.parent.slug
      } : null
    } : null
  }));

  return success(res, 'Contact lens products retrieved successfully', {
    products: formattedProducts,
    total: formattedProducts.length
  });
});

// @desc    Get price and images for selected unit (independent from qty)
// @route   GET /api/contact-lens-forms/config/:config_id/unit/:unit
// @access  Public
exports.getUnitPriceAndImages = asyncHandler(async (req, res) => {
  const { config_id, unit } = req.params;

  // Validate unit parameter - unit is independent from qty (e.g., 10, 20, 30)
  const unitValue = parseInt(unit);
  if (isNaN(unitValue)) {
    return error(res, 'Invalid unit value. Unit must be a number (e.g., 10, 20, 30)', 400);
  }

  // Get configuration
  const config = await prisma.contactLensConfiguration.findUnique({
    where: { id: parseInt(config_id) },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true,
          images: true
        }
      }
    }
  });

  if (!config) {
    return error(res, 'Configuration not found', 404);
  }

  // Parse available_units, unit_prices and unit_images
  let availableUnits = null;
  let unitPrices = null;
  let unitImages = null;
  try {
    if (config.available_units) {
      availableUnits = typeof config.available_units === 'string' ? JSON.parse(config.available_units) : config.available_units;
    }
    if (config.unit_prices) {
      unitPrices = typeof config.unit_prices === 'string' ? JSON.parse(config.unit_prices) : config.unit_prices;
    }
    if (config.unit_images) {
      unitImages = typeof config.unit_images === 'string' ? JSON.parse(config.unit_images) : config.unit_images;
    }
  } catch (e) {
    console.error('Error parsing available_units, unit_prices or unit_images:', e);
  }

  const unitKey = String(unitValue);

  const rawUnitPrice = lookupUnitPackValue(unitPrices, unitValue);
  const unitPrice =
    rawUnitPrice !== undefined ? parseFloat(rawUnitPrice) : config.price ? parseFloat(config.price) : null;

  const rawUnitImages = lookupUnitPackValue(unitImages, unitValue);
  const unitImageUrls = rawUnitImages
    ? Array.isArray(rawUnitImages)
      ? rawUnitImages
      : [rawUnitImages]
    : null;

  // If no unit-specific images, fall back to general images
  let images = unitImageUrls;
  if (!images || images.length === 0) {
    // Try product images
    if (config.product && config.product.images) {
      try {
        const productImages = typeof config.product.images === 'string' ? JSON.parse(config.product.images) : config.product.images;
        images = Array.isArray(productImages) ? productImages : [productImages];
      } catch (e) {
        console.error('Error parsing product images:', e);
      }
    }
    // Fall back to config images
    if ((!images || images.length === 0) && config.images) {
      try {
        const configImages = typeof config.images === 'string' ? JSON.parse(config.images) : config.images;
        images = Array.isArray(configImages) ? configImages : [configImages];
      } catch (e) {
        console.error('Error parsing config images:', e);
      }
    }
  }

  // Prepare available units list with prices
  let availableUnitsList = [];
  if (availableUnits && Array.isArray(availableUnits)) {
    availableUnitsList = availableUnits.map(u => ({
      unit: parseInt(u),
      price: unitPrices && unitPrices[String(u)] !== undefined ? parseFloat(unitPrices[String(u)]) : (config.price ? parseFloat(config.price) : null)
    }));
  } else if (unitPrices) {
    // Fallback: derive from unit_prices if available_units not set
    availableUnitsList = Object.keys(unitPrices).map(u => ({
      unit: parseInt(u),
      price: parseFloat(unitPrices[u])
    }));
  }

  // Add caching for unit price/images (1 minute) - prices may change but images are stable
  return success(res, 'Unit price and images retrieved successfully', {
    config_id: config.id,
    config_name: config.name,
    unit: unitValue,
    price: unitPrice,
    images: images || [],
    // Return all available units with their prices for reference
    available_units: availableUnitsList.length > 0 ? availableUnitsList : null
  }, 200, { maxAge: 60 });
});

