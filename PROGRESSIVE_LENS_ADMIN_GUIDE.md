# Progressive Lens Variants - Admin & Frontend Integration Guide

## 🎯 Overview

This guide shows how **admins can manually add Progressive Lens Variants** (Premium, Standard, Basic) through the admin panel, and how these variants appear on the frontend Progressive Lens Selection page.

---

## 📋 Backend Status

✅ **All backend endpoints are ready!**

- Admin endpoints for CRUD operations
- Public endpoints to fetch variants
- Database models configured
- Routes properly connected

---

## 🔧 Admin Panel - Adding Progressive Variants

### Step 1: Find Progressive Lens Type ID

**API Endpoint:**
```
GET /api/admin/prescription-lens-types?prescriptionType=progressive
```

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 3,  // ← Use this ID
        "name": "Progressive",
        "slug": "progressive",
        "prescriptionType": "progressive"
      }
    ]
  }
}
```

**Note:** Save the `id` (e.g., `3`) - you'll need it for creating variants.

---

### Step 2: Create Progressive Variants

**API Endpoint:**
```
POST /api/admin/prescription-lens-variants
```

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

#### Variant 1: Premium Progressive

**Request Body:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Premium Progressive",
  "slug": "premium-progressive",
  "description": "High-quality progressive lenses with advanced technology",
  "price": 150.00,
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
      "name": "Premium Progressive",
      "slug": "premium-progressive",
      "description": "High-quality progressive lenses with advanced technology",
      "price": 150.00,
      "isRecommended": true,
      "viewingRange": "Wide",
      "useCases": "Maximum comfort & balanced vision",
      "isActive": true,
      "sortOrder": 1
    }
  }
}
```

---

#### Variant 2: Standard Progressive

**Request Body:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Standard Progressive",
  "slug": "standard-progressive",
  "description": "Standard progressive lenses for everyday use",
  "price": 100.00,
  "is_recommended": false,
  "viewing_range": "Standard",
  "use_cases": "Perfect for everyday tasks",
  "is_active": true,
  "sort_order": 2
}
```

---

#### Variant 3: Basic Progressive

**Request Body:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Basic Progressive",
  "slug": "basic-progressive",
  "description": "Affordable progressive lens option",
  "price": 75.00,
  "is_recommended": false,
  "viewing_range": "Basic",
  "use_cases": "Budget-friendly option",
  "is_active": true,
  "sort_order": 3
}
```

---

### Step 3: Verify Variants Created

**API Endpoint:**
```
GET /api/admin/prescription-lens-variants?prescriptionLensTypeId=3&isActive=true
```

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "variants": [
      {
        "id": 1,
        "name": "Premium Progressive",
        "price": 150.00,
        "isRecommended": true,
        "description": "High-quality progressive lenses with advanced technology"
      },
      {
        "id": 2,
        "name": "Standard Progressive",
        "price": 100.00,
        "isRecommended": false,
        "description": "Standard progressive lenses for everyday use"
      },
      {
        "id": 3,
        "name": "Basic Progressive",
        "price": 75.00,
        "isRecommended": false,
        "description": "Affordable progressive lens option"
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

## 🌐 Frontend - Getting Progressive Variants

### Option 1: Get All Lens Types (Recommended)

**API Endpoint:**
```
GET /api/products/configuration/lens-types
```

**Headers:**
```
None required (Public endpoint)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lensTypes": [
      {
        "id": 3,
        "name": "Progressive",
        "slug": "progressive",
        "description": "Progressives (For two powers in same lenses)",
        "prescriptionType": "progressive",
        "basePrice": 60.00,
        "variants": [
          {
            "id": 1,
            "name": "Premium Progressive",
            "slug": "premium-progressive",
            "description": "High-quality progressive lenses with advanced technology",
            "price": 150.00,
            "isRecommended": true,
            "viewingRange": "Wide",
            "useCases": "Maximum comfort & balanced vision"
          },
          {
            "id": 2,
            "name": "Standard Progressive",
            "slug": "standard-progressive",
            "description": "Standard progressive lenses for everyday use",
            "price": 100.00,
            "isRecommended": false,
            "viewingRange": "Standard",
            "useCases": "Perfect for everyday tasks"
          },
          {
            "id": 3,
            "name": "Basic Progressive",
            "slug": "basic-progressive",
            "description": "Affordable progressive lens option",
            "price": 75.00,
            "isRecommended": false,
            "viewingRange": "Basic",
            "useCases": "Budget-friendly option"
          }
        ]
      }
    ]
  }
}
```

**Frontend Usage:**
```javascript
// Find Progressive lens type
const progressive = response.data.lensTypes.find(
  type => type.slug === 'progressive'
);

// Display variants
progressive.variants.forEach(variant => {
  console.log(variant.name);      // "Premium Progressive"
  console.log(variant.price);     // 150.00
  console.log(variant.isRecommended); // true
  console.log(variant.description); // "High-quality progressive lenses..."
});
```

---

### Option 2: Get Variants for Specific Type

**API Endpoint:**
```
GET /api/lens/prescription-lens-types/3/variants
```

**Headers:**
```
None required (Public endpoint)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prescriptionLensType": {
      "id": 3,
      "name": "Progressive",
      "slug": "progressive"
    },
    "variants": [
      {
        "id": 1,
        "name": "Premium Progressive",
        "slug": "premium-progressive",
        "description": "High-quality progressive lenses with advanced technology",
        "price": 150.00,
        "isRecommended": true,
        "viewingRange": "Wide",
        "useCases": "Maximum comfort & balanced vision",
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": 2,
        "name": "Standard Progressive",
        "slug": "standard-progressive",
        "description": "Standard progressive lenses for everyday use",
        "price": 100.00,
        "isRecommended": false,
        "viewingRange": "Standard",
        "useCases": "Perfect for everyday tasks",
        "isActive": true,
        "sortOrder": 2
      },
      {
        "id": 3,
        "name": "Basic Progressive",
        "slug": "basic-progressive",
        "description": "Affordable progressive lens option",
        "price": 75.00,
        "isRecommended": false,
        "viewingRange": "Basic",
        "useCases": "Budget-friendly option",
        "isActive": true,
        "sortOrder": 3
      }
    ],
    "count": 3
  }
}
```

---

### Option 3: Get Product Configuration

**API Endpoint:**
```
GET /api/products/{productId}/configuration
```

**Headers:**
```
None required (Public endpoint)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 89,
      "name": "Beatrice Holloway",
      "price": 197.00
    },
    "prescriptionLensTypes": [
      {
        "id": 3,
        "name": "Progressive",
        "slug": "progressive",
        "description": "Progressives (For two powers in same lenses)",
        "prescriptionType": "progressive",
        "basePrice": 60.00,
        "variants": [
          {
            "id": 1,
            "name": "Premium Progressive",
            "price": 150.00,
            "isRecommended": true,
            "description": "High-quality progressive lenses with advanced technology"
          },
          {
            "id": 2,
            "name": "Standard Progressive",
            "price": 100.00,
            "isRecommended": false,
            "description": "Standard progressive lenses for everyday use"
          },
          {
            "id": 3,
            "name": "Basic Progressive",
            "price": 75.00,
            "isRecommended": false,
            "description": "Affordable progressive lens option"
          }
        ]
      }
    ]
  }
}
```

---

## 🎨 Frontend Display Format

Based on your UI image, here's how to display each variant:

### Variant Card Structure

```javascript
{
  id: 1,
  name: "Premium Progressive",           // Display as title
  price: 150.00,                         // Display as "$150.00"
  isRecommended: true,                    // Show "Recommended" badge if true
  description: "High-quality progressive lenses with advanced technology", // Display below name
  viewingRange: "Wide",                   // Optional: Display if available
  useCases: "Maximum comfort & balanced vision" // Optional: Display if available
}
```

### Example React Component

```jsx
const ProgressiveVariantCard = ({ variant, isSelected, onSelect }) => {
  return (
    <div 
      className={`variant-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(variant)}
    >
      <div className="variant-header">
        <h3>{variant.name}</h3>
        {variant.isRecommended && (
          <span className="recommended-badge">Recommended</span>
        )}
      </div>
      <div className="variant-price">${variant.price.toFixed(2)}</div>
      <p className="variant-description">{variant.description}</p>
      {variant.useCases && (
        <p className="variant-use-cases">{variant.useCases}</p>
      )}
      <div className="variant-arrow">→</div>
    </div>
  );
};
```

---

## 📝 Complete Admin Workflow

### 1. Login as Admin
- Get admin JWT token
- Store in `admin_token` variable

### 2. Find Progressive Type ID
```bash
GET /api/admin/prescription-lens-types?prescriptionType=progressive
```
- Note the `id` (e.g., `3`)

### 3. Create Variants
```bash
POST /api/admin/prescription-lens-variants
```
- Create Premium Progressive (is_recommended: true)
- Create Standard Progressive
- Create Basic Progressive

### 4. Verify Creation
```bash
GET /api/admin/prescription-lens-variants?prescriptionLensTypeId=3
```

### 5. Test Frontend
```bash
GET /api/products/configuration/lens-types
```
- Check that variants appear in response

---

## 🔄 Update Variant (Admin)

**API Endpoint:**
```
PUT /api/admin/prescription-lens-variants/{id}
```

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Premium Progressive Updated",
  "price": 155.00,
  "is_recommended": true,
  "description": "Updated description",
  "is_active": true
}
```

---

## 🗑️ Delete Variant (Admin)

**API Endpoint:**
```
DELETE /api/admin/prescription-lens-variants/{id}
```

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription lens variant deleted successfully"
}
```

---

## ✅ Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prescription_lens_type_id` | Integer | ✅ Yes | ID of Progressive lens type (usually 3) |
| `name` | String | ✅ Yes | Variant name (e.g., "Premium Progressive") |
| `slug` | String | ❌ No | Auto-generated from name if not provided |
| `description` | String | ❌ No | Variant description |
| `price` | Decimal | ✅ Yes | Price of the variant |
| `is_recommended` | Boolean | ❌ No | Show "Recommended" badge (default: false) |
| `viewing_range` | String | ❌ No | Viewing range description |
| `use_cases` | String | ❌ No | Use cases description |
| `is_active` | Boolean | ❌ No | Active status (default: true) |
| `sort_order` | Integer | ❌ No | Display order (default: 0) |

---

## 🚀 Quick Start

1. **Admin adds variants** → Use `POST /api/admin/prescription-lens-variants`
2. **Frontend fetches variants** → Use `GET /api/products/configuration/lens-types`
3. **Display variants** → Map through `variants` array
4. **User selects variant** → Store `variant.id` for cart

---

## 📌 Important Notes

- ✅ All variants must have `is_active: true` to appear on frontend
- ✅ Variants are sorted by `sort_order` then `created_at`
- ✅ Only active variants are returned in public endpoints
- ✅ `is_recommended: true` shows "Recommended" badge
- ✅ Price is in decimal format (e.g., 150.00)

---

## 🎯 Summary

**Backend is 100% ready!** Admins can:
- ✅ Add Progressive variants via admin API
- ✅ Update variants
- ✅ Delete variants
- ✅ View all variants

**Frontend can:**
- ✅ Fetch all variants via public API
- ✅ Display variants with name, price, description
- ✅ Show "Recommended" badge for recommended variants
- ✅ Handle variant selection

Everything is connected and working! 🎉

