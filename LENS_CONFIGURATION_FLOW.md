# Lens Configuration Flow Documentation

## Overview
This document explains the complete flow of the lens configuration system, from product selection to adding items to cart with full lens customization.

---

## 🎯 User Flow: Product Selection to Cart

### Step 1: Product Selection
**User Action:** User selects a product (eyeglasses frame)

**API Endpoint:**
```
GET /api/products/:id
```

**Response:** Product details including:
- Product information
- Price
- Images
- Frame specifications

---

### Step 2: Select Lenses
**User Action:** User clicks "Select Lenses" button

**API Endpoint:**
```
GET /api/products/:id/configuration
```

**Response:** Returns all available lens configuration options:
```json
{
  "product": {
    "id": 1,
    "name": "Testing",
    "price": 500.00
  },
  "prescriptionLensTypes": [
    {
      "id": 1,
      "name": "Distance Vision",
      "prescriptionType": "single_vision",
      "basePrice": 60.00,
      "colors": [...],
      "variants": []
    },
    {
      "id": 2,
      "name": "Near Vision",
      "prescriptionType": "single_vision",
      "basePrice": 60.00,
      "colors": [...],
      "variants": []
    },
    {
      "id": 3,
      "name": "Progressive",
      "prescriptionType": "progressive",
      "basePrice": 60.00,
      "colors": [...],
      "variants": [
        {
          "id": 1,
          "name": "Premium",
          "price": 52.95,
          "isRecommended": true
        },
        {
          "id": 2,
          "name": "Standard",
          "price": 37.95
        }
      ]
    }
  ],
  "lensThicknessMaterials": [
    {
      "id": 1,
      "name": "Unbreakable (Plastic)",
      "price": 30.00
    },
    {
      "id": 2,
      "name": "Minerals (Glass)",
      "price": 60.00
    }
  ],
  "lensThicknessOptions": [
    {
      "id": 1,
      "name": "Thin",
      "thicknessValue": 1.5
    },
    {
      "id": 2,
      "name": "Medium",
      "thicknessValue": 2.0
    }
  ],
  "lensTreatments": [
    {
      "id": 1,
      "name": "Scratch Proof",
      "type": "scratch_proof",
      "price": 30.00
    },
    {
      "id": 2,
      "name": "Anti Glare",
      "type": "anti_glare",
      "price": 30.00
    },
    {
      "id": 3,
      "name": "Blue Lens Anti Glare",
      "type": "blue_light_anti_glare",
      "price": 30.00
    }
  ],
  "photochromicColors": [
    {
      "id": 1,
      "name": "Gray",
      "hexCode": "#808080",
      "imageUrl": "...",
      "priceAdjustment": 0.00
    }
  ],
  "prescriptionSunColors": [
    {
      "id": 1,
      "name": "Dark Brown",
      "hexCode": "#654321",
      "imageUrl": "...",
      "priceAdjustment": 0.00
    }
  ]
```

---

### Step 3: Select Lens Type

#### Option A: Distance Vision
**User Action:** User selects "Distance Vision"

**Frontend Flow:**
1. Show prescription form with fields:
   - PD (Pupillary Distance)
   - Right Eye OD (SPH, CYL, AXIS)
   - Left Eye OS (SPH, CYL, AXIS)

**Data Structure:**
```json
{
  "lens_type": "distance_vision",
  "prescription_data": {
    "pd": 64,
    "od": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    },
    "os": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    }
  }
}
```

#### Option B: Near Vision
**User Action:** User selects "Near Vision"

**Frontend Flow:**
1. Show prescription form (same as Distance Vision)
2. Store prescription data in same format

**Data Structure:**
```json
{
  "lens_type": "near_vision",
  "prescription_data": {
    "pd": 64,
    "od": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    },
    "os": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    }
  }
}
```

#### Option C: Progressive
**User Action:** User selects "Progressive"

**Frontend Flow:**
1. Show progressive lens variants (Premium, Standard, Mid-Range, Near-Range)
2. User selects a variant
3. Show additional form fields:
   - PD (Pupillary Distance)
   - H (Height)
   - Right Eye OD (SPH, CYL, AXIS)
   - Left Eye OS (SPH, CYL, AXIS)
   - Year of Birth

**Data Structure:**
```json
{
  "lens_type": "progressive",
  "progressive_variant_id": 1,
  "prescription_data": {
    "pd": 64,
    "pd_right": 32,
    "h": 18,
    "od": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    },
    "os": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    },
    "year_of_birth": 1980
  }
}
```

---

### Step 4: Lens Thickness Selection

**User Action:** User proceeds to lens thickness section

**Frontend Flow:**
1. Display two material options:
   - Unbreakable (Plastic) - €30.00
   - Minerals (Glass) - €60.00
2. User selects a material
3. Display thickness dropdown options

**Data Structure:**
```json
{
  "lens_thickness_material_id": 1,  // Unbreakable (Plastic)
  "lens_thickness_option_id": 2     // Medium thickness
}
```

**API Endpoints Used:**
```
GET /api/lens/thickness-materials      // Get all materials
GET /api/lens/thickness-options       // Get all options
```

---

### Step 5: Treatment Selection

**User Action:** User selects treatments

**Frontend Flow:**
1. Display available treatments:
   - Scratch Proof (€30.00)
   - Anti Glare (€30.00)
   - Blue Lens Anti Glare (€30.00)
   - Photochromic (with color selection)
   - Prescription Lenses Sun (with color selection)
2. User can select multiple treatments
3. If Photochromic selected, show color options
4. If Prescription Lenses Sun selected, show color options

**Data Structure:**
```json
{
  "treatment_ids": [1, 2, 3],  // Array of treatment IDs
  "photochromic_color_id": 5,  // If photochromic selected
  "prescription_sun_color_id": 8  // If prescription sun selected
}
```

**API Endpoints Used:**
```
GET /api/lens/treatments              // Get all treatments
GET /api/lens/options?type=photochromic  // Get photochromic colors
```

**Color Selection Flow:**
- When user selects a color, it should be applied to the product image preview
- Color data includes `imageUrl` which can be used for visual preview

---

### Step 6: Add to Cart

**User Action:** User clicks "Add to Cart" or "Continue"

**API Endpoint:**
```
POST /api/cart/items
```

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 1,
  "lens_type": "progressive",
  "prescription_data": {
    "pd": 64,
    "pd_right": 32,
    "h": 18,
    "od": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    },
    "os": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    },
    "year_of_birth": 1980
  },
  "progressive_variant_id": 1,
  "lens_thickness_material_id": 2,
  "lens_thickness_option_id": 3,
  "treatment_ids": [1, 2],
  "photochromic_color_id": 5,
  "prescription_sun_color_id": null
}
```

**Backend Processing:**
1. **Validate Product:** Check if product exists and is in stock
2. **Calculate Price:**
   - Base product price: €500.00
   - Progressive variant: +€52.95
   - Lens thickness material: +€60.00
   - Treatments: +€30.00 + €30.00 = €60.00
   - Photochromic color: +€0.00 (if price adjustment exists)
   - **Total Unit Price:** €672.95
3. **Store Configuration:**
   - Save all configuration data to `cart_items` table
   - Store `prescription_data` as JSON string
   - Store `treatment_ids` as JSON array
   - Link foreign keys to related tables

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "item": {
      "id": 123,
      "product_id": 1,
      "quantity": 1,
      "unit_price": 672.95,
      "lens_type": "progressive",
      "prescription_data": {
        "pd": 64,
        "od": {...},
        "os": {...}
      },
      "progressive_variant_id": 1,
      "lens_thickness_material_id": 2,
      "lens_thickness_option_id": 3,
      "treatment_ids": [1, 2],
      "photochromic_color_id": 5
    }
  }
}
```

---

## 🔧 Admin Management Flow

### Managing Lens Thickness Materials

**Create Material:**
```
POST /api/admin/lens-thickness-materials
```
**Request:**
```json
{
  "name": "Unbreakable (Plastic)",
  "slug": "unbreakable-plastic",
  "description": "Durable plastic material",
  "price": 30.00,
  "is_active": true,
  "sort_order": 1
}
```

**Update Material:**
```
PUT /api/admin/lens-thickness-materials/:id
```

**Get All Materials:**
```
GET /api/admin/lens-thickness-materials
```

**Delete Material:**
```
DELETE /api/admin/lens-thickness-materials/:id
```

---

### Managing Lens Thickness Options

**Create Option:**
```
POST /api/admin/lens-thickness-options
```
**Request:**
```json
{
  "name": "Thin",
  "slug": "thin",
  "description": "Thin lens option",
  "thickness_value": 1.5,
  "is_active": true,
  "sort_order": 1
}
```

**Update Option:**
```
PUT /api/admin/lens-thickness-options/:id
```

**Get All Options:**
```
GET /api/admin/lens-thickness-options
```

**Delete Option:**
```
DELETE /api/admin/lens-thickness-options/:id
```

---

### Managing Treatments

**Create Treatment:**
```
POST /api/admin/lens-treatments
```
**Request:**
```json
{
  "name": "Scratch Proof",
  "slug": "scratch-proof",
  "type": "scratch_proof",
  "description": "Protects lenses from scratches",
  "price": 30.00,
  "icon": "icon-url",
  "is_active": true,
  "sort_order": 1
}
```

**Available Treatment Types:**
- `scratch_proof`
- `anti_glare`
- `blue_light_anti_glare`
- `uv_protection`
- `photochromic`
- `polarized`
- `anti_reflective`

---

### Managing Progressive Lens Variants

**Create Variant:**
```
POST /api/admin/prescription-lens-variants
```
**Request:**
```json
{
  "prescription_lens_type_id": 3,  // Progressive lens type ID
  "name": "Premium",
  "slug": "premium",
  "description": "Up to 40% wider viewing areas",
  "price": 52.95,
  "is_recommended": true,
  "viewing_range": "Wide",
  "use_cases": "Maximum comfort & balanced vision",
  "is_active": true,
  "sort_order": 1
}
```

---

### Managing Colors

#### Photochromic Colors
**Create Color:**
```
POST /api/admin/lens-colors
```
**Request:**
```json
{
  "lens_option_id": 5,  // Photochromic lens option ID
  "name": "Gray",
  "color_code": "GRAY",
  "hex_code": "#808080",
  "image_url": "https://...",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

#### Prescription Lenses Sun Colors
**Create Color:**
```
POST /api/admin/lens-colors
```
**Request:**
```json
{
  "prescription_lens_type_id": 4,  // Prescription Lenses Sun type ID
  "name": "Dark Brown",
  "color_code": "DARK_BROWN",
  "hex_code": "#654321",
  "image_url": "https://...",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Product   │
│  Selection  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Get Configuration   │
│ /products/:id/      │
│ /configuration      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Select Lens Type    │
│ - Distance Vision   │
│ - Near Vision       │
│ - Progressive       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Enter Prescription  │
│ (PD, OD, OS)        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Select Thickness    │
│ - Material          │
│ - Option            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Select Treatments   │
│ - Multiple options  │
│ - Colors (if any)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Add to Cart        │
│  POST /cart/items   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Calculate Price    │
│  Store Config       │
│  Return Cart Item   │
└─────────────────────┘
```

---

## 💾 Database Storage

### Cart Items Table Structure
```sql
cart_items
├── id
├── cart_id
├── product_id
├── quantity
├── unit_price (calculated total)
├── lens_type (distance_vision | near_vision | progressive)
├── prescription_data (JSON)
├── progressive_variant_id (FK)
├── lens_thickness_material_id (FK)
├── lens_thickness_option_id (FK)
├── treatment_ids (JSON array)
├── photochromic_color_id (FK)
├── prescription_sun_color_id (FK)
└── ... (other fields)
```

### Price Calculation Logic
```javascript
let totalPrice = product.price;

// Add progressive variant price
if (progressive_variant_id) {
  totalPrice += variant.price;
}

// Add thickness material price
if (lens_thickness_material_id) {
  totalPrice += material.price;
}

// Add treatment prices
if (treatment_ids) {
  treatments.forEach(t => totalPrice += t.price);
}

// Add color price adjustments
if (photochromic_color_id) {
  totalPrice += color.price_adjustment;
}

if (prescription_sun_color_id) {
  totalPrice += color.price_adjustment;
}
```

---

## 🔍 Retrieving Cart Items

**Get Cart:**
```
GET /api/cart
```

**Response includes:**
- All cart items with full configuration
- Parsed JSON fields (prescription_data, treatment_ids)
- Related data (progressive variant, materials, colors)
- Calculated subtotal

---

## 🎨 Frontend Integration Tips

1. **Color Preview:**
   - Use `imageUrl` from color objects to show preview
   - Apply color overlay on product image when selected

2. **Price Calculation:**
   - Calculate price in real-time as user selects options
   - Show breakdown of add-ons

3. **Form Validation:**
   - Validate prescription values (SPH: -20 to +20, CYL: -6 to +6, AXIS: 0-180)
   - Validate PD (typically 50-80mm)

4. **Progressive Variant Selection:**
   - Highlight "Recommended" variants
   - Show viewing range and use cases

5. **Treatment Selection:**
   - Allow multiple selections
   - Show icons for visual clarity
   - Display price for each treatment

---

## 📝 Example Complete Request

```json
{
  "product_id": 89,
  "quantity": 1,
  "lens_type": "progressive",
  "prescription_data": {
    "pd": 64,
    "pd_right": 32,
    "h": 18,
    "od": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    },
    "os": {
      "sph": -2.0,
      "cyl": -0.5,
      "axis": 90
    },
    "year_of_birth": 1980
  },
  "progressive_variant_id": 1,
  "lens_thickness_material_id": 2,
  "lens_thickness_option_id": 3,
  "treatment_ids": [1, 2, 3],
  "photochromic_color_id": 5,
  "prescription_sun_color_id": null
}
```

This completes the full lens configuration flow from product selection to cart!

