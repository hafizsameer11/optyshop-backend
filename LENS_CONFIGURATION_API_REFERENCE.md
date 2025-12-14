# Lens Configuration API Reference

## Quick Reference Guide

### Public Endpoints

#### Get Product Configuration
```
GET /api/products/:id/configuration
```
Returns all available lens configuration options for a product.

#### Get All Lens Types
```
GET /api/products/configuration/lens-types
```
Returns all prescription lens types (Distance Vision, Near Vision, Progressive).

#### Get Lens Thickness Materials
```
GET /api/lens/thickness-materials
```
Returns all active lens thickness materials (Unbreakable, Minerals).

#### Get Lens Thickness Options
```
GET /api/lens/thickness-options
```
Returns all active lens thickness dropdown options.

#### Get Lens Treatments
```
GET /api/lens/treatments
```
Returns all active lens treatments.

#### Get Prescription Lens Types
```
GET /api/lens/prescription-lens-types
```
Returns all prescription lens types with variants and colors.

---

### Cart Endpoints

#### Add Item to Cart (with Full Configuration)
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
    "od": {"sph": -2.0, "cyl": -0.5, "axis": 90},
    "os": {"sph": -2.0, "cyl": -0.5, "axis": 90}
  },
  "progressive_variant_id": 1,
  "lens_thickness_material_id": 2,
  "lens_thickness_option_id": 3,
  "treatment_ids": [1, 2],
  "photochromic_color_id": 5,
  "prescription_sun_color_id": null
}
```

#### Get Cart
```
GET /api/cart
```
Returns cart with all items and their configurations.

---

### Admin Endpoints

#### Lens Thickness Materials

**Get All:**
```
GET /api/admin/lens-thickness-materials
```

**Create:**
```
POST /api/admin/lens-thickness-materials
Body: {
  "name": "Unbreakable (Plastic)",
  "price": 30.00,
  "is_active": true
}
```

**Update:**
```
PUT /api/admin/lens-thickness-materials/:id
```

**Delete:**
```
DELETE /api/admin/lens-thickness-materials/:id
```

#### Lens Thickness Options

**Get All:**
```
GET /api/admin/lens-thickness-options
```

**Create:**
```
POST /api/admin/lens-thickness-options
Body: {
  "name": "Thin",
  "thickness_value": 1.5,
  "is_active": true
}
```

**Update:**
```
PUT /api/admin/lens-thickness-options/:id
```

**Delete:**
```
DELETE /api/admin/lens-thickness-options/:id
```

#### Lens Treatments

**Get All:**
```
GET /api/admin/lens-treatments
```

**Create:**
```
POST /api/admin/lens-treatments
Body: {
  "name": "Scratch Proof",
  "type": "scratch_proof",
  "price": 30.00,
  "icon": "icon-url"
}
```

**Update:**
```
PUT /api/admin/lens-treatments/:id
```

**Delete:**
```
DELETE /api/admin/lens-treatments/:id
```

#### Prescription Lens Variants

**Get All:**
```
GET /api/admin/prescription-lens-variants
```

**Create:**
```
POST /api/admin/prescription-lens-variants
Body: {
  "prescription_lens_type_id": 3,
  "name": "Premium",
  "price": 52.95,
  "is_recommended": true
}
```

**Update:**
```
PUT /api/admin/prescription-lens-variants/:id
```

**Delete:**
```
DELETE /api/admin/prescription-lens-variants/:id
```

#### Lens Colors

**Get All:**
```
GET /api/admin/lens-colors
```

**Create (Photochromic):**
```
POST /api/admin/lens-colors
Body: {
  "lens_option_id": 5,
  "name": "Gray",
  "color_code": "GRAY",
  "hex_code": "#808080",
  "image_url": "https://..."
}
```

**Create (Prescription Sun):**
```
POST /api/admin/lens-colors
Body: {
  "prescription_lens_type_id": 4,
  "name": "Dark Brown",
  "color_code": "DARK_BROWN",
  "hex_code": "#654321",
  "image_url": "https://..."
}
```

**Update:**
```
PUT /api/admin/lens-colors/:id
```

**Delete:**
```
DELETE /api/admin/lens-colors/:id
```

---

## Data Models

### Prescription Data Structure
```json
{
  "pd": 64,                    // Pupillary Distance (mm)
  "pd_right": 32,              // Right PD (optional, for progressive)
  "pd_near": 60,              // Near PD (optional)
  "h": 18,                     // Height (for progressive)
  "od": {                      // Right Eye
    "sph": -2.0,              // Sphere
    "cyl": -0.5,              // Cylinder
    "axis": 90                // Axis (0-180)
  },
  "os": {                      // Left Eye
    "sph": -2.0,
    "cyl": -0.5,
    "axis": 90
  },
  "year_of_birth": 1980        // For progressive
}
```

### Lens Type Values
- `"distance_vision"` - Distance Vision
- `"near_vision"` - Near Vision
- `"progressive"` - Progressive

### Treatment Types
- `"scratch_proof"`
- `"anti_glare"`
- `"blue_light_anti_glare"`
- `"uv_protection"`
- `"photochromic"`
- `"polarized"`
- `"anti_reflective"`

---

## Price Calculation Example

**Base Product:** €500.00
**Progressive Variant (Premium):** +€52.95
**Lens Thickness (Minerals):** +€60.00
**Treatments (Scratch Proof + Anti Glare):** +€60.00
**Photochromic Color:** +€0.00

**Total Unit Price:** €672.95

---

## Error Responses

All endpoints return standard error format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

