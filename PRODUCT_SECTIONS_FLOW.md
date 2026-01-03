# Product Sections Implementation Flow

## Overview
This document describes the implementation of product sections in the OptyShop admin panel and website. The system now supports separate sections for:
- **Sunglasses** (`product_type: 'sunglasses'`)
- **Eyeglasses** (`product_type: 'frame'`)
- **Contact Lenses** (`product_type: 'contact_lens'`)
- **Eye Hygiene** (`product_type: 'eye_hygiene'`)

## Database Changes

### 1. Schema Update
- Added `eye_hygiene` to the `ProductType` enum in `prisma/schema.prisma`
- Updated enum values: `frame`, `sunglasses`, `contact_lens`, `eye_hygiene`, `accessory`

### 2. Migration
- Migration file: `prisma/migrations/20250104000000_add_eye_hygiene_product_type/migration.sql`
- Run migration: `npx prisma migrate dev`

## API Endpoints

### Website (Public) Endpoints

#### General Products Endpoint
```
GET /api/products?product_type=sunglasses
GET /api/products?product_type=frame
GET /api/products?product_type=contact_lens
GET /api/products?product_type=eye_hygiene
```

#### Section-Specific Endpoints
```
GET /api/products/section/sunglasses
GET /api/products/section/eyeglasses
GET /api/products/section/contact-lenses
GET /api/products/section/eye-hygiene
```

**Query Parameters (all endpoints support):**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)
- `category`: Filter by category slug
- `subCategory`: Filter by subcategory slug
- `frameShape`: Filter by frame shape
- `frameMaterial`: Filter by frame material
- `lensType`: Filter by lens type
- `gender`: Filter by gender
- `minPrice`, `maxPrice`: Price range filter
- `search`: Search in name, description, SKU
- `sortBy`: Sort field (default: created_at)
- `sortOrder`: Sort direction (asc/desc, default: desc)
- `isFeatured`: Filter featured products (true/false)

### Admin (Private) Endpoints

#### General Products Endpoint
```
GET /api/admin/products?product_type=sunglasses
GET /api/admin/products?product_type=frame
GET /api/admin/products?product_type=contact_lens
GET /api/admin/products?product_type=eye_hygiene
```

#### Section-Specific Endpoints
```
GET /api/admin/products/section/sunglasses
GET /api/admin/products/section/eyeglasses
GET /api/admin/products/section/contact-lenses
GET /api/admin/products/section/eye-hygiene
```

**Query Parameters (all endpoints support):**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `product_type`: Filter by product type (frame, sunglasses, contact_lens, eye_hygiene, accessory)
- `search`: Search in name, description, SKU
- `category_id`: Filter by category ID
- `sub_category_id`: Filter by subcategory ID
- `is_active`: Filter by active status (true/false)
- `sortBy`: Sort field (default: created_at)
- `sortOrder`: Sort direction (asc/desc, default: desc)

**Authentication Required:**
- Header: `Authorization: Bearer {{admin_token}}`

## Implementation Details

### Controllers

#### Admin Controller (`controllers/adminController.js`)
- `getAllProducts`: Updated to support `product_type` filter
- `getSunglassesProducts`: Section-specific endpoint for sunglasses
- `getEyeglassesProducts`: Section-specific endpoint for eyeglasses
- `getContactLensesProducts`: Section-specific endpoint for contact lenses
- `getEyeHygieneProducts`: Section-specific endpoint for eye hygiene

#### Product Controller (`controllers/productController.js`)
- `getProducts`: Updated to support `product_type` filter
- `getSunglassesProducts`: Section-specific endpoint for sunglasses
- `getEyeglassesProducts`: Section-specific endpoint for eyeglasses
- `getContactLensesProducts`: Section-specific endpoint for contact lenses
- `getEyeHygieneProducts`: Section-specific endpoint for eye hygiene

### Routes

#### Admin Routes (`routes/admin.js`)
```javascript
router.get('/products', getAllProducts);
router.get('/products/section/sunglasses', getSunglassesProducts);
router.get('/products/section/eyeglasses', getEyeglassesProducts);
router.get('/products/section/contact-lenses', getContactLensesProducts);
router.get('/products/section/eye-hygiene', getEyeHygieneProducts);
router.get('/products/:id', getProduct);
```

#### Website Routes (`routes/products.js`)
```javascript
router.get('/', validateProductQuery, getProducts);
router.get('/section/sunglasses', validateProductQuery, getSunglassesProducts);
router.get('/section/eyeglasses', validateProductQuery, getEyeglassesProducts);
router.get('/section/contact-lenses', validateProductQuery, getContactLensesProducts);
router.get('/section/eye-hygiene', validateProductQuery, getEyeHygieneProducts);
```

## Usage Flow

### Admin Panel Flow

1. **Access Section:**
   - Admin navigates to a specific section (e.g., "Sunglasses", "Eyeglasses", "Contact Lenses", "Eye Hygiene")
   - Frontend calls: `GET /api/admin/products/section/{section-name}`

2. **View Products:**
   - Products are automatically filtered by `product_type`
   - All standard filters (search, category, subcategory, active status) work

3. **Add Product:**
   - Admin clicks "Add Product" in the section
   - Product form includes `product_type` field (pre-filled based on section)
   - On submit: `POST /api/admin/products` with `product_type: 'sunglasses'` (or appropriate type)

4. **Edit Product:**
   - Admin can change `product_type` to move product between sections
   - Update: `PUT /api/admin/products/:id` with updated `product_type`

### Website Flow

1. **Browse Section:**
   - Customer navigates to a section (e.g., "Sunglasses", "Eyeglasses")
   - Frontend calls: `GET /api/products/section/{section-name}`

2. **Filter Products:**
   - All standard filters work (category, price, search, etc.)
   - Products are automatically filtered by section

3. **View Product:**
   - Standard product detail page
   - `GET /api/products/:id` or `GET /api/products/slug/:slug`

## Product Type Mapping

| Section Name | Product Type Value | Description |
|-------------|-------------------|-------------|
| Sunglasses | `sunglasses` | All sunglasses products |
| Eyeglasses | `frame` | All eyeglass frames |
| Contact Lenses | `contact_lens` | All contact lens products |
| Eye Hygiene | `eye_hygiene` | Eye hygiene products (solution, wipes, etc.) |
| Accessories | `accessory` | Other accessories |

## Creating Products by Section

### Sunglasses
```json
{
  "name": "Classic Aviator Sunglasses",
  "sku": "SUN-001",
  "product_type": "sunglasses",
  "category_id": 2,
  "price": 99.99
}
```

### Eyeglasses
```json
{
  "name": "Round Frame Glasses",
  "sku": "EYE-001",
  "product_type": "frame",
  "category_id": 1,
  "price": 149.99
}
```

### Contact Lenses
```json
{
  "name": "Daily Contact Lenses",
  "sku": "CL-001",
  "product_type": "contact_lens",
  "category_id": 3,
  "price": 79.99,
  "contact_lens_brand": "Alcon",
  "contact_lens_material": "Nelfilcon A"
}
```

### Eye Hygiene
```json
{
  "name": "Contact Lens Solution",
  "sku": "EH-001",
  "product_type": "eye_hygiene",
  "category_id": 4,
  "price": 12.99,
  "size_volume": "300ml",
  "pack_type": "Single"
}
```

## Postman Collection Updates

The Postman collection has been updated with:
- Website section-specific endpoints (4 new endpoints)
- Admin section-specific endpoints (4 new endpoints)
- Updated "Get All Products" endpoints with `product_type` parameter documentation

## Testing Checklist

- [ ] Run database migration
- [ ] Test admin section endpoints (all 4 sections)
- [ ] Test website section endpoints (all 4 sections)
- [ ] Test product creation with different product types
- [ ] Test product filtering by product_type
- [ ] Test product update (changing product_type)
- [ ] Verify Postman collection endpoints work

## Next Steps

1. **Run Migration:**
   ```bash
   npx prisma migrate dev
   ```

2. **Update Frontend:**
   - Create section navigation in admin panel
   - Create section pages in website
   - Update product forms to include product_type field

3. **Test Integration:**
   - Test all endpoints with Postman
   - Verify product filtering works correctly
   - Test product creation/update in each section

## Notes

- All existing products default to `product_type: 'frame'` if not specified
- Products can be moved between sections by updating `product_type`
- Section-specific endpoints are convenience wrappers around the main endpoints with `product_type` pre-filtered
- All standard product filters work with section-specific endpoints

