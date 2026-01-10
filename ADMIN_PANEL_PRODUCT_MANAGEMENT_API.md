# Admin Panel Product Management API Documentation

Complete backend API documentation for the Product Management section in the OptyShop Admin Panel.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Product CRUD Operations](#product-crud-operations)
4. [Size/Volume Variants Management](#sizevolume-variants-management)
5. [Images Management](#images-management)
6. [SEO Fields](#seo-fields)
7. [Request/Response Examples](#requestresponse-examples)
8. [Error Handling](#error-handling)

---

## Overview

The Product Management API supports creating, updating, and managing products with four main sections:

1. **General Tab**: Basic product information (name, slug, SKU, price, description, category, subcategory, product type, stock, etc.)
2. **Size/Volume Variants Tab**: Multiple size/volume options for Eye Hygiene products
3. **Images Tab**: Product images (general images without color codes) and color-coded images
4. **SEO Tab**: Meta title, meta description, meta keywords

**Base URL**: `/api/admin/products`

---

## Authentication

All admin endpoints require authentication with an admin or staff token.

**Header**: 
```
Authorization: Bearer {admin_token}
```

---

## Product CRUD Operations

### 1. Get All Products (Admin)

**Endpoint**: `GET /api/admin/products`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search by name, description, or SKU
- `category_id` (optional): Filter by category
- `sub_category_id` (optional): Filter by subcategory
- `product_type` (optional): Filter by product type (`frame`, `sunglasses`, `contact_lens`, `eye_hygiene`)
- `is_active` (optional): Filter by active status (`true`/`false`)
- `is_featured` (optional): Filter by featured status (`true`/`false`)

**Response**:
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Product Name",
        "slug": "product-slug",
        "sku": "SKU123",
        "price": 99.99,
        "images": ["url1", "url2"],
        "color_images": [...],
        "sizeVolumeVariants": [...],
        "meta_title": "SEO Title",
        "meta_description": "SEO Description",
        "meta_keywords": "keyword1, keyword2"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "pages": 2
    }
  }
}
```

### 2. Get Single Product (Admin)

**Endpoint**: `GET /api/admin/products/:id`

**Response**: Same structure as above but with a single product object.

### 3. Create Product

**Endpoint**: `POST /api/admin/products`

**Content-Type**: `multipart/form-data` (for file uploads) or `application/json`

**Body Fields (General Tab)**:
- `name` (required): Product name
- `slug` (optional): URL slug (auto-generated if not provided)
- `sku` (required): Stock Keeping Unit
- `description` (optional): Full product description
- `short_description` (optional): Brief description
- `category_id` (required): Category ID
- `sub_category_id` (optional): Subcategory ID
- `product_type` (optional): `frame`, `sunglasses`, `contact_lens`, `eye_hygiene` (default: `frame`)
- `price` (required): Base price
- `compare_at_price` (optional): Compare at price (for discounts)
- `cost_price` (optional): Wholesale cost
- `stock_quantity` (optional): Stock quantity (default: 0)
- `stock_status` (optional): `in_stock`, `out_of_stock`, `backorder` (default: `in_stock`)
- `is_active` (optional): `true`/`false` (default: `true`)
- `is_featured` (optional): `true`/`false` (default: `false`)

**Body Fields (Size/Volume Variants Tab)**:
- `sizeVolumeVariants` (optional): JSON array of variant objects:
```json
[
  {
    "size_volume": "5ml",
    "pack_type": "Single",
    "price": 8.00,
    "compare_at_price": 10.00,
    "cost_price": 5.00,
    "stock_quantity": 50,
    "stock_status": "in_stock",
    "sku": "SKU-5ML",
    "expiry_date": "2025-12-31",
    "is_active": true,
    "sort_order": 1
  }
]
```

**Body Fields (Images Tab)**:
- `images` (optional): Array of image URLs (JSON string) or files
- `general_images` (optional): Array of general image URLs (JSON string) or files (without color codes)
- For file uploads, use form field: `images` (multiple files supported, max 5)

**Body Fields (SEO Tab)**:
- `meta_title` (optional): SEO title
- `meta_description` (optional): SEO description
- `meta_keywords` (optional): Comma-separated keywords

**File Upload Fields**:
- `images`: Multiple product images (PNG, JPG, JPEG, WEBP, max 5MB each)
- `model_3d`: 3D model file (GLB, GLTF)

**Example Request (with file uploads)**:
```javascript
const formData = new FormData();
formData.append('name', 'Product Name');
formData.append('sku', 'SKU123');
formData.append('category_id', '1');
formData.append('price', '99.99');
formData.append('meta_title', 'SEO Title');
formData.append('meta_description', 'SEO Description');
formData.append('meta_keywords', 'keyword1, keyword2');
formData.append('sizeVolumeVariants', JSON.stringify([{...}]));
formData.append('images', file1);
formData.append('images', file2);
```

**Response**: Created product with all related data.

### 4. Update Product

**Endpoint**: `PUT /api/admin/products/:id`

**Content-Type**: `multipart/form-data` or `application/json`

**Body Fields**: Same as Create Product, all fields optional.

**Important Notes**:
- If `sizeVolumeVariants` is provided, it **replaces** all existing variants (variants not in the array will be deleted)
- If `images` is provided, it replaces existing images (images not in the array will be deleted from storage)
- To update only specific fields, only include those fields in the request

**Example Request**:
```javascript
const formData = new FormData();
formData.append('name', 'Updated Product Name');
formData.append('meta_title', 'Updated SEO Title');
formData.append('images', JSON.stringify(['existing-url1', 'existing-url2']));
```

**Response**: Updated product with all related data.

### 5. Delete Product

**Endpoint**: `DELETE /api/admin/products/:id`

**Response**:
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Size/Volume Variants Management

### 1. Get All Variants for a Product

**Endpoint**: `GET /api/admin/products/:productId/size-volume-variants`

**Response**:
```json
{
  "success": true,
  "message": "Size/volume variants retrieved successfully",
  "data": {
    "product_id": 1,
    "variants": [
      {
        "id": 1,
        "product_id": 1,
        "size_volume": "5ml",
        "pack_type": "Single",
        "price": 8.00,
        "compare_at_price": 10.00,
        "cost_price": 5.00,
        "stock_quantity": 50,
        "stock_status": "in_stock",
        "sku": "SKU-5ML",
        "expiry_date": "2025-12-31T00:00:00.000Z",
        "is_active": true,
        "sort_order": 1
      }
    ]
  }
}
```

### 2. Get Single Variant

**Endpoint**: `GET /api/admin/products/:productId/size-volume-variants/:variantId`

**Response**: Single variant object.

### 3. Create Variant

**Endpoint**: `POST /api/admin/products/:productId/size-volume-variants`

**Body** (JSON):
```json
{
  "size_volume": "5ml",
  "pack_type": "Single",
  "price": 8.00,
  "compare_at_price": 10.00,
  "cost_price": 5.00,
  "stock_quantity": 50,
  "stock_status": "in_stock",
  "sku": "SKU-5ML",
  "expiry_date": "2025-12-31",
  "is_active": true,
  "sort_order": 1
}
```

**Required Fields**: `size_volume`, `price`

**Response**: Created variant object.

### 4. Update Variant

**Endpoint**: `PUT /api/admin/products/:productId/size-volume-variants/:variantId`

**Body**: Same as Create, all fields optional.

**Response**: Updated variant object.

### 5. Delete Variant

**Endpoint**: `DELETE /api/admin/products/:productId/size-volume-variants/:variantId`

**Response**: Success message.

### 6. Bulk Update Variants

**Endpoint**: `PUT /api/admin/products/:productId/size-volume-variants/bulk`

**Body**:
```json
{
  "variants": [
    {
      "id": 1,
      "size_volume": "5ml",
      "price": 9.00
    },
    {
      "size_volume": "10ml",
      "price": 14.00
    }
  ]
}
```

**Note**: Variants with `id` will be updated, variants without `id` will be created, and variants not in the array will be deleted.

**Response**: All variants after update.

---

## Images Management

### Image Upload Guidelines

1. **General Product Images** (without color codes):
   - Field name: `images`
   - Supports multiple files (max 5)
   - Formats: PNG, JPG, JPEG, WEBP
   - Max size: 5MB per image
   - Stored in: `uploads/products/`

2. **Color-Coded Images**:
   - Field name: `image_#RRGGBB` (e.g., `image_#000000` for black)
   - Supports multiple files per color (max 5 per color)
   - Formats: PNG, JPG, JPEG, WEBP
   - Max size: 5MB per image
   - Stored in: `uploads/products/colors/{hexcode}/`

3. **3D Model**:
   - Field name: `model_3d`
   - Single file
   - Formats: GLB, GLTF
   - Max size: 10MB
   - Stored in: `uploads/products/models/`

### Uploading Images

**Method 1: Direct File Upload**
```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);
formData.append('image_#000000', blackColorFile1);
formData.append('image_#FFD700', goldColorFile1);
```

**Method 2: URL Array (for existing images)**
```javascript
const formData = new FormData();
formData.append('images', JSON.stringify(['url1', 'url2', 'url3']));
```

### Updating Images

To update images, send the complete list of images you want to keep:
```javascript
const formData = new FormData();
// Include existing URLs you want to keep
formData.append('images', JSON.stringify(['existing-url1', 'existing-url2']));
// Add new files
formData.append('images', newFile1);
```

**Note**: Images not included in the array will be deleted from storage.

### Clearing All Images

```javascript
const formData = new FormData();
formData.append('images', JSON.stringify([])); // or formData.append('images', '[]');
```

---

## SEO Fields

### Fields

- `meta_title` (optional): SEO title (max 255 characters)
- `meta_description` (optional): SEO description
- `meta_keywords` (optional): Comma-separated keywords (max 255 characters)

### Example Request

```javascript
const formData = new FormData();
formData.append('meta_title', 'Best Eye Drops for Dry Eyes - Buy Now');
formData.append('meta_description', 'Shop premium eye drops for dry eyes. Fast shipping, great prices. Shop now!');
formData.append('meta_keywords', 'eye drops, dry eyes, eye care, optometry, eye hygiene');
```

---

## Request/Response Examples

### Complete Product Creation Example

```javascript
const formData = new FormData();

// General Tab
formData.append('name', 'ACUVUE MOIST Eye Drops');
formData.append('slug', 'acuvue-moist-eye-drops');
formData.append('sku', 'ACV-MOIST-001');
formData.append('description', 'Premium eye drops for dry eyes...');
formData.append('short_description', 'Relief for dry eyes');
formData.append('category_id', '3'); // Eye Hygiene category
formData.append('sub_category_id', '15');
formData.append('product_type', 'eye_hygiene');
formData.append('price', '14.00');
formData.append('compare_at_price', '16.00');
formData.append('cost_price', '8.00');
formData.append('stock_quantity', '100');
formData.append('stock_status', 'in_stock');
formData.append('is_active', 'true');
formData.append('is_featured', 'false');

// Size/Volume Variants Tab
const variants = [
  {
    size_volume: '5ml',
    pack_type: 'Single',
    price: 8.00,
    compare_at_price: 10.00,
    stock_quantity: 50,
    stock_status: 'in_stock',
    sku: 'ACV-MOIST-5ML',
    is_active: true,
    sort_order: 1
  },
  {
    size_volume: '10ml',
    pack_type: 'Single',
    price: 14.00,
    compare_at_price: 16.00,
    stock_quantity: 75,
    stock_status: 'in_stock',
    sku: 'ACV-MOIST-10ML',
    is_active: true,
    sort_order: 2
  }
];
formData.append('sizeVolumeVariants', JSON.stringify(variants));

// Images Tab
formData.append('images', imageFile1);
formData.append('images', imageFile2);

// SEO Tab
formData.append('meta_title', 'ACUVUE MOIST Eye Drops - Premium Eye Care');
formData.append('meta_description', 'Shop ACUVUE MOIST eye drops for dry eye relief. Fast shipping, great prices.');
formData.append('meta_keywords', 'eye drops, dry eyes, ACUVUE, eye care, optometry');

// API Call
const response = await fetch('/api/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
});

const data = await response.json();
console.log(data);
```

### Update Only SEO Fields Example

```javascript
const formData = new FormData();
formData.append('meta_title', 'Updated SEO Title');
formData.append('meta_description', 'Updated SEO description');
formData.append('meta_keywords', 'updated, keywords');

const response = await fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
});
```

### Update Only Size/Volume Variants Example

```javascript
const variants = [
  {
    id: 1, // Existing variant - will be updated
    size_volume: '5ml',
    price: 9.00, // Updated price
    stock_quantity: 60 // Updated stock
  },
  {
    // New variant - will be created
    size_volume: '30ml',
    pack_type: 'Single',
    price: 20.00,
    stock_quantity: 40,
    stock_status: 'in_stock',
    is_active: true,
    sort_order: 3
  }
  // Variant with id=2 is not included, so it will be deleted
];

const formData = new FormData();
formData.append('sizeVolumeVariants', JSON.stringify(variants));

const response = await fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
});
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Product name is required"
    }
  ]
}
```

**404 Not Found**:
```json
{
  "success": false,
  "message": "Product not found"
}
```

**409 Conflict**:
```json
{
  "success": false,
  "message": "A variant with this size_volume and pack_type already exists for this product"
}
```

**503 Service Unavailable**:
```json
{
  "success": false,
  "message": "ProductSizeVolume table does not exist. Please run migration: npx prisma migrate dev"
}
```

### Error Handling Best Practices

1. Always check `response.ok` or `response.status` before processing data
2. Handle validation errors by displaying field-specific messages
3. Show user-friendly error messages for network errors
4. Retry failed requests with exponential backoff for network errors

---

## Notes

1. **File Upload**: Use `multipart/form-data` when uploading files
2. **JSON Data**: When sending JSON arrays/objects in form data, stringify them: `JSON.stringify([...])`
3. **Variant Management**: The `sizeVolumeVariants` array in update requests **replaces** all existing variants
4. **Image Management**: The `images` array in update requests **replaces** all existing images
5. **Dates**: Use ISO 8601 format for dates (YYYY-MM-DD or full ISO string)
6. **Boolean Fields**: Can be sent as `true`/`false` (boolean), `"true"`/`"false"` (string), or `1`/`0` (number)

---

## Integration Checklist

- [ ] Set up authentication with admin token
- [ ] Implement GET all products endpoint
- [ ] Implement GET single product endpoint
- [ ] Implement CREATE product endpoint with all tabs
- [ ] Implement UPDATE product endpoint with all tabs
- [ ] Implement DELETE product endpoint
- [ ] Implement Size/Volume Variants CRUD endpoints
- [ ] Implement image upload functionality
- [ ] Implement SEO fields save/update
- [ ] Handle error responses appropriately
- [ ] Test all endpoints with real data

---

**Last Updated**: January 2025
