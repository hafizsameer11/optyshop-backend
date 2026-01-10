# Admin Panel Product Management API - Complete Integration Guide

This document provides complete API documentation for integrating the admin panel with the backend. It covers all tabs shown in the admin panel: **General**, **Size/Volume Variants**, **Images**, and **SEO**.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Create Product](#create-product)
3. [Get Product](#get-product)
4. [Update Product](#update-product)
5. [Delete Product](#delete-product)
6. [Field Reference](#field-reference)
7. [Example Requests](#example-requests)

---

## Authentication

All admin endpoints require authentication. Include the admin token in the Authorization header:

```
Authorization: Bearer {{admin_token}}
```

To get an admin token, login at `POST /api/auth/login` with admin credentials.

---

## Create Product

**Endpoint:** `POST /api/admin/products`

**Content-Type:** `multipart/form-data` (for file uploads)

**Authentication:** Required (Admin/Staff)

### Request Body Structure

The request supports all four tabs from the admin panel:

#### General Tab Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | Product name |
| `slug` | String | No | URL-friendly slug (auto-generated if not provided) |
| `sku` | String | ✅ Yes | Product SKU (must be unique) |
| `price` | Decimal | ✅ Yes | Base price |
| `compare_at_price` | Decimal | No | Original/compare price |
| `cost_price` | Decimal | No | Wholesale/cost price |
| `short_description` | String | No | Brief product description |
| `description` | String | No | Full product description |
| `category_id` | Integer | ✅ Yes | Category ID |
| `sub_category_id` | Integer | No | Subcategory ID |
| `product_type` | Enum | ✅ Yes | `frame`, `sunglasses`, `contact_lens`, `eye_hygiene`, `accessory` |
| `stock_quantity` | Integer | No | Base stock quantity (default: 0) |
| `stock_status` | Enum | No | `in_stock`, `out_of_stock`, `backorder` (default: `in_stock`) |
| `is_active` | Boolean | No | Active status (default: `true`) |
| `is_featured` | Boolean | No | Featured product (default: `false`) |

#### Size/Volume Variants Tab

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sizeVolumeVariants` | JSON Array | No | Array of size/volume variants |

**Variant Object Structure:**
```json
{
  "size_volume": "5ml",           // Required: e.g., "5ml", "10ml", "30ml"
  "pack_type": "Single",          // Optional: e.g., "Single", "Pack of 2"
  "price": 8.00,                  // Required: Price for this variant
  "compare_at_price": 10.00,      // Optional: Compare at price
  "cost_price": 5.00,             // Optional: Cost price
  "stock_quantity": 50,           // Required: Stock quantity
  "stock_status": "in_stock",     // Required: "in_stock", "out_of_stock", "backorder"
  "sku": "EYE-001-5ML",           // Optional: Variant SKU
  "expiry_date": "2025-12-31",    // Optional: Expiry date (ISO format or YYYY-MM-DD)
  "is_active": true,              // Required: Active status
  "sort_order": 0                 // Optional: Display order (default: 0)
}
```

**Note:** Send as JSON string in form data: `sizeVolumeVariants=[{"size_volume":"5ml",...}]`

#### Images Tab

**General Product Images (Multiple Selection Supported)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | File(s) | No | General product images (without color codes). Can upload multiple images. Supports: PNG, JPG, JPEG, WEBP - Max 5MB per image |

**Color-Coded Images**

You can upload images associated with specific colors in three ways:

**Method 1: Parallel Arrays (Recommended)**
```javascript
// Form data fields:
images: [file1, file2, file3]           // Array of image files
image_colors: '["#000000", "#000000", "#FFD700"]'  // JSON array of hex codes
```

**Method 2: Individual Color Fields**
```javascript
// Form data fields with pattern: image_#RRGGBB
image_#000000: [file1, file2]  // Black images
image_#FFD700: [file3]         // Gold images
image_#8B4513: [file4]         // Brown images
```

**Method 3: JSON with URLs**
```javascript
// Form data field:
images_with_colors: '[{"hexCode":"#000000","imageUrl":"url1","name":"Black"},...]'
```

**General Product Images (Optional - No Color Codes)**
- Use the `images` field for images not associated with specific color variants
- These are used as default product images

#### SEO Tab

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `meta_title` | String | No | SEO meta title (max 255 chars) |
| `meta_description` | String | No | SEO meta description |
| `meta_keywords` | String | No | SEO keywords (comma-separated) |

### Example Request (cURL)

```bash
curl -X POST "https://api.example.com/api/admin/products" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=ACUVUE MOIST Eye Drops" \
  -F "sku=EYE-001" \
  -F "price=14.00" \
  -F "compare_at_price=18.00" \
  -F "cost_price=9.00" \
  -F "short_description=Premium eye drops for dry eyes" \
  -F "description=Long detailed description here..." \
  -F "category_id=5" \
  -F "sub_category_id=12" \
  -F "product_type=eye_hygiene" \
  -F "stock_quantity=100" \
  -F "stock_status=in_stock" \
  -F "is_active=true" \
  -F "is_featured=false" \
  -F 'sizeVolumeVariants=[{"size_volume":"5ml","pack_type":"Single","price":8.00,"compare_at_price":10.00,"cost_price":5.00,"stock_quantity":50,"stock_status":"in_stock","sku":"EYE-001-5ML","expiry_date":"2025-12-31","is_active":true,"sort_order":1},{"size_volume":"10ml","pack_type":"Single","price":14.00,"compare_at_price":18.00,"cost_price":9.00,"stock_quantity":75,"stock_status":"in_stock","sku":"EYE-001-10ML","expiry_date":"2025-12-31","is_active":true,"sort_order":2}]' \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "meta_title=ACUVUE MOIST Eye Drops - Premium Eye Care" \
  -F "meta_description=Shop premium ACUVUE MOIST Eye Drops for dry eyes. Available in multiple sizes with free shipping." \
  -F "meta_keywords=eye drops, dry eyes, ACUVUE, eye care, contact lens solution"
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": 123,
      "name": "ACUVUE MOIST Eye Drops",
      "slug": "acuvue-moist-eye-drops",
      "sku": "EYE-001",
      "price": "14.00",
      "compare_at_price": "18.00",
      "cost_price": "9.00",
      "short_description": "Premium eye drops for dry eyes",
      "description": "Long detailed description here...",
      "category_id": 5,
      "sub_category_id": 12,
      "product_type": "eye_hygiene",
      "stock_quantity": 100,
      "stock_status": "in_stock",
      "is_active": true,
      "is_featured": false,
      "meta_title": "ACUVUE MOIST Eye Drops - Premium Eye Care",
      "meta_description": "Shop premium ACUVUE MOIST Eye Drops...",
      "meta_keywords": "eye drops, dry eyes, ACUVUE",
      "images": [
        "https://s3.amazonaws.com/bucket/products/image1.jpg",
        "https://s3.amazonaws.com/bucket/products/image2.jpg"
      ],
      "image": "https://s3.amazonaws.com/bucket/products/image1.jpg",
      "color_images": [],
      "sizeVolumeVariants": [
        {
          "id": 1,
          "product_id": 123,
          "size_volume": "5ml",
          "pack_type": "Single",
          "price": "8.00",
          "compare_at_price": "10.00",
          "cost_price": "5.00",
          "stock_quantity": 50,
          "stock_status": "in_stock",
          "sku": "EYE-001-5ML",
          "expiry_date": "2025-12-31T00:00:00.000Z",
          "is_active": true,
          "sort_order": 1
        },
        {
          "id": 2,
          "product_id": 123,
          "size_volume": "10ml",
          "pack_type": "Single",
          "price": "14.00",
          "compare_at_price": "18.00",
          "cost_price": "9.00",
          "stock_quantity": 75,
          "stock_status": "in_stock",
          "sku": "EYE-001-10ML",
          "expiry_date": "2025-12-31T00:00:00.000Z",
          "is_active": true,
          "sort_order": 2
        }
      ],
      "category": {
        "id": 5,
        "name": "Eye Hygiene",
        "slug": "eye-hygiene"
      },
      "subCategory": {
        "id": 12,
        "name": "Eye Drops",
        "slug": "eye-drops"
      },
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "message": "Validation error: SKU already exists",
  "errors": {
    "sku": "SKU must be unique"
  }
}
```

---

## Get Product

**Endpoint:** `GET /api/admin/products/:id`

**Authentication:** Required (Admin/Staff)

### Success Response (200)

Returns the same structure as the create response, including all product data, variants, and images.

### Example Request

```bash
curl -X GET "https://api.example.com/api/admin/products/123" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Update Product

**Endpoint:** `PUT /api/admin/products/:id`

**Content-Type:** `multipart/form-data` (for file uploads)

**Authentication:** Required (Admin/Staff)

### Request Body Structure

Same structure as Create Product. All fields are optional - only include fields you want to update.

### Important Notes for Updates

1. **Size/Volume Variants**: 
   - To update variants, include the `id` field in each variant object
   - Variants without `id` will be created as new variants
   - Variants not included in the array will be deleted
   - Empty array `[]` will delete all variants

2. **Images**:
   - Include `images` field with current image URLs to keep them
   - Upload new files to add them
   - Images not in the `images` array will be deleted from storage
   - To replace all images, send new files and omit existing URLs

3. **Partial Updates**: Only send fields that need to be updated

### Example Request

```bash
curl -X PUT "https://api.example.com/api/admin/products/123" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Updated Product Name" \
  -F "price=15.00" \
  -F "images=[\"https://existing-image-url.jpg\"]" \
  -F "images=@/path/to/new-image.jpg" \
  -F 'sizeVolumeVariants=[{"id":1,"size_volume":"5ml","price":9.00,"stock_quantity":60},{"size_volume":"30ml","pack_type":"Single","price":20.00,"stock_quantity":40,"stock_status":"in_stock","is_active":true,"sort_order":3}]'
```

### Success Response (200)

Same structure as Create Product response.

---

## Delete Product

**Endpoint:** `DELETE /api/admin/products/:id`

**Authentication:** Required (Admin/Staff)

### Example Request

```bash
curl -X DELETE "https://api.example.com/api/admin/products/123" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Field Reference

### Product Types (Enum)

- `frame` - Eyeglass frames
- `sunglasses` - Sunglasses
- `contact_lens` - Contact lenses
- `eye_hygiene` - Eye hygiene products (drops, solutions, etc.)
- `accessory` - Accessories

### Stock Status (Enum)

- `in_stock` - Product is in stock
- `out_of_stock` - Product is out of stock
- `backorder` - Product is on backorder

### Date Formats

- **Expiry Date**: ISO 8601 format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`)
- Examples:
  - `2025-12-31`
  - `2025-12-31T00:00:00.000Z`
  - `2025-12-31T23:59:59.999Z`

### Image Formats

- **Supported formats**: PNG, JPG, JPEG, WEBP
- **Max file size**: 5MB per image
- **Multiple uploads**: Supported (select multiple files)

---

## Example Requests

### JavaScript/Fetch Example

```javascript
// Create Product with all tabs
const formData = new FormData();

// General Tab
formData.append('name', 'ACUVUE MOIST Eye Drops');
formData.append('sku', 'EYE-001');
formData.append('price', '14.00');
formData.append('compare_at_price', '18.00');
formData.append('cost_price', '9.00');
formData.append('short_description', 'Premium eye drops for dry eyes');
formData.append('description', 'Long detailed description...');
formData.append('category_id', '5');
formData.append('sub_category_id', '12');
formData.append('product_type', 'eye_hygiene');
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
    cost_price: 5.00,
    stock_quantity: 50,
    stock_status: 'in_stock',
    sku: 'EYE-001-5ML',
    expiry_date: '2025-12-31',
    is_active: true,
    sort_order: 1
  },
  {
    size_volume: '10ml',
    pack_type: 'Single',
    price: 14.00,
    compare_at_price: 18.00,
    cost_price: 9.00,
    stock_quantity: 75,
    stock_status: 'in_stock',
    sku: 'EYE-001-10ML',
    expiry_date: '2025-12-31',
    is_active: true,
    sort_order: 2
  }
];
formData.append('sizeVolumeVariants', JSON.stringify(variants));

// Images Tab - General images
const imageFiles = document.getElementById('images').files;
for (let i = 0; i < imageFiles.length; i++) {
  formData.append('images', imageFiles[i]);
}

// Images Tab - Color-coded images (Method 1: Parallel Arrays)
const colorImageFiles = document.getElementById('color-images').files;
const imageColors = [];
for (let i = 0; i < colorImageFiles.length; i++) {
  formData.append('images', colorImageFiles[i]);
  imageColors.push('#000000'); // Get from color picker
}
formData.append('image_colors', JSON.stringify(imageColors));

// SEO Tab
formData.append('meta_title', 'ACUVUE MOIST Eye Drops - Premium Eye Care');
formData.append('meta_description', 'Shop premium ACUVUE MOIST Eye Drops...');
formData.append('meta_keywords', 'eye drops, dry eyes, ACUVUE, eye care');

// Send request
fetch('https://api.example.com/api/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('Product created:', data.data.product);
    } else {
      console.error('Error:', data.message);
    }
  })
  .catch(error => console.error('Request failed:', error));
```

### Update Product Example

```javascript
// Update Product - Only update specific fields
const formData = new FormData();

// Update general fields
formData.append('name', 'Updated Product Name');
formData.append('price', '15.00');

// Update variants - keep existing ones with id, add new ones without id
const updatedVariants = [
  {
    id: 1, // Existing variant - will be updated
    size_volume: '5ml',
    price: 9.00,
    stock_quantity: 60
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
];
formData.append('sizeVolumeVariants', JSON.stringify(updatedVariants));

// Update images - keep existing, add new
const existingImages = ['https://existing-image-url.jpg'];
formData.append('images', JSON.stringify(existingImages));

const newImageFiles = document.getElementById('new-images').files;
for (let i = 0; i < newImageFiles.length; i++) {
  formData.append('images', newImageFiles[i]);
}

// Update SEO
formData.append('meta_title', 'Updated Meta Title');

fetch(`https://api.example.com/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('Product updated:', data.data.product);
    }
  });
```

---

## Frontend Integration Tips

### 1. Form Data Handling

When working with multipart/form-data:
- Use `FormData` object for all requests
- Don't set `Content-Type` header (browser sets it automatically with boundary)
- Convert JSON arrays/objects to strings: `formData.append('variants', JSON.stringify(variants))`

### 2. Image Upload

- Use `<input type="file" multiple>` for multiple image selection
- Validate file types and sizes before upload
- Show upload progress for better UX
- Preview images before submission

### 3. Variants Management

- Maintain variant state in your component
- When updating: Include `id` for existing variants, omit for new ones
- Sort variants by `sort_order` for display
- Validate required fields before submission

### 4. Error Handling

- Handle validation errors (400)
- Handle authentication errors (401)
- Handle not found errors (404)
- Handle server errors (500)
- Display user-friendly error messages

### 5. Loading States

- Show loading spinner during requests
- Disable form submission while processing
- Show success/error notifications

---

## Testing Checklist

- ✅ Create product with all tabs filled
- ✅ Create product with minimal required fields
- ✅ Update product general information
- ✅ Add/update/delete size/volume variants
- ✅ Upload single image
- ✅ Upload multiple images
- ✅ Upload color-coded images
- ✅ Update SEO fields
- ✅ Delete product
- ✅ Handle validation errors
- ✅ Handle duplicate SKU errors
- ✅ Handle authentication errors

---

## Support

For issues or questions, contact the development team or check the main API documentation.


