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

// 1) schema — model_code
patch(path.join(root, 'prisma', 'schema.prisma'), (t) => {
  if (t.includes('model_code')) {
    console.log('schema model_code already');
    return t;
  }
  const old = `  sku                   String                     @unique @db.VarChar(100)
  description           String?                    @db.Text`;
  const neu = `  sku                   String                     @unique @db.VarChar(100)
  model_code            String?                    @db.VarChar(100)
  description           String?                    @db.Text`;
  if (!t.includes(old)) throw new Error('Product sku block missing');
  t = t.replace(old, neu);
  // index optional
  if (!t.includes('@@index([model_code])')) {
    t = t.replace('  @@index([sku])\n', '  @@index([sku])\n  @@index([model_code])\n');
  }
  return t;
});

const migDir = path.join(root, 'prisma', 'migrations', '20261123120000_product_model_code');
fs.mkdirSync(migDir, { recursive: true });
fs.writeFileSync(
  path.join(migDir, 'migration.sql'),
  `-- AlterTable
ALTER TABLE \`products\` ADD COLUMN \`model_code\` VARCHAR(100) NULL;

-- CreateIndex
CREATE INDEX \`products_model_code_idx\` ON \`products\`(\`model_code\`);
`
);
console.log('OK migration model_code');

// 2) constants + productController FRAME_SHAPES butterfly
patch(path.join(root, 'utils', 'constants.js'), (t) => {
  if (t.includes("'butterfly'")) return t;
  return t.replace(
    `  FRAME_SHAPES: [
    'round',
    'square',
    'oval',
    'cat-eye',
    'aviator',
    'rectangle',
    'wayfarer',
    'geometric'
  ],`,
    `  FRAME_SHAPES: [
    'round',
    'square',
    'oval',
    'cat-eye',
    'aviator',
    'rectangle',
    'wayfarer',
    'geometric',
    'butterfly'
  ],`
  );
});

patch(path.join(root, 'controllers', 'productController.js'), (t) => {
  if (!t.includes("'butterfly'")) {
    t = t.replace(
      `const FRAME_SHAPES = [
  'round',
  'square',
  'oval',
  'cat_eye',
  'aviator',
  'rectangle',
  'wayfarer',
  'geometric'
];`,
      `const FRAME_SHAPES = [
  'round',
  'square',
  'oval',
  'cat_eye',
  'aviator',
  'rectangle',
  'wayfarer',
  'geometric',
  'butterfly'
];`
    );
  }

  // Size filters on getProducts
  if (!t.includes('lens_width') || !t.includes('frame_width')) {
    const oldParams = `    frameShape,`;
    // find getProducts destructuring
    const marker = 'exports.getProducts = asyncHandler(async (req, res) => {';
    const idx = t.indexOf(marker);
    if (idx < 0) throw new Error('getProducts missing');
    // Add query params after frameShape if not present
    if (!t.includes('lens_width,') && !t.includes('lensWidth')) {
      t = t.replace(
        /frameShape,\s*\n/,
        `frameShape,
    lens_width,
    bridge_width,
    temple_length,
    frame_width,
`
      );
    }

    // Add where filters before findMany — after frameShape where
    if (!t.includes('frameSizes:') && t.includes('if (frameShape) where.frame_shape = frameShape;')) {
      t = t.replace(
        'if (frameShape) where.frame_shape = frameShape;',
        `if (frameShape) where.frame_shape = frameShape;

  // Size filters via related frame_sizes (calibro / ponte / asta / frame width)
  const sizeAnd = [];
  const lw = lens_width != null && String(lens_width).trim() !== '' ? Number(lens_width) : null;
  const bw = bridge_width != null && String(bridge_width).trim() !== '' ? Number(bridge_width) : null;
  const tw = temple_length != null && String(temple_length).trim() !== '' ? Number(temple_length) : null;
  const fw = frame_width != null && String(frame_width).trim() !== '' ? Number(frame_width) : null;
  if (lw != null && !Number.isNaN(lw)) sizeAnd.push({ lens_width: lw });
  if (bw != null && !Number.isNaN(bw)) sizeAnd.push({ bridge_width: bw });
  if (tw != null && !Number.isNaN(tw)) sizeAnd.push({ temple_length: tw });
  if (fw != null && !Number.isNaN(fw)) sizeAnd.push({ frame_width: fw });
  if (sizeAnd.length > 0) {
    where.frameSizes = { some: Object.assign({}, ...sizeAnd) };
  }`
      );
    }
  }

  return t;
});

// 3) adminController — model_code, barcode/purchase_code, auto stock
patch(path.join(root, 'controllers', 'adminController.js'), (t) => {
  // Map model_name → model_code early in create/update paths
  if (!t.includes('model_name → model_code') && !t.includes("productData.model_code = productData.model_name")) {
    // Insert before validProductFields cleanup — map names
    const validOld = `    const validProductFields = [
      'name', 'slug', 'sku', 'description', 'short_description',`;
    const validNeu = `    // model_name → model_code (admin form field name)
    if (productData.model_name != null && productData.model_code == null) {
      productData.model_code = String(productData.model_name).trim() || null;
    }
    delete productData.model_name;

    const validProductFields = [
      'name', 'slug', 'sku', 'model_code', 'description', 'short_description',`;
    if (!t.includes(validOld)) throw new Error('validProductFields missing');
    // May appear twice (create + update) — replace all
    if (!t.includes("'model_code', 'description'")) {
      t = t.split(validOld).join(validNeu);
    }
  }

  // Ensure model_code in validProductFields if mapping already done differently
  if (!t.includes("'model_code'")) {
    t = t.replace("'name', 'slug', 'sku',", "'name', 'slug', 'sku', 'model_code',");
  }

  // byHex color entry — include barcode + purchase_code
  const byHexOld = `          byHex[hex] = {
            hexCode: hex,
            name: colorData.name || colorData.display_name || getColorNameFromHex(hex),
            display_name: colorData.display_name || colorData.name || getColorNameFromHex(hex),
            price: colorData.price !== undefined && colorData.price !== null ? parseFloat(colorData.price) : null,
            stock_quantity: colorData.stock_quantity != null ? Number(colorData.stock_quantity) : null,
            stock_status: colorData.stock_status || null,
            images: []
          };`;
  const byHexNeu = `          byHex[hex] = {
            hexCode: hex,
            name: colorData.name || colorData.display_name || getColorNameFromHex(hex),
            display_name: colorData.display_name || colorData.name || getColorNameFromHex(hex),
            price: colorData.price !== undefined && colorData.price !== null ? parseFloat(colorData.price) : null,
            stock_quantity: colorData.stock_quantity != null ? Number(colorData.stock_quantity) : null,
            stock_status: colorData.stock_status || null,
            barcode: colorData.barcode || colorData.bar_code || null,
            purchase_code: colorData.purchase_code || colorData.purchaseCode || null,
            images: []
          };`;
  if (t.includes(byHexOld)) t = t.replace(byHexOld, byHexNeu);
  // merge barcode if later entry has it
  if (!t.includes('byHex[hex].barcode') && t.includes('if (byHex[hex].price == null && colorData.price != null)')) {
    t = t.replace(
      `        if (byHex[hex].price == null && colorData.price != null) {
          byHex[hex].price = parseFloat(colorData.price);
        }`,
      `        if (byHex[hex].price == null && colorData.price != null) {
          byHex[hex].price = parseFloat(colorData.price);
        }
        if (!byHex[hex].barcode && (colorData.barcode || colorData.bar_code)) {
          byHex[hex].barcode = colorData.barcode || colorData.bar_code;
        }
        if (!byHex[hex].purchase_code && (colorData.purchase_code || colorData.purchaseCode)) {
          byHex[hex].purchase_code = colorData.purchase_code || colorData.purchaseCode;
        }
        if (colorData.stock_quantity != null) {
          byHex[hex].stock_quantity = Number(colorData.stock_quantity);
        }`
    );
  }

  // colors map for get product — include barcode/purchase_code
  const colorsReturnOld = `      return {
        name: colorName,
        display_name: colorData.display_name || colorName,
        value: hexCode, // Use hex code as value for matching
        hexCode: hexCode, // Hex code for color picker
        price: colorData.price !== undefined && colorData.price !== null ? parseFloat(colorData.price) : null, // Variant-specific price
        stock_quantity: stockQty,
        stock_status: stockStatus,
        images: Array.isArray(colorData.images) ? colorData.images : (colorData.images ? [colorData.images] : []),
        primaryImage: Array.isArray(colorData.images) && colorData.images.length > 0
          ? colorData.images[0]
          : (colorData.images || null)
      };`;
  const colorsReturnNeu = `      return {
        name: colorName,
        display_name: colorData.display_name || colorName,
        value: hexCode, // Use hex code as value for matching
        hexCode: hexCode, // Hex code for color picker
        price: colorData.price !== undefined && colorData.price !== null ? parseFloat(colorData.price) : null, // Variant-specific price
        stock_quantity: stockQty,
        stock_status: stockStatus,
        barcode: colorData.barcode || colorData.bar_code || null,
        purchase_code: colorData.purchase_code || colorData.purchaseCode || null,
        images: Array.isArray(colorData.images) ? colorData.images : (colorData.images ? [colorData.images] : []),
        primaryImage: Array.isArray(colorData.images) && colorData.images.length > 0
          ? colorData.images[0]
          : (colorData.images || null)
      };`;
  if (t.includes(colorsReturnOld)) t = t.replace(colorsReturnOld, colorsReturnNeu);

  // Auto-sum stock after color_images normalize (before prisma create/update)
  // Insert after color_images JSON stringify in normalize block
  if (!t.includes('Auto-sum stock from color_images')) {
    const afterColorSave = `      productData.color_images = colorImagesArray.length > 0 ? JSON.stringify(colorImagesArray) : null;
      console.log('💾 Saving color_images to DB:', productData.color_images ? \`\${colorImagesArray.length} color(s)\` : 'null');
    }`;
    const withSum = `      // Preserve barcode / purchase_code on each color entry
      colorImagesArray = colorImagesArray.map((c) => ({
        ...c,
        barcode: c.barcode || c.bar_code || null,
        purchase_code: c.purchase_code || c.purchaseCode || null,
        stock_quantity: c.stock_quantity != null ? Number(c.stock_quantity) : c.stock_quantity,
      }));
      productData.color_images = colorImagesArray.length > 0 ? JSON.stringify(colorImagesArray) : null;
      console.log('💾 Saving color_images to DB:', productData.color_images ? \`\${colorImagesArray.length} color(s)\` : 'null');

      // Auto-sum stock from color_images when any color has stock_quantity
      const colorStocks = colorImagesArray
        .map((c) => (c.stock_quantity != null && c.stock_quantity !== '' ? Number(c.stock_quantity) : null))
        .filter((n) => n != null && !Number.isNaN(n));
      if (colorStocks.length > 0) {
        productData.stock_quantity = colorStocks.reduce((a, b) => a + b, 0);
        if (productData.stock_status === undefined) {
          productData.stock_status = productData.stock_quantity > 0 ? 'in_stock' : 'out_of_stock';
        }
        console.log('Auto-sum stock from color_images:', productData.stock_quantity);
      }
    }`;
    if (t.includes(afterColorSave)) {
      t = t.split(afterColorSave).join(withSum);
    } else {
      console.warn('WARN color_images save block not exact');
    }
  }

  // Also sum after byHex assign path
  if (!t.includes('Auto-sum after byHex') && t.includes('productData.color_images = JSON.stringify(Object.values(byHex));')) {
    t = t.replace(
      'productData.color_images = JSON.stringify(Object.values(byHex));',
      `productData.color_images = JSON.stringify(Object.values(byHex));
      // Auto-sum after byHex
      {
        const vals = Object.values(byHex);
        const stocks = vals
          .map((c) => (c.stock_quantity != null ? Number(c.stock_quantity) : null))
          .filter((n) => n != null && !Number.isNaN(n));
        if (stocks.length > 0) {
          productData.stock_quantity = stocks.reduce((a, b) => a + b, 0);
          if (productData.stock_status === undefined) {
            productData.stock_status = productData.stock_quantity > 0 ? 'in_stock' : 'out_of_stock';
          }
        }
      }`
    );
  }

  // Return model_code as model_name for admin UI compatibility on get
  if (!t.includes('model_name: product.model_code') && t.includes('color_images: colorImages,')) {
    // soft — product responses often spread product
  }

  return t;
});

// 4) cartController — store codes
patch(path.join(root, 'controllers', 'cartController.js'), (t) => {
  const old = `      customizationData.selected_color = hexCode || selectedColorVariant.color || selectedColorVariant.name;
      customizationData.hex_code = hexCode;
      customizationData.color_name = colorName;
      customizationData.color_display_name = selectedColorVariant.display_name || colorName;
      customizationData.variant_price = variantPrice;
      customizationData.color_stock_quantity = resolvedVariantStockQuantity;
      customizationData.variant_images = Array.isArray(selectedColorVariant.images) 
        ? selectedColorVariant.images 
        : (selectedColorVariant.images ? [selectedColorVariant.images] : [])`;
  const neu = `      customizationData.selected_color = hexCode || selectedColorVariant.color || selectedColorVariant.name;
      customizationData.hex_code = hexCode;
      customizationData.color_name = colorName;
      customizationData.color_display_name = selectedColorVariant.display_name || colorName;
      customizationData.variant_price = variantPrice;
      customizationData.color_stock_quantity = resolvedVariantStockQuantity;
      customizationData.barcode = selectedColorVariant.barcode || selectedColorVariant.bar_code || null;
      customizationData.purchase_code = selectedColorVariant.purchase_code || selectedColorVariant.purchaseCode || null;
      customizationData.model_code = product.model_code || product.model_name || null;
      customizationData.variant_images = Array.isArray(selectedColorVariant.images) 
        ? selectedColorVariant.images 
        : (selectedColorVariant.images ? [selectedColorVariant.images] : [])`;
  if (!t.includes(old)) {
    if (t.includes('customizationData.barcode')) console.log('cart codes already');
    else throw new Error('cart color customization block missing');
  } else {
    t = t.replace(old, neu);
  }
  return t;
});

console.log('backend docx patches done');
