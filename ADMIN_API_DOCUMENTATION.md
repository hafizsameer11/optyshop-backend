# Admin Panel API Documentation

## Complete API Endpoints with Request/Response Examples

---

## 🔐 Authentication

All admin endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📊 Lens Thickness Materials

### Get All Lens Thickness Materials

**Endpoint:**
```
GET /api/admin/lens-thickness-materials?page=1&limit=50&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `isActive` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness materials retrieved successfully",
  "data": {
    "materials": [
      {
        "id": 1,
        "name": "Unbreakable (Plastic)",
        "slug": "unbreakable-plastic",
        "description": "Durable plastic material that resists breaking",
        "price": 30.00,
        "isActive": true,
        "sortOrder": 1,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      },
      {
        "id": 2,
        "name": "Minerals (Glass)",
        "slug": "minerals-glass",
        "description": "High-quality glass material",
        "price": 60.00,
        "isActive": true,
        "sortOrder": 2,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 2,
      "pages": 1
    }
  }
}
```

---

### Get Single Lens Thickness Material

**Endpoint:**
```
GET /api/admin/lens-thickness-materials/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness material retrieved successfully",
  "data": {
    "material": {
      "id": 1,
      "name": "Unbreakable (Plastic)",
      "slug": "unbreakable-plastic",
      "description": "Durable plastic material that resists breaking",
      "price": 30.00,
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:12:47.000Z"
    }
  }
}
```

---

### Create Lens Thickness Material

**Endpoint:**
```
POST /api/admin/lens-thickness-materials
```

**Request Body:**
```json
{
  "name": "Unbreakable (Plastic)",
  "slug": "unbreakable-plastic",
  "description": "Durable plastic material that resists breaking",
  "price": 30.00,
  "is_active": true,
  "sort_order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness material created successfully",
  "data": {
    "material": {
      "id": 1,
      "name": "Unbreakable (Plastic)",
      "slug": "unbreakable-plastic",
      "description": "Durable plastic material that resists breaking",
      "price": 30.00,
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:12:47.000Z"
    }
  }
}
```

---

### Update Lens Thickness Material

**Endpoint:**
```
PUT /api/admin/lens-thickness-materials/:id
```

**Request Body:**
```json
{
  "name": "Unbreakable (Plastic) - Updated",
  "price": 35.00,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness material updated successfully",
  "data": {
    "material": {
      "id": 1,
      "name": "Unbreakable (Plastic) - Updated",
      "slug": "unbreakable-plastic",
      "description": "Durable plastic material that resists breaking",
      "price": 35.00,
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:15:30.000Z"
    }
  }
}
```

---

### Delete Lens Thickness Material

**Endpoint:**
```
DELETE /api/admin/lens-thickness-materials/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness material deleted successfully"
}
```

---

## 📏 Lens Thickness Options

### Get All Lens Thickness Options

**Endpoint:**
```
GET /api/admin/lens-thickness-options?page=1&limit=50&isActive=true
```

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness options retrieved successfully",
  "data": {
    "options": [
      {
        "id": 1,
        "name": "Thin",
        "slug": "thin",
        "description": "Thin lens option for lighter weight",
        "thicknessValue": 1.5,
        "isActive": true,
        "sortOrder": 1,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      },
      {
        "id": 2,
        "name": "Medium",
        "slug": "medium",
        "description": "Medium thickness option",
        "thicknessValue": 2.0,
        "isActive": true,
        "sortOrder": 2,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      },
      {
        "id": 3,
        "name": "Thick",
        "slug": "thick",
        "description": "Thick lens option for higher prescriptions",
        "thicknessValue": 3.0,
        "isActive": true,
        "sortOrder": 3,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 3,
      "pages": 1
    }
  }
}
```

---

### Get Single Lens Thickness Option

**Endpoint:**
```
GET /api/admin/lens-thickness-options/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness option retrieved successfully",
  "data": {
    "option": {
      "id": 1,
      "name": "Thin",
      "slug": "thin",
      "description": "Thin lens option for lighter weight",
      "thicknessValue": 1.5,
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:12:47.000Z"
    }
  }
}
```

---

### Create Lens Thickness Option

**Endpoint:**
```
POST /api/admin/lens-thickness-options
```

**Request Body:**
```json
{
  "name": "Thin",
  "slug": "thin",
  "description": "Thin lens option for lighter weight",
  "thickness_value": 1.5,
  "is_active": true,
  "sort_order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness option created successfully",
  "data": {
    "option": {
      "id": 1,
      "name": "Thin",
      "slug": "thin",
      "description": "Thin lens option for lighter weight",
      "thicknessValue": 1.5,
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:12:47.000Z"
    }
  }
}
```

---

### Update Lens Thickness Option

**Endpoint:**
```
PUT /api/admin/lens-thickness-options/:id
```

**Request Body:**
```json
{
  "name": "Thin - Updated",
  "thickness_value": 1.6,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness option updated successfully",
  "data": {
    "option": {
      "id": 1,
      "name": "Thin - Updated",
      "slug": "thin",
      "description": "Thin lens option for lighter weight",
      "thicknessValue": 1.6,
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:15:30.000Z"
    }
  }
}
```

---

### Delete Lens Thickness Option

**Endpoint:**
```
DELETE /api/admin/lens-thickness-options/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Lens thickness option deleted successfully"
}
```

---

## 🛡️ Lens Treatments

### Get All Lens Treatments

**Endpoint:**
```
GET /api/admin/lens-treatments?page=1&limit=50&type=scratch_proof&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Filter by treatment type
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "message": "Lens treatments retrieved successfully",
  "data": {
    "treatments": [
      {
        "id": 1,
        "name": "Scratch Proof",
        "slug": "scratch-proof",
        "type": "scratch_proof",
        "description": "Protects lenses from scratches and daily wear",
        "price": 30.00,
        "icon": "https://example.com/icons/scratch-proof.png",
        "isActive": true,
        "sortOrder": 1,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      },
      {
        "id": 2,
        "name": "Anti Glare",
        "slug": "anti-glare",
        "type": "anti_glare",
        "description": "Reduces glare and reflections",
        "price": 30.00,
        "icon": "https://example.com/icons/anti-glare.png",
        "isActive": true,
        "sortOrder": 2,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      },
      {
        "id": 3,
        "name": "Blue Lens Anti Glare",
        "slug": "blue-lens-anti-glare",
        "type": "blue_light_anti_glare",
        "description": "Filters blue light and reduces glare",
        "price": 30.00,
        "icon": "https://example.com/icons/blue-lens.png",
        "isActive": true,
        "sortOrder": 3,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 3,
      "pages": 1
    }
  }
}
```

---

### Get Single Lens Treatment

**Endpoint:**
```
GET /api/admin/lens-treatments/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Lens treatment retrieved successfully",
  "data": {
    "treatment": {
      "id": 1,
      "name": "Scratch Proof",
      "slug": "scratch-proof",
      "type": "scratch_proof",
      "description": "Protects lenses from scratches and daily wear",
      "price": 30.00,
      "icon": "https://example.com/icons/scratch-proof.png",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:12:47.000Z"
    }
  }
}
```

---

### Create Lens Treatment

**Endpoint:**
```
POST /api/admin/lens-treatments
```

**Request Body:**
```json
{
  "name": "Scratch Proof",
  "slug": "scratch-proof",
  "type": "scratch_proof",
  "description": "Protects lenses from scratches and daily wear",
  "price": 30.00,
  "icon": "https://example.com/icons/scratch-proof.png",
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

**Response:**
```json
{
  "success": true,
  "message": "Lens treatment created successfully",
  "data": {
    "treatment": {
      "id": 1,
      "name": "Scratch Proof",
      "slug": "scratch-proof",
      "type": "scratch_proof",
      "description": "Protects lenses from scratches and daily wear",
      "price": 30.00,
      "icon": "https://example.com/icons/scratch-proof.png",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:12:47.000Z"
    }
  }
}
```

---

### Update Lens Treatment

**Endpoint:**
```
PUT /api/admin/lens-treatments/:id
```

**Request Body:**
```json
{
  "name": "Scratch Proof - Premium",
  "price": 35.00,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lens treatment updated successfully",
  "data": {
    "treatment": {
      "id": 1,
      "name": "Scratch Proof - Premium",
      "slug": "scratch-proof",
      "type": "scratch_proof",
      "description": "Protects lenses from scratches and daily wear",
      "price": 35.00,
      "icon": "https://example.com/icons/scratch-proof.png",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:15:30.000Z"
    }
  }
}
```

---

### Delete Lens Treatment

**Endpoint:**
```
DELETE /api/admin/lens-treatments/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Lens treatment deleted successfully"
}
```

---

## 🎨 Lens Colors

### Get All Lens Colors

**Endpoint:**
```
GET /api/admin/lens-colors?page=1&limit=100&lensOptionId=5&lensFinishId=2&prescriptionLensTypeId=4&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `lensOptionId` (optional): Filter by lens option
- `lensFinishId` (optional): Filter by lens finish
- `prescriptionLensTypeId` (optional): Filter by prescription lens type
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "message": "Lens colors retrieved successfully",
  "data": {
    "colors": [
      {
        "id": 1,
        "name": "Gray",
        "colorCode": "GRAY",
        "hexCode": "#808080",
        "imageUrl": "https://example.com/colors/gray.png",
        "priceAdjustment": 0.00,
        "isActive": true,
        "sortOrder": 1,
        "lensOption": {
          "id": 5,
          "name": "Photochromic",
          "type": "photochromic"
        },
        "lensFinish": null,
        "prescriptionLensType": null
      },
      {
        "id": 2,
        "name": "Dark Brown",
        "colorCode": "DARK_BROWN",
        "hexCode": "#654321",
        "imageUrl": "https://example.com/colors/dark-brown.png",
        "priceAdjustment": 0.00,
        "isActive": true,
        "sortOrder": 1,
        "lensOption": null,
        "lensFinish": null,
        "prescriptionLensType": {
          "id": 4,
          "name": "Prescription Lenses Sun",
          "slug": "prescription-lenses-sun"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 2,
      "pages": 1
    }
  }
}
```

---

### Create Lens Color (Photochromic)

**Endpoint:**
```
POST /api/admin/lens-colors
```

**Request Body:**
```json
{
  "lens_option_id": 5,
  "name": "Gray",
  "color_code": "GRAY",
  "hex_code": "#808080",
  "image_url": "https://example.com/colors/gray.png",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lens color created successfully",
  "data": {
    "color": {
      "id": 1,
      "name": "Gray",
      "colorCode": "GRAY",
      "hexCode": "#808080",
      "imageUrl": "https://example.com/colors/gray.png",
      "priceAdjustment": 0.00,
      "isActive": true,
      "sortOrder": 1
    }
  }
}
```

---

### Create Lens Color (Prescription Sun)

**Endpoint:**
```
POST /api/admin/lens-colors
```

**Request Body:**
```json
{
  "prescription_lens_type_id": 4,
  "name": "Dark Brown",
  "color_code": "DARK_BROWN",
  "hex_code": "#654321",
  "image_url": "https://example.com/colors/dark-brown.png",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lens color created successfully",
  "data": {
    "color": {
      "id": 2,
      "name": "Dark Brown",
      "colorCode": "DARK_BROWN",
      "hexCode": "#654321",
      "imageUrl": "https://example.com/colors/dark-brown.png",
      "priceAdjustment": 0.00,
      "isActive": true,
      "sortOrder": 1
    }
  }
}
```

---

### Update Lens Color

**Endpoint:**
```
PUT /api/admin/lens-colors/:id
```

**Request Body:**
```json
{
  "name": "Gray - Updated",
  "hex_code": "#888888",
  "price_adjustment": 5.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lens color updated successfully",
  "data": {
    "color": {
      "id": 1,
      "name": "Gray - Updated",
      "colorCode": "GRAY",
      "hexCode": "#888888",
      "imageUrl": "https://example.com/colors/gray.png",
      "priceAdjustment": 5.00,
      "isActive": true,
      "sortOrder": 1
    }
  }
}
```

---

### Delete Lens Color

**Endpoint:**
```
DELETE /api/admin/lens-colors/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Lens color deleted successfully"
}
```

---

## 🔄 Prescription Lens Variants

### Get All Prescription Lens Variants

**Endpoint:**
```
GET /api/admin/prescription-lens-variants?page=1&limit=50&prescriptionLensTypeId=3&isActive=true
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription lens variants retrieved successfully",
  "data": {
    "variants": [
      {
        "id": 1,
        "name": "Premium",
        "slug": "premium",
        "description": "Up to 40% wider viewing areas than Standard",
        "price": 52.95,
        "isRecommended": true,
        "viewingRange": "Wide",
        "useCases": "Maximum comfort & balanced vision",
        "isActive": true,
        "sortOrder": 1,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      },
      {
        "id": 2,
        "name": "Standard",
        "slug": "standard",
        "description": "Perfect for everyday tasks",
        "price": 37.95,
        "isRecommended": false,
        "viewingRange": "Standard",
        "useCases": "Comfortable and well-balanced view",
        "isActive": true,
        "sortOrder": 2,
        "createdAt": "2024-12-13T21:12:47.000Z",
        "updatedAt": "2024-12-13T21:12:47.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 2,
      "pages": 1
    }
  }
}
```

---

### Create Prescription Lens Variant

**Endpoint:**
```
POST /api/admin/prescription-lens-variants
```

**Request Body:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Premium",
  "slug": "premium",
  "description": "Up to 40% wider viewing areas than Standard",
  "price": 52.95,
  "is_recommended": true,
  "viewing_range": "Wide",
  "use_cases": "Maximum comfort & balanced vision",
  "is_active": true,
  "sort_order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription lens variant created successfully",
  "data": {
    "variant": {
      "id": 1,
      "name": "Premium",
      "slug": "premium",
      "description": "Up to 40% wider viewing areas than Standard",
      "price": 52.95,
      "isRecommended": true,
      "viewingRange": "Wide",
      "useCases": "Maximum comfort & balanced vision",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:12:47.000Z"
    }
  }
}
```

---

### Update Prescription Lens Variant

**Endpoint:**
```
PUT /api/admin/prescription-lens-variants/:id
```

**Request Body:**
```json
{
  "name": "Premium - Updated",
  "price": 55.95,
  "is_recommended": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription lens variant updated successfully",
  "data": {
    "variant": {
      "id": 1,
      "name": "Premium - Updated",
      "slug": "premium",
      "description": "Up to 40% wider viewing areas than Standard",
      "price": 55.95,
      "isRecommended": true,
      "viewingRange": "Wide",
      "useCases": "Maximum comfort & balanced vision",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-12-13T21:12:47.000Z",
      "updatedAt": "2024-12-13T21:15:30.000Z"
    }
  }
}
```

---

### Delete Prescription Lens Variant

**Endpoint:**
```
DELETE /api/admin/prescription-lens-variants/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription lens variant deleted successfully"
}
```

---

## ❌ Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not admin/staff)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate slug/name)
- `500` - Internal Server Error

**Example Error Response:**
```json
{
  "success": false,
  "message": "Name is required",
  "error": "Validation failed: name field is required"
}
```

---

## 📝 Notes

1. **Slug Generation:** If `slug` is not provided, it will be auto-generated from the `name` field
2. **Price Format:** All prices should be in decimal format (e.g., 30.00)
3. **Boolean Fields:** Use `true`/`false` or `"true"`/`"false"` strings
4. **Sort Order:** Lower numbers appear first
5. **Active Status:** Only active items appear in public endpoints

