# APIs from Postman Collection - Progressive Lens Selection

## 🎯 Exact APIs Found in Your Postman Collection

Based on your Postman collection, here are the **exact APIs** to use for the Progressive Lens Selection page:

---

## 📡 Public APIs (No Authentication Required)

### 1. Get Product Configuration
**From Postman Collection:** `Products > Get Product Configuration`

**Endpoint:**
```
GET {{base_url}}/api/products/89/configuration
```

**Headers:**
```
None required
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 3,
        "name": "Progressive",
        "variants": [
          {
            "id": 1,
            "name": "Premium",
            "price": 52.95,
            "isRecommended": true
          }
        ]
      }
    ]
  }
}
```

**Use This When:**
- User clicks "Select Lenses" on product page
- Need all configuration options for a product

---

### 2. Get All Lens Types
**From Postman Collection:** `Products > Get All Lens Types`

**Endpoint:**
```
GET {{base_url}}/api/products/configuration/lens-types
```

**Headers:**
```
None required
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
        "prescriptionType": "progressive",
        "variants": [...]
      }
    ]
  }
}
```

---

### 3. Get Prescription Lens Types
**From Postman Collection:** `Lens Options & Treatments (Public) > Get Prescription Lens Types`

**Endpoint:**
```
GET {{base_url}}/api/lens/prescription-lens-types
```

**Headers:**
```
None required
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 3,
        "name": "Progressive",
        "prescriptionType": "progressive",
        "basePrice": 60.00,
        "variants": [
          {
            "id": 1,
            "name": "Premium",
            "price": 52.95,
            "isRecommended": true
          }
        ]
      }
    ]
  }
}
```

---

### 4. Get Prescription Lens Type by ID
**From Postman Collection:** `Lens Options & Treatments (Public) > Get Prescription Lens Type by ID`

**Endpoint:**
```
GET {{base_url}}/api/lens/prescription-lens-types/3
```

**Headers:**
```
None required
```

**Use This When:**
- You know the Progressive lens type ID (e.g., 3)
- Want to get variants for specific type

---

### 5. Get Prescription Lens Variants by Type
**From Postman Collection:** `Lens Options & Treatments (Public) > Get Prescription Lens Variants by Type`

**Endpoint:**
```
GET {{base_url}}/api/lens/prescription-lens-types/3/variants
```

**Headers:**
```
None required
```

**Response:**
```json
{
  "success": true,
  "data": {
    "variants": [
      {
        "id": 1,
        "name": "Premium",
        "price": 52.95,
        "isRecommended": true,
        "viewingRange": "Wide",
        "useCases": "Maximum comfort & balanced vision"
      },
      {
        "id": 2,
        "name": "Standard",
        "price": 37.95,
        "isRecommended": false
      }
    ],
    "count": 2
  }
}
```

**Use This When:**
- User selects "Progressive" lens type
- Need to show variants (Premium, Standard, etc.)
- **This is the key API for your Progressive selection page!**

---

### 6. Get Prescription Lens Variant by ID
**From Postman Collection:** `Lens Options & Treatments (Public) > Get Prescription Lens Variant by ID`

**Endpoint:**
```
GET {{base_url}}/api/lens/prescription-lens-variants/1
```

**Headers:**
```
None required
```

---

## 🔧 Admin APIs (Authentication Required)

### 7. Get All Prescription Lens Types (Admin)
**From Postman Collection:** `Admin > Prescription Lens Types (Admin) > Get All Prescription Lens Types`

**Endpoint:**
```
GET {{base_url}}/api/admin/prescription-lens-types?page=1&limit=50&prescriptionType=progressive&isActive=true
```

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `prescriptionType`: Filter by type (`single_vision`, `bifocal`, `trifocal`, `progressive`)
- `isActive`: Filter by active status (`true`/`false`)

**Use This When:**
- Admin wants to see all prescription lens types
- Need to find Progressive type ID

---

### 8. Create Prescription Lens Type (Admin)
**From Postman Collection:** `Admin > Prescription Lens Types (Admin) > Create Prescription Lens Type`

**Endpoint:**
```
POST {{base_url}}/api/admin/prescription-lens-types
```

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Progressive",
  "slug": "progressive",
  "description": "Progressives (For two powers in same lenses)",
  "prescription_type": "progressive",
  "base_price": 60.00,
  "is_active": true,
  "sort_order": 0
}
```

---

### 9. Get All Prescription Lens Variants (Admin)
**From Postman Collection:** `Admin > Prescription Lens Variants (Admin) > Get All Prescription Lens Variants`

**Endpoint:**
```
GET {{base_url}}/api/admin/prescription-lens-variants?page=1&limit=50&prescriptionLensTypeId=3&isActive=true&isRecommended=false
```

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `prescriptionLensTypeId`: Filter by lens type ID (e.g., 3 for Progressive)
- `isActive`: Filter by active status
- `isRecommended`: Filter by recommended status

**Use This When:**
- Admin wants to see all variants
- Check if variants exist for Progressive type

---

### 10. Create Prescription Lens Variant (Admin) ⭐ KEY API
**From Postman Collection:** `Admin > Prescription Lens Variants (Admin) > Create Prescription Lens Variant`

**Endpoint:**
```
POST {{base_url}}/api/admin/prescription-lens-variants
```

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Request Body (From Postman):**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Premium",
  "slug": "premium",
  "description": "Up to 40% wider viewing areas than Standard. Maximum comfort & balanced vision.",
  "price": 52.95,
  "is_recommended": true,
  "viewing_range": null,
  "use_cases": "Maximum comfort & balanced vision",
  "is_active": true,
  "sort_order": 0
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
      "price": 52.95,
      "isRecommended": true
    }
  }
}
```

**Use This When:**
- Admin needs to add Progressive variants
- **This fixes the "No progressive options available" message!**

---

### 11. Update Prescription Lens Variant (Admin)
**From Postman Collection:** `Admin > Prescription Lens Variants (Admin) > Update Prescription Lens Variant`

**Endpoint:**
```
PUT {{base_url}}/api/admin/prescription-lens-variants/1
```

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Request Body (From Postman):**
```json
{
  "name": "Premium Updated",
  "price": 55.00,
  "is_recommended": true,
  "is_active": true
}
```

---

### 12. Delete Prescription Lens Variant (Admin)
**From Postman Collection:** `Admin > Prescription Lens Variants (Admin) > Delete Prescription Lens Variant`

**Endpoint:**
```
DELETE {{base_url}}/api/admin/prescription-lens-variants/1
```

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

---

## 🎯 Complete Flow Using Postman Collection APIs

### Step 1: Frontend - Get Product Configuration
**Use:** `Products > Get Product Configuration`

```javascript
GET {{base_url}}/api/products/89/configuration
```

**Check Response:**
```javascript
const progressive = response.data.prescriptionLensTypes.find(
  type => type.slug === 'progressive'
);

if (progressive.variants.length === 0) {
  // Show "No progressive options available"
}
```

---

### Step 2: Admin - Find Progressive Type ID
**Use:** `Admin > Prescription Lens Types (Admin) > Get All Prescription Lens Types`

```javascript
GET {{base_url}}/api/admin/prescription-lens-types?prescriptionType=progressive
Authorization: Bearer {{admin_token}}
```

**Find the ID:**
```json
{
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 3,  // ← Use this ID
        "name": "Progressive"
      }
    ]
  }
}
```

---

### Step 3: Admin - Add Progressive Variants
**Use:** `Admin > Prescription Lens Variants (Admin) > Create Prescription Lens Variant`

**Create Premium:**
```json
POST {{base_url}}/api/admin/prescription-lens-variants
Authorization: Bearer {{admin_token}}

{
  "prescription_lens_type_id": 3,
  "name": "Premium",
  "slug": "premium",
  "description": "Up to 40% wider viewing areas than Standard",
  "price": 52.95,
  "is_recommended": true,
  "is_active": true,
  "sort_order": 1
}
```

**Create Standard:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Standard",
  "slug": "standard",
  "description": "Perfect for everyday tasks",
  "price": 37.95,
  "is_recommended": false,
  "is_active": true,
  "sort_order": 2
}
```

**Create Mid-Range:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Mid-Range",
  "slug": "mid-range",
  "description": "Clear vision within 14 ft, ideal for work, dining out or watching TV. Not for driving.",
  "price": 37.95,
  "is_active": true,
  "sort_order": 3
}
```

**Create Near-Range:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Near-Range",
  "slug": "near-range",
  "description": "Clear vision within 3 ft, ideal for reading and heavy screen use. Not for driving.",
  "price": 37.95,
  "is_active": true,
  "sort_order": 4
}
```

---

### Step 4: Frontend - Get Variants (After Admin Adds)
**Use:** `Lens Options & Treatments (Public) > Get Prescription Lens Variants by Type`

```javascript
GET {{base_url}}/api/lens/prescription-lens-types/3/variants
```

**Now variants will appear!**

---

## 📋 Quick Reference - All APIs from Postman

### For Your Progressive Lens Page:

**Frontend APIs (No Auth):**
1. ✅ `GET /api/products/89/configuration` - Get all config
2. ✅ `GET /api/lens/prescription-lens-types/3/variants` - Get variants

**Admin APIs (Auth Required):**
1. ✅ `GET /api/admin/prescription-lens-types` - Find Progressive ID
2. ✅ `POST /api/admin/prescription-lens-variants` - Add variants
3. ✅ `GET /api/admin/prescription-lens-variants?prescriptionLensTypeId=3` - Check variants

---

## 🚀 Quick Fix Steps Using Postman

1. **Open Postman Collection**
2. **Go to:** `Admin > Prescription Lens Variants (Admin) > Create Prescription Lens Variant`
3. **Set Variables:**
   - `base_url`: http://localhost:5000
   - `admin_token`: Your admin JWT token
4. **Update Request Body:**
   ```json
   {
     "prescription_lens_type_id": 3,
     "name": "Premium",
     "price": 52.95,
     "is_recommended": true,
     "is_active": true
   }
   ```
5. **Click Send**
6. **Repeat for:** Standard, Mid-Range, Near-Range
7. **Test Frontend:** Use `Products > Get Product Configuration`
8. **Variants should now appear!**

---

## ✅ Summary

**All these APIs are already in your Postman collection!**

- **Frontend:** Use `Get Product Configuration` or `Get Prescription Lens Variants by Type`
- **Admin:** Use `Create Prescription Lens Variant` to add variants
- **Fix "No variants":** Add variants via Admin API, then refresh frontend

The Postman collection has everything you need! 🎯

