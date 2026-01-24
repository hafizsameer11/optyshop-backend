# Product Fields Documentation

This document provides a comprehensive overview of all product-related fields used in the OPTshop backend system.

## Table of Contents
1. [Core Product Fields](#core-product-fields)
2. [Product Categories & Types](#product-categories--types)
3. [Frame-Specific Fields](#frame-specific-fields)
4. [Contact Lens Specific Fields](#contact-lens-specific-fields)
5. [Pricing & Inventory Fields](#pricing--inventory-fields)
6. [Media & Visual Fields](#media--visual-fields)
7. [SEO & Metadata Fields](#seo--metadata-fields)
8. [Analytics & Engagement Fields](#analytics--engagement-fields)
9. [Related Product Tables](#related-product-tables)
10. [Enum Definitions](#enum-definitions)
11. [API Endpoints](#api-endpoints)

---

## Core Product Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | Primary Key, Auto Increment | Unique product identifier |
| `name` | VARCHAR(255) | NOT NULL | Product display name |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly identifier |
| `sku` | VARCHAR(100) | NOT NULL, UNIQUE | Stock Keeping Unit |
| `description` | TEXT | Nullable | Full product description |
| `short_description` | VARCHAR(500) | Nullable | Brief product summary |
| `category_id` | INTEGER | NOT NULL, FK to categories | Primary category |
| `sub_category_id` | INTEGER | Nullable, FK to subcategories | Sub-category classification |
| `product_type` | ENUM | default: 'frame' | Product type classification |

---

## Product Categories & Types

### Product Types (ProductType Enum)
- `frame` - Eyeglass frames
- `sunglasses` - Sunglasses
- `contact_lens` - Contact lenses
- `eye_hygiene` - Eye hygiene products
- `accessory` - Accessories

### Category Relations
- Each product belongs to one main category
- Optional sub-category for more specific classification
- Categories support hierarchical structure

---

## Frame-Specific Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `frame_shape` | VARCHAR(255) | Nullable | Shape of the frame |
| `frame_material` | VARCHAR(255) | Nullable | Material composition |
| `frame_color` | VARCHAR(100) | Nullable | Frame color |
| `gender` | ENUM | default: 'unisex' | Target gender |
| `lens_type` | VARCHAR(255) | Nullable | Type of lens |
| `lens_index_options` | LONGTEXT | Nullable | Available lens indices |
| `treatment_options` | LONGTEXT | Nullable | Lens treatment options |
| `model_3d_url` | VARCHAR(500) | Nullable | 3D model URL |
| `try_on_image` | VARCHAR(500) | Nullable | Virtual try-on image |

### Frame Shape Options
- round
- square
- oval
- cat-eye
- aviator
- rectangle
- wayfarer
- geometric

### Frame Material Options
- acetate
- metal
- tr90
- titanium
- wood
- mixed

### Gender Options
- men
- women
- unisex
- kids

---

## Contact Lens Specific Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `base_curve_options` | LONGTEXT | Nullable | Available base curves |
| `can_sleep_with` | BOOLEAN | default: false | Can be worn while sleeping |
| `contact_lens_brand` | VARCHAR(100) | Nullable | Brand name |
| `contact_lens_color` | VARCHAR(100) | Nullable | Lens color |
| `contact_lens_material` | VARCHAR(100) | Nullable | Lens material |
| `contact_lens_type` | VARCHAR(50) | Nullable | Lens type |
| `diameter_options` | LONGTEXT | Nullable | Available diameters |
| `has_uv_filter` | BOOLEAN | default: false | UV protection |
| `is_medical_device` | BOOLEAN | default: true | Medical device classification |
| `powers_range` | TEXT | Nullable | Available power ranges |
| `replacement_frequency` | VARCHAR(50) | Nullable | Replacement schedule |
| `water_content` | VARCHAR(50) | Nullable | Water content percentage |
| `expiry_date` | DATETIME | Nullable | Expiration date |
| `pack_type` | VARCHAR(50) | Nullable | Packaging type |
| `size_volume` | VARCHAR(50) | Nullable | Size/volume specification |

---

## Pricing & Inventory Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `price` | DECIMAL(10,2) | default: 0.00 | Current selling price |
| `compare_at_price` | DECIMAL(10,2) | Nullable | Original price for comparison |
| `cost_price` | DECIMAL(10,2) | Nullable | Wholesale cost |
| `stock_quantity` | INTEGER | default: 0 | Available stock |
| `stock_status` | ENUM | default: 'in_stock' | Stock availability |

### Stock Status Options
- `in_stock` - Available for purchase
- `out_of_stock` - Currently unavailable
- `backorder` - Can be ordered but out of stock

---

## Media & Visual Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `images` | LONGTEXT | Nullable | Product images (JSON array) |
| `color_images` | LONGTEXT | Nullable | Color variant images |
| `try_on_image` | VARCHAR(500) | Nullable | Virtual try-on image URL |
| `model_3d_url` | VARCHAR(500) | Nullable | 3D model URL |

---

## SEO & Metadata Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `meta_title` | VARCHAR(255) | Nullable | SEO title |
| `meta_description` | TEXT | Nullable | SEO description |
| `meta_keywords` | VARCHAR(255) | Nullable | SEO keywords |

---

## Analytics & Engagement Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `rating` | DECIMAL(3,2) | default: 0.00 | Average customer rating |
| `review_count` | INTEGER | default: 0 | Number of reviews |
| `view_count` | INTEGER | default: 0 | Page view counter |
| `is_featured` | BOOLEAN | default: false | Featured product flag |
| `is_active` | BOOLEAN | default: true | Product visibility |

---

## Related Product Tables

### Frame Sizes (FrameSize)
| Field | Type | Description |
|-------|------|-------------|
| `lens_width` | DECIMAL(5,2) | Width of the lens |
| `bridge_width` | DECIMAL(5,2) | Bridge width |
| `temple_length` | DECIMAL(5,2) | Temple arm length |
| `frame_width` | DECIMAL(5,2) | Total frame width |
| `frame_height` | DECIMAL(5,2) | Frame height |
| `size_label` | VARCHAR(50) | Size label (S/M/L) |

### Product Variants (ProductVariant)
| Field | Type | Description |
|-------|------|-------------|
| `sku` | VARCHAR(100) | Variant SKU |
| `size_label` | VARCHAR(50) | Size label |
| `color` | VARCHAR(100) | Color variant |
| `material` | VARCHAR(100) | Material variant |
| `stock_quantity` | INTEGER | Variant stock |
| `price` | DECIMAL(10,2) | Variant price |
| `images` | LONGTEXT | Variant images |

### Size/Volume Variants (ProductSizeVolume)
| Field | Type | Description |
|-------|------|-------------|
| `size_volume` | VARCHAR(50) | Size/volume specification |
| `pack_type` | VARCHAR(50) | Packaging type |
| `price` | DECIMAL(10,2) | Variant price |
| `stock_quantity` | INTEGER | Variant stock |
| `expiry_date` | DATETIME | Expiration date |

### Lens Types & Coatings
- **ProductLensType** - Available lens types for product
- **ProductLensCoating** - Available lens coatings
- **LensType** - Master lens types table
- **LensCoating** - Master lens coatings table

---

## Prescription & Vision Fields

### Prescription Table
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | Primary Key, Auto Increment | Unique prescription identifier |
| `user_id` | INTEGER | NOT NULL, FK to users | User who owns prescription |
| `prescription_type` | ENUM | default: 'single_vision' | Type of prescription |
| `od_sphere` | DECIMAL(5,2) | Nullable | Right eye sphere power |
| `od_cylinder` | DECIMAL(5,2) | Nullable | Right eye cylinder power |
| `od_axis` | INTEGER | Nullable | Right eye axis (0-180) |
| `od_add` | DECIMAL(5,2) | Nullable | Right eye addition power |
| `os_sphere` | DECIMAL(5,2) | Nullable | Left eye sphere power |
| `os_cylinder` | DECIMAL(5,2) | Nullable | Left eye cylinder power |
| `os_axis` | INTEGER | Nullable | Left eye axis (0-180) |
| `os_add` | DECIMAL(5,2) | Nullable | Left eye addition power |
| `pd_binocular` | DECIMAL(5,2) | Nullable | Binocular pupillary distance |
| `pd_monocular_od` | DECIMAL(5,2) | Nullable | Right eye monocular PD |
| `pd_monocular_os` | DECIMAL(5,2) | Nullable | Left eye monocular PD |
| `pd_near` | DECIMAL(5,2) | Nullable | Near vision PD |
| `ph_od` | DECIMAL(5,2) | Nullable | Right eye prism height |
| `ph_os` | DECIMAL(5,2) | Nullable | Left eye prism height |
| `doctor_name` | VARCHAR(255) | Nullable | Prescribing doctor name |
| `doctor_license` | VARCHAR(100) | Nullable | Doctor license number |
| `prescription_date` | DATETIME | Nullable | Date prescription was written |
| `expiry_date` | DATETIME | Nullable | Prescription expiration date |
| `notes` | TEXT | Nullable | Additional notes |
| `is_active` | BOOLEAN | default: true | Prescription is currently valid |
| `is_verified` | BOOLEAN | default: false | Prescription has been verified |

### Spherical Configuration
| Field | Type | Description |
|-------|------|-------------|
| `name` | VARCHAR(255) | Configuration name |
| `display_name` | VARCHAR(255) | Display name for UI |
| `sub_category_id` | INTEGER | Sub-category reference |
| `category_id` | INTEGER | Category reference |
| `price` | DECIMAL(10,2) | Configuration price |
| `right_qty` | LONGTEXT | Right eye quantity options |
| `right_base_curve` | LONGTEXT | Right eye base curve options |
| `right_diameter` | LONGTEXT | Right eye diameter options |
| `right_power` | LONGTEXT | Right eye power options |
| `left_qty` | LONGTEXT | Left eye quantity options |
| `left_base_curve` | LONGTEXT | Left eye base curve options |
| `left_diameter` | LONGTEXT | Left eye diameter options |
| `left_power` | LONGTEXT | Left eye power options |

### Astigmatism Configuration
| Field | Type | Description |
|-------|------|-------------|
| `name` | VARCHAR(255) | Configuration name |
| `display_name` | VARCHAR(255) | Display name for UI |
| `sub_category_id` | INTEGER | Sub-category reference |
| `category_id` | INTEGER | Category reference |
| `price` | DECIMAL(10,2) | Configuration price |
| `right_qty` | LONGTEXT | Right eye quantity options |
| `right_base_curve` | LONGTEXT | Right eye base curve options |
| `right_diameter` | LONGTEXT | Right eye diameter options |
| `right_power` | LONGTEXT | Right eye power options |
| `right_cylinder` | LONGTEXT | Right eye cylinder options |
| `right_axis` | LONGTEXT | Right eye axis options |
| `left_qty` | LONGTEXT | Left eye quantity options |
| `left_base_curve` | LONGTEXT | Left eye base curve options |
| `left_diameter` | LONGTEXT | Left eye diameter options |
| `left_power` | LONGTEXT | Left eye power options |
| `left_cylinder` | LONGTEXT | Left eye cylinder options |
| `left_axis` | LONGTEXT | Left eye axis options |

### Contact Lens Configuration
| Field | Type | Description |
|-------|------|-------------|
| `configuration_type` | ENUM | spherical or astigmatism |
| `lens_type` | VARCHAR(255) | Type of contact lens |
| `right_qty` | LONGTEXT | Right eye quantity options |
| `right_base_curve` | LONGTEXT | Right eye base curve options |
| `right_diameter` | LONGTEXT | Right eye diameter options |
| `right_power` | LONGTEXT | Right eye power options |
| `right_cylinder` | LONGTEXT | Right eye cylinder options |
| `right_axis` | LONGTEXT | Right eye axis options |
| `left_qty` | LONGTEXT | Left eye quantity options |
| `left_base_curve` | LONGTEXT | Left eye base curve options |
| `left_diameter` | LONGTEXT | Left eye diameter options |
| `left_power` | LONGTEXT | Left eye power options |
| `left_cylinder` | LONGTEXT | Left eye cylinder options |
| `left_axis` | LONGTEXT | Left eye axis options |
| `display_name` | VARCHAR(255) | Display name for UI |
| `color_images` | LONGTEXT | Color variant images |
| `description` | TEXT | Configuration description |
| `images` | LONGTEXT | Configuration images |

### Prescription Lens Types
| Field | Type | Description |
|-------|------|-------------|
| `name` | VARCHAR(100) | Lens type name |
| `slug` | VARCHAR(100) | URL-friendly identifier |
| `description` | TEXT | Lens type description |
| `prescription_type` | ENUM | Associated prescription type |
| `base_price` | DECIMAL(10,2) | Base price for lens type |
| `variants` | RELATION | Available variants |

### Prescription Lens Variants
| Field | Type | Description |
|-------|------|-------------|
| `name` | VARCHAR(100) | Variant name |
| `slug` | VARCHAR(100) | URL-friendly identifier |
| `description` | TEXT | Variant description |
| `price` | DECIMAL(10,2) | Variant price |
| `is_recommended` | BOOLEAN | Recommended variant flag |
| `viewing_range` | VARCHAR(100) | Optimal viewing range |
| `use_cases` | TEXT | Recommended use cases |

### Dropdown Values for Forms
| Field | Type | Description |
|-------|------|-------------|
| `field_type` | ENUM | Type of form field |
| `value` | VARCHAR(50) | Dropdown value |
| `display_order` | INTEGER | Display order in dropdown |
| `is_active` | BOOLEAN | Value is active |

---

## Lens Thickness & Material Fields

### Lens Thickness Material
| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary Key, Auto Increment |
| `name` | VARCHAR(100) | Material name (unique) |
| `slug` | VARCHAR(100) | URL-friendly identifier (unique) |
| `description` | TEXT | Material description |
| `price` | DECIMAL(10,2) | Material price adjustment |
| `is_active` | BOOLEAN | Material is available |
| `sort_order` | INTEGER | Display order |

### Lens Thickness Option
| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary Key, Auto Increment |
| `name` | VARCHAR(100) | Option name (unique) |
| `slug` | VARCHAR(100) | URL-friendly identifier (unique) |
| `description` | TEXT | Option description |
| `thickness_value` | DECIMAL(5,2) | Actual thickness measurement |
| `is_active` | BOOLEAN | Option is available |
| `sort_order` | INTEGER | Display order |

### Lens Type Thickness Factor
| Field | Type | Description |
|-------|------|-------------|
| `thickness_factor` | DECIMAL(5,2) | Thickness multiplier for pricing |
| `index` | DECIMAL(3,2) | Lens refractive index |

---

## Prescription Sunglasses & Photochromic Fields

### Cart Item Prescription Sunglass Fields
| Field | Type | Description |
|-------|------|-------------|
| `photochromic_color_id` | INTEGER | FK to lens_colors (photochromic) |
| `prescription_sun_color_id` | INTEGER | FK to lens_colors (prescription sun) |
| `lens_thickness_material_id` | INTEGER | FK to lens_thickness_materials |
| `lens_thickness_option_id` | INTEGER | FK to lens_thickness_options |
| `lens_type` | VARCHAR(50) | Lens type specification |
| `prescription_data` | LONGTEXT | Complete prescription data |
| `progressive_variant_id` | INTEGER | FK to prescription_lens_variants |
| `treatment_ids` | LONGTEXT | Lens treatment IDs (JSON) |

### Order Item Prescription Sunglass Fields
| Field | Type | Description |
|-------|------|-------------|
| `photochromic_color_id` | INTEGER | FK to lens_colors (photochromic) |
| `prescription_sun_color_id` | INTEGER | FK to lens_colors (prescription sun) |
| `lens_thickness_material_id` | INTEGER | FK to lens_thickness_materials |
| `lens_thickness_option_id` | INTEGER | FK to lens_thickness_options |
| `lens_type` | VARCHAR(50) | Lens type specification |
| `prescription_data` | LONGTEXT | Complete prescription data |
| `progressive_variant_id` | INTEGER | FK to prescription_lens_variants |
| `treatment_ids` | LONGTEXT | Lens treatment IDs (JSON) |

### Lens Color Relations
- **PhotochromicColor** - Color-changing lens options
- **PrescriptionSunColor** - Prescription sunglass lens colors
- **LensColor** - Master lens colors table with multiple relation types

---

## Eye Hygiene Product Fields

### Eye Hygiene Specific Fields
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `size_volume` | VARCHAR(50) | Nullable | Product volume (e.g., "5ml", "10ml", "30ml") |
| `pack_type` | VARCHAR(50) | Nullable | Packaging type (e.g., "Single", "Pack of 2") |
| `expiry_date` | DATETIME | Nullable | Product expiration date |

### Eye Hygiene Product Detection
System automatically detects eye hygiene products by checking:
- Category name/slug contains "eye hygiene" (case-insensitive)
- Subcategory name/slug contains "eye hygiene" (case-insensitive)

### Eye Hygiene Product Examples
```javascript
{
  name: "Lubricating Eye Drops",
  slug: "lubricating-eye-drops",
  sku: "EH-DROP-001",
  category_id: 4, // Eye hygiene category
  product_type: "eye_hygiene",
  price: 14.99,
  size_volume: "10ml",
  pack_type: "Pack of 2",
  expiry_date: "2025-12-31T00:00:00.000Z",
  stock_quantity: 100,
  description: "Long-lasting lubricating eye drops for dry eye relief"
}
```

### Common Eye Hygiene Product Types
- Eye drops (lubricating, medicated, allergy)
- Eye wash solutions
- Eye wipes and cleaning products
- Eye vitamins and supplements
- Contact lens solutions
- Eye masks and compresses

---

## Enum Definitions

### ProductType
```sql
enum ProductType {
  frame
  sunglasses
  contact_lens
  eye_hygiene
  accessory
}
```

### PrescriptionType
```sql
enum PrescriptionType {
  single_vision
  bifocal
  trifocal
  progressive
}
```

### StockStatus
```sql
enum StockStatus {
  in_stock
  out_of_stock
  backorder
}
```

### Gender
```sql
enum Gender {
  men
  women
  unisex
  kids
}
```

### CoatingType
```sql
enum CoatingType {
  ar
  blue_light
  uv
  scratch_resistant
  anti_fog
  mirror
  polarized
}
```

### ContactLensConfigType
```sql
enum ContactLensConfigType {
  spherical
  astigmatism
}
```

### AstigmatismFieldType
```sql
enum AstigmatismFieldType {
  qty
  base_curve
  diameter
  power
  cylinder
  axis
}
```

### AstigmatismEyeType
```sql
enum AstigmatismEyeType {
  left
  right
  both
}
```

### PrescriptionFormFieldType
```sql
enum PrescriptionFormFieldType {
  pd
  sph
  cyl
  axis
  h
  year_of_birth
  select_option
}
```

### LensTreatmentType
```sql
enum LensTreatmentType {
  anti_glare
  blue_light_anti_glare
  uv_protection
  photochromic
  polarized
  anti_reflective
}
```

### LensFinishType
```sql
enum LensFinishType {
  mirror
  gradient
  polarized
  photochromic
  transitions
  eyeqlenz
  standard
  blokz_photochromic
}
```

### LensOptionType
```sql
enum LensOptionType {
  color
  finish
  treatment
}
```

---

## API Endpoints

### Product Routes
- `GET /api/products` - List products with filtering
- `GET /api/products/:id` - Get single product
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id/related` - Get related products
- `GET /api/products/options` - Get form options
- `GET /api/products/configuration/lens-types` - Get lens types

### Section-Specific Endpoints
- `GET /api/products/section/sunglasses` - Sunglasses products
- `GET /api/products/section/eyeglasses` - Eyeglasses products
- `GET /api/products/section/contact-lenses` - Contact lenses
- `GET /api/products/section/eye-hygiene` - Eye hygiene products

### Product Configuration
- `GET /api/products/:id/configuration` - Product configuration options

---

## Validation Rules

### Required Fields for Product Creation
- `name` (3-255 characters)
- `sku` (3-100 characters, unique)
- `category_id` (valid integer)
- `price` (positive number)

### Optional Fields with Validation
- `slug` - Must be valid slug format
- `gender` - Must be one of defined gender options
- `frame_shape` - Must be one of defined shapes
- `frame_material` - Must be one of defined materials

### Query Parameters for Filtering
- `page` - Positive integer (default: 1)
- `limit` - 1-1000 (default: 12)
- `frameShape` - Filter by frame shape
- `frameMaterial` - Filter by frame material
- `minPrice` / `maxPrice` - Price range filter
- `category_id` - Category filter
- `sub_category_id` - Sub-category filter

---

## Database Indexes

### Performance Indexes
- `category_id` - Category filtering
- `sub_category_id` - Sub-category filtering
- `slug` - Slug lookups
- `sku` - SKU lookups
- `frame_shape` - Frame shape filtering
- `frame_material` - Material filtering
- `is_active, is_featured` - Featured/active filtering
- `category_id, is_active` - Category with active status
- `sub_category_id, is_active` - Sub-category with active status

---

## Usage Examples

### Creating a Frame Product
```javascript
{
  name: "Classic Aviator Sunglasses",
  slug: "classic-aviator-sunglasses",
  sku: "AV-001-BLK",
  category_id: 2,
  price: 149.99,
  frame_shape: "aviator",
  frame_material: "metal",
  frame_color: "black",
  gender: "unisex",
  lens_type: "sunglasses",
  images: ["url1.jpg", "url2.jpg"]
}
```

### Creating a Contact Lens Product
```javascript
{
  name: "Daily Disposable Contact Lenses",
  slug: "daily-disposable-lenses",
  sku: "CL-DAY-001",
  category_id: 3,
  product_type: "contact_lens",
  price: 29.99,
  contact_lens_brand: "Acuvue",
  contact_lens_material: "Hydrogel",
  replacement_frequency: "daily",
  water_content: "58%",
  can_sleep_with: false,
  has_uv_filter: true
}
```

### Creating a Prescription Record
```javascript
{
  user_id: 123,
  prescription_type: "single_vision",
  od_sphere: -2.50,
  od_cylinder: -0.75,
  od_axis: 180,
  os_sphere: -2.25,
  os_cylinder: -0.50,
  os_axis: 175,
  pd_binocular: 64.0,
  doctor_name: "Dr. Smith",
  doctor_license: "MD12345",
  prescription_date: "2024-01-15",
  expiry_date: "2025-01-15"
}
```

### Creating a Spherical Configuration
```javascript
{
  name: "daily_spherical_config",
  display_name: "Daily Spherical Lenses",
  sub_category_id: 5,
  price: 29.99,
  right_qty: "30,60,90",
  right_base_curve: "8.4,8.5,8.6",
  right_diameter: "14.0,14.2",
  right_power: "-10.00 to +6.00",
  left_qty: "30,60,90",
  left_base_curve: "8.4,8.5,8.6",
  left_diameter: "14.0,14.2",
  left_power: "-10.00 to +6.00"
}
```

### Creating an Eye Hygiene Product
```javascript
{
  name: "Lubricating Eye Drops",
  slug: "lubricating-eye-drops",
  sku: "EH-DROP-001",
  category_id: 4,
  product_type: "eye_hygiene",
  price: 14.99,
  size_volume: "10ml",
  pack_type: "Pack of 2",
  expiry_date: "2025-12-31T00:00:00.000Z",
  stock_quantity: 100,
  description: "Long-lasting lubricating eye drops for dry eye relief"
}
```

### Creating a Prescription Sunglass Order
```javascript
{
  product_id: 123,
  quantity: 1,
  prescription_data: {
    od_sphere: -2.50,
    os_sphere: -2.25,
    pd_binocular: 64.0
  },
  lens_thickness_material_id: 1,
  lens_thickness_option_id: 2,
  prescription_sun_color_id: 5,
  photochromic_color_id: 3,
  treatment_ids: [1, 2, 3],
  lens_type: "photochromic"
}
```

---

## Notes

1. **JSON Fields**: Fields like `images`, `lens_index_options`, and `treatment_options` are stored as JSON strings in database
2. **Soft Deletes**: Products use `is_active` flag for soft deletion rather than hard deletes
3. **Hierarchical Categories**: Support for nested category structure through parent-child relationships
4. **Multi-Variant Support**: Products can have multiple variants for size, color, and material
5. **SEO Optimization**: Comprehensive SEO fields for search engine optimization
6. **Analytics Built-in**: Built-in tracking for views, ratings, and reviews
7. **Prescription Management**: Complete prescription data storage with verification and expiry tracking
8. **Vision Configuration**: Separate configurations for spherical and astigmatism contact lenses
9. **Eye-Specific Data**: All prescription data stored separately for left (OS) and right (OD) eyes
10. **Medical Compliance**: Doctor information and license tracking for prescription validity
11. **Lens Thickness System**: Comprehensive thickness material and option management for pricing
12. **Photochromic Support**: Full support for color-changing lenses with multiple color options
13. **Eye Hygiene Tracking**: Specialized fields for volume, packaging, and expiry of eye care products
14. **Treatment Integration**: Multiple lens treatments can be applied to single prescription orders

---

## Prescription Field Explanations

### OD vs OS Terminology
- **OD (Oculus Dexter)**: Right eye
- **OS (Oculus Sinister)**: Left eye

### Prescription Values
- **Sphere (SPH)**: Main lens power (- for nearsighted, + for farsighted)
- **Cylinder (CYL)**: Astigmatism correction power
- **Axis**: Orientation of astigmatism correction (0-180 degrees)
- **Addition (ADD)**: Additional power for bifocal/progressive lenses
- **PD (Pupillary Distance)**: Distance between pupils
- **Prism Height (PH)**: Prism correction measurement

### Contact Lens Specifications
- **Base Curve**: Curvature of the lens (typically 8.0-9.0)
- **Diameter**: Width of the lens (typically 13.0-15.0)
- **Water Content**: Percentage of water in lens material
- **Replacement Frequency**: How often lenses should be replaced

### Configuration Types
- **Spherical**: Lenses for correcting simple nearsightedness/farsightedness
- **Astigmatism (Toric)**: Lenses for correcting astigmatism with cylinder and axis

---

*Last Updated: January 18, 2026*
*Version: 1.0*
