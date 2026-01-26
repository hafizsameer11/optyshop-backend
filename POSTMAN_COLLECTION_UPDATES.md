# Postman Collection Updates - Size/Volume Variant Image Support

## Overview
The OptyShop API Postman collection has been updated to include support for the new `image_url` field in size/volume variants. This allows each volume variant to have its own unique image.

## Updated Endpoints

### 1. Create Size/Volume Variant
**Endpoint:** `POST /api/admin/products/{productId}/size-volume-variants`

**Updated Request Body:**
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
  "image_url": "https://example.com/images/5ml-bottle.jpg",
  "is_active": true,
  "sort_order": 1
}
```

**New Field:**
- `image_url`: Image URL for this variant (max 500 characters, optional)

### 2. Update Size/Volume Variant
**Endpoint:** `PUT /api/admin/products/{productId}/size-volume-variants/{variantId}`

**Updated Request Body:**
```json
{
  "size_volume": "5ml",
  "price": 9.00,
  "stock_quantity": 60,
  "image_url": "https://example.com/images/updated-5ml-bottle.jpg",
  "is_active": true
}
```

**New Field:**
- `image_url`: Can be updated to change the variant's image

### 3. Get All Size/Volume Variants
**Endpoint:** `GET /api/admin/products/{productId}/size-volume-variants`

**Updated Response Format:**
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
        "image_url": "https://example.com/images/5ml-bottle.jpg",
        "is_active": true,
        "sort_order": 1
      },
      {
        "id": 2,
        "product_id": 1,
        "size_volume": "10ml",
        "pack_type": "Single",
        "price": 14.00,
        "compare_at_price": 16.00,
        "cost_price": 8.00,
        "stock_quantity": 75,
        "stock_status": "in_stock",
        "sku": "SKU-10ML",
        "expiry_date": null,
        "image_url": "https://example.com/images/10ml-bottle.jpg",
        "is_active": true,
        "sort_order": 2
      }
    ]
  }
}
```

### 4. Get Single Size/Volume Variant
**Endpoint:** `GET /api/admin/products/{productId}/size-volume-variants/{variantId}`

**Updated Response Format:**
```json
{
  "success": true,
  "message": "Size/volume variant retrieved successfully",
  "data": {
    "variant": {
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
      "image_url": "https://example.com/images/5ml-bottle.jpg",
      "is_active": true,
      "sort_order": 1
    }
  }
}
```

### 5. Bulk Update Size/Volume Variants
**Endpoint:** `PUT /api/admin/products/{productId}/size-volume-variants/bulk`

**Updated Request Body:**
```json
{
  "variants": [
    {
      "id": 1,
      "size_volume": "5ml",
      "pack_type": "Single",
      "price": 9.00,
      "stock_quantity": 60,
      "image_url": "https://example.com/images/updated-5ml-bottle.jpg"
    },
    {
      "size_volume": "30ml",
      "pack_type": "Single",
      "price": 20.00,
      "stock_quantity": 40,
      "stock_status": "in_stock",
      "image_url": "https://example.com/images/30ml-bottle.jpg",
      "is_active": true,
      "sort_order": 3
    }
  ]
}
```

## Website API Changes

### Product Endpoints
The following website endpoints now return size/volume variants with `image_url` field:

1. `GET /api/products` - Product listings include variants with images
2. `GET /api/products/{id}` - Single product includes variants with images  
3. `GET /api/products/slug/{slug}` - Product by slug includes variants with images

**Response Enhancement:**
```json
{
  "size_volume_variants": [
    {
      "id": 1,
      "size_volume": "5ml",
      "pack_type": "Single",
      "price": 8.00,
      "image_url": "https://example.com/images/5ml-bottle.jpg",
      "is_active": true,
      "sort_order": 1
    }
  ]
}
```

## Implementation Notes

### Field Specifications
- **Field Name:** `image_url`
- **Data Type:** String
- **Max Length:** 500 characters
- **Required:** No (optional field)
- **Default:** null

### Usage Guidelines
1. **Image URLs should be fully qualified** (include https://)
2. **Supported formats:** JPG, PNG, GIF, WebP
3. **Recommended size:** 800x800px for consistency
4. **File naming:** Use descriptive names like `5ml-bottle.jpg`

### Frontend Integration
1. **Admin Panel:** Add image upload/URL input to variant forms
2. **Website:** Display variant images in product galleries
3. **Image Fallback:** Use product main image if variant image is null
4. **Image Optimization:** Consider CDN integration for performance

## Testing Scenarios

### 1. Create Variant with Image
```bash
curl -X POST {{base_url}}/api/admin/products/1/size-volume-variants \
  -H "Authorization: Bearer {{admin_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "size_volume": "15ml",
    "pack_type": "Single",
    "price": 12.00,
    "image_url": "https://example.com/images/15ml-bottle.jpg"
  }'
```

### 2. Update Variant Image
```bash
curl -X PUT {{base_url}}/api/admin/products/1/size-volume-variants/1 \
  -H "Authorization: Bearer {{admin_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/images/new-5ml-bottle.jpg"
  }'
```

### 3. Get Variants with Images
```bash
curl -X GET {{base_url}}/api/admin/products/1/size-volume-variants \
  -H "Authorization: Bearer {{admin_token}}"
```

## Migration Details

**Migration File:** `20250126200000_add_image_url_to_size_volume_variants`
**SQL Change:** `ALTER TABLE product_size_volumes ADD COLUMN image_url VARCHAR(500) NULL;`

## Summary

The image functionality for size/volume variants is now fully implemented:

✅ **Database:** `image_url` field added to `product_size_volumes` table
✅ **Backend:** Controllers updated to handle `image_url` field
✅ **API:** All variant endpoints support `image_url`
✅ **Documentation:** Postman collection examples updated
✅ **Migration:** Database schema updated successfully

**Next Steps:**
1. Update frontend forms to include image upload/URL input
2. Implement image display in product galleries
3. Add image validation and upload handling
4. Test complete workflow from admin to website
