# Quick Start: Add Progressive Variants via Admin

## 🎯 Goal
Add Progressive Lens Variants (Premium, Standard, Basic) that will appear on the frontend Progressive Lens Selection page.

---

## 📋 Step-by-Step Guide

### Step 1: Open Postman Collection

Open: `OptyShop_API.postman_collection.json`

---

### Step 2: Find Progressive Lens Type ID

**Use Postman Request:**
```
Admin > Prescription Lens Types (Admin) > Get All Prescription Lens Types
```

**URL:**
```
GET {{base_url}}/api/admin/prescription-lens-types?prescriptionType=progressive&isActive=true
```

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Response:**
```json
{
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 3,  // ← Save this ID!
        "name": "Progressive"
      }
    ]
  }
}
```

**Note:** Remember the `id` (usually `3` for Progressive)

---

### Step 3: Create Premium Progressive Variant

**Use Postman Request:**
```
Admin > Prescription Lens Variants (Admin) > Create Prescription Lens Variant
```

**URL:**
```
POST {{base_url}}/api/admin/prescription-lens-variants
```

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body (from Postman, update with these values):**
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

**Click Send** ✅

---

### Step 4: Create Standard Progressive Variant

**Same Postman Request** (Create Prescription Lens Variant)

**Body:**
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

**Click Send** ✅

---

### Step 5: Create Basic Progressive Variant

**Same Postman Request** (Create Prescription Lens Variant)

**Body:**
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

**Click Send** ✅

---

### Step 6: Verify Variants Created

**Use Postman Request:**
```
Admin > Prescription Lens Variants (Admin) > Get All Prescription Lens Variants
```

**URL:**
```
GET {{base_url}}/api/admin/prescription-lens-variants?prescriptionLensTypeId=3&isActive=true
```

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Response should show:**
```json
{
  "data": {
    "variants": [
      {
        "id": 1,
        "name": "Premium Progressive",
        "price": 150.00,
        "isRecommended": true
      },
      {
        "id": 2,
        "name": "Standard Progressive",
        "price": 100.00,
        "isRecommended": false
      },
      {
        "id": 3,
        "name": "Basic Progressive",
        "price": 75.00,
        "isRecommended": false
      }
    ]
  }
}
```

---

### Step 7: Test Frontend API

**Use Postman Request:**
```
Products > Get All Lens Types
```

**URL:**
```
GET {{base_url}}/api/products/configuration/lens-types
```

**Headers:**
```
None required (Public endpoint)
```

**Response should include:**
```json
{
  "data": {
    "lensTypes": [
      {
        "id": 3,
        "name": "Progressive",
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

**✅ Variants are now available on frontend!**

---

## 🎨 Frontend Display

The frontend Progressive Lens Selection page will now show:

1. **Premium Progressive** - $150.00 (with "Recommended" badge)
2. **Standard Progressive** - $100.00
3. **Basic Progressive** - $75.00

Each variant will display:
- Name
- Price
- Description
- Recommended badge (if `is_recommended: true`)

---

## 📝 Quick Reference

### Admin Endpoints (From Postman Collection)

| Action | Postman Request | Method | Endpoint |
|--------|----------------|--------|----------|
| Get Progressive Type ID | `Admin > Prescription Lens Types (Admin) > Get All Prescription Lens Types` | GET | `/api/admin/prescription-lens-types?prescriptionType=progressive` |
| Create Variant | `Admin > Prescription Lens Variants (Admin) > Create Prescription Lens Variant` | POST | `/api/admin/prescription-lens-variants` |
| Get All Variants | `Admin > Prescription Lens Variants (Admin) > Get All Prescription Lens Variants` | GET | `/api/admin/prescription-lens-variants?prescriptionLensTypeId=3` |
| Update Variant | `Admin > Prescription Lens Variants (Admin) > Update Prescription Lens Variant` | PUT | `/api/admin/prescription-lens-variants/{id}` |
| Delete Variant | `Admin > Prescription Lens Variants (Admin) > Delete Prescription Lens Variant` | DELETE | `/api/admin/prescription-lens-variants/{id}` |

### Frontend Endpoints (From Postman Collection)

| Action | Postman Request | Method | Endpoint |
|--------|----------------|--------|----------|
| Get All Lens Types | `Products > Get All Lens Types` | GET | `/api/products/configuration/lens-types` |
| Get Product Config | `Products > Get Product Configuration` | GET | `/api/products/{id}/configuration` |
| Get Variants by Type | `Lens Options & Treatments (Public) > Get Prescription Lens Variants by Type` | GET | `/api/lens/prescription-lens-types/3/variants` |

---

## ✅ Checklist

- [ ] Found Progressive Type ID (usually 3)
- [ ] Created Premium Progressive variant
- [ ] Created Standard Progressive variant
- [ ] Created Basic Progressive variant
- [ ] Verified variants in admin API
- [ ] Tested frontend API
- [ ] Variants appear on frontend

---

## 🚀 That's It!

The backend is **100% ready**. Just use the Postman collection to add variants, and they'll automatically appear on the frontend Progressive Lens Selection page!

All endpoints are already in your Postman collection. Just follow the steps above! 🎉

