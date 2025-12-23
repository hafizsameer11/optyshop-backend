# Prescription Sun Lenses & Photochromic Lenses API Documentation

This document describes the API endpoints for managing Prescription Sun Lenses and Photochromic Lenses.

## Overview

The system uses the existing `LensOption`, `LensFinish`, and `LensColor` models to manage:
- **Prescription Sun Lenses**: Polarized, Classic, and Blokz® Sunglasses with various finishes (Classic, Mirror, Gradient, Fashion) and colors
- **Photochromic Lenses**: EyeQLenz™ with Zenni ID Guard™, EyeQLenz™, Transitions® GEN S™, Standard, and Blokz Photochromic with colors

## Prescription Sun Lenses API

### Public Endpoints (No Authentication Required)

#### Get All Prescription Sun Lenses
```
GET /api/prescription-sun-lenses
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription sun lenses retrieved successfully",
  "data": {
    "polarized": {
      "id": 1,
      "name": "Polarized",
      "slug": "polarized",
      "type": "polarized",
      "description": "Reduce glare and see clearly for outdoor activities and driving.",
      "basePrice": 76.95,
      "isActive": true,
      "sortOrder": 0,
      "finishes": [
        {
          "id": 1,
          "name": "Classic",
          "slug": "classic",
          "priceAdjustment": 0,
          "colors": [
            {
              "id": 1,
              "name": "Dark Gray",
              "colorCode": "dark-gray",
              "hexCode": "#4a4a4a",
              "priceAdjustment": 0
            }
          ]
        },
        {
          "id": 2,
          "name": "Mirror",
          "slug": "mirror",
          "priceAdjustment": 27.95,
          "colors": [...]
        }
      ],
      "colors": []
    },
    "classic": {...},
    "blokz": {...}
  }
}
```

#### Get Single Prescription Sun Lens
```
GET /api/prescription-sun-lenses/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription sun lens option retrieved successfully",
  "data": {
    "option": {
      "id": 1,
      "name": "Polarized",
      "slug": "polarized",
      "type": "polarized",
      "description": "...",
      "basePrice": 76.95,
      "finishes": [...],
      "colors": [...]
    }
  }
}
```

### Admin Endpoints (Authentication Required)

All admin endpoints require `Authorization: Bearer <admin_token>` header.

#### Get All Prescription Sun Lenses (Admin)
```
GET /api/admin/prescription-sun-lenses?page=1&limit=50&type=polarized&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `type` (optional): Filter by type (polarized, classic, photochromic)
- `isActive` (optional): Filter by active status (true/false)

#### Create Prescription Sun Lens (Admin)
```
POST /api/admin/prescription-sun-lenses
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Polarized",
  "slug": "polarized",
  "type": "polarized",
  "description": "Reduce glare and see clearly for outdoor activities and driving.",
  "base_price": 76.95,
  "is_active": true,
  "sort_order": 0
}
```

#### Update Prescription Sun Lens (Admin)
```
PUT /api/admin/prescription-sun-lenses/:id
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Polarized",
  "base_price": 80.00,
  "is_active": true
}
```

#### Delete Prescription Sun Lens (Admin)
```
DELETE /api/admin/prescription-sun-lenses/:id
Authorization: Bearer <admin_token>
```

## Photochromic Lenses API

### Public Endpoints (No Authentication Required)

#### Get All Photochromic Lenses
```
GET /api/photochromic-lenses
```

**Response:**
```json
{
  "success": true,
  "message": "Photochromic lenses retrieved successfully",
  "data": {
    "eyeqlenzWithGuard": {
      "id": 1,
      "name": "EyeQLenz™ with Zenni ID Guard™",
      "slug": "eyeqlenz-with-zenni-id-guard",
      "type": "photochromic",
      "description": "4-in-1 lens that reflects infrared light...",
      "basePrice": 0,
      "colors": [
        {
          "id": 1,
          "name": "Dark Gray",
          "colorCode": "dark-gray",
          "hexCode": "#4a4a4a",
          "priceAdjustment": 0
        }
      ]
    },
    "eyeqlenz": {...},
    "transitions": {...},
    "standard": {...},
    "blokzPhotochromic": {...},
    "all": [...]
  }
}
```

#### Get Single Photochromic Lens
```
GET /api/photochromic-lenses/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Photochromic lens option retrieved successfully",
  "data": {
    "option": {
      "id": 1,
      "name": "EyeQLenz™ with Zenni ID Guard™",
      "slug": "eyeqlenz-with-zenni-id-guard",
      "type": "photochromic",
      "description": "...",
      "basePrice": 0,
      "colors": [...]
    }
  }
}
```

### Admin Endpoints (Authentication Required)

All admin endpoints require `Authorization: Bearer <admin_token>` header.

#### Get All Photochromic Lenses (Admin)
```
GET /api/admin/photochromic-lenses?page=1&limit=50&isActive=true
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `isActive` (optional): Filter by active status (true/false)

#### Create Photochromic Lens (Admin)
```
POST /api/admin/photochromic-lenses
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "EyeQLenz™ with Zenni ID Guard™",
  "slug": "eyeqlenz-with-zenni-id-guard",
  "description": "4-in-1 lens that reflects infrared light to disrupt unwanted tracking technology, filters blue light & blocks 100% UV. Stays clear indoors and darkens outdoors, with a subtle pink sheen.",
  "base_price": 0,
  "is_active": true,
  "sort_order": 0
}
```

#### Update Photochromic Lens (Admin)
```
PUT /api/admin/photochromic-lenses/:id
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "EyeQLenz™ with Zenni ID Guard™",
  "base_price": 10.00,
  "is_active": true
}
```

#### Delete Photochromic Lens (Admin)
```
DELETE /api/admin/photochromic-lenses/:id
Authorization: Bearer <admin_token>
```

## Managing Finishes and Colors

To add finishes (Classic, Mirror, Gradient, Fashion) and colors to prescription sun lenses, use the existing lens management endpoints:

### Create Lens Finish (Admin)
```
POST /api/admin/lens-finishes
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "lens_option_id": 1,
  "name": "Classic",
  "slug": "classic",
  "description": "Classic finish",
  "price_adjustment": 0,
  "is_active": true,
  "sort_order": 0
}
```

### Create Lens Color (Admin)
```
POST /api/admin/lens-colors
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "lens_option_id": 1,
  "lens_finish_id": 1,
  "name": "Dark Gray",
  "color_code": "dark-gray",
  "hex_code": "#4a4a4a",
  "image_url": "https://example.com/color.jpg",
  "price_adjustment": 0,
  "is_active": true,
  "sort_order": 0
}
```

**Note:** For colors that belong directly to a lens option (not a finish), set `lens_finish_id` to `null` or omit it.

## Data Structure

### Prescription Sun Lenses Structure

```
Polarized (+$76.95)
├── Classic (Free)
│   ├── Dark Gray
│   ├── Brown
│   └── Dark Green
└── Mirror (+$27.95)
    ├── Light Green
    ├── Blue
    ├── Silver
    └── ...

Classic (+$60.90)
├── Fashion (Free)
│   ├── Light Purple
│   ├── Beige
│   └── ...
├── Mirror (+$20.00)
├── Gradient (+$4.00)
└── Classic (Free)

Blokz® Sunglasses (+$95.90)
├── Mirror (+$20.00)
└── Classic (Free)
```

### Photochromic Lenses Structure

```
EyeQLenz™ with Zenni ID Guard™
├── Dark Gray (with pinkish hue)
├── Brown (with pinkish hue)
└── ...

EyeQLenz™
├── Dark Gray
├── Brown
└── ...

Transitions® GEN S™
├── Gray
├── Dark Brown
└── ...

Standard
├── Gray
└── Brown

Blokz Photochromic
└── Gray
```

## Integration Examples

### Frontend Integration

```javascript
// Fetch prescription sun lenses
const response = await fetch('/api/prescription-sun-lenses');
const data = await response.json();

// Access polarized option
const polarized = data.data.polarized;
const classicFinish = polarized.finishes.find(f => f.name === 'Classic');
const colors = classicFinish.colors;

// Fetch photochromic lenses
const photochromicResponse = await fetch('/api/photochromic-lenses');
const photochromicData = await photochromicResponse.json();

// Access EyeQLenz with Guard
const eyeqlenzWithGuard = photochromicData.data.eyeqlenzWithGuard;
const colors = eyeqlenzWithGuard.colors;
```

### Admin Panel Integration

```javascript
// Create a new prescription sun lens
const createLens = async (lensData) => {
  const response = await fetch('/api/admin/prescription-sun-lenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(lensData)
  });
  return await response.json();
};

// Create a finish for the lens
const createFinish = async (finishData) => {
  const response = await fetch('/api/admin/lens-finishes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(finishData)
  });
  return await response.json();
};

// Create a color for the finish
const createColor = async (colorData) => {
  const response = await fetch('/api/admin/lens-colors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(colorData)
  });
  return await response.json();
};
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Notes

1. All prices are stored as Decimal in the database and returned as floats in JSON
2. Colors can belong to either a `LensOption`, `LensFinish`, or `PrescriptionLensType`, but only one at a time
3. Finishes belong to a `LensOption`
4. The `sort_order` field determines the display order
5. Only active items (`is_active: true`) are returned in public endpoints
6. Admin endpoints can access both active and inactive items

