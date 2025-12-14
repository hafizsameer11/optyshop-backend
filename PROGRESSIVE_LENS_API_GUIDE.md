# Progressive Lens Selection - API Guide

## 🎯 Based on Your UI Image

The image shows a **Progressive Lens Selection** page where it displays "No progressive options available". Here's the complete API flow:

---

## 📋 API Endpoints Used

### 1. Get Product Configuration (Initial Load)

**Endpoint:**
```
GET /api/products/:id/configuration
```

**Example:**
```
GET http://localhost:5000/api/products/89/configuration
```

**Response:**
```json
{
  "success": true,
  "message": "Product configuration retrieved successfully",
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
            "name": "Premium",
            "slug": "premium",
            "description": "Up to 40% wider viewing areas than Standard",
            "price": 52.95,
            "isRecommended": true,
            "viewingRange": "Wide",
            "useCases": "Maximum comfort & balanced vision"
          },
          {
            "id": 2,
            "name": "Standard",
            "slug": "standard",
            "description": "Perfect for everyday tasks",
            "price": 37.95,
            "isRecommended": false,
            "viewingRange": "Standard",
            "useCases": "Comfortable and well-balanced view"
          }
        ],
        "colors": []
      }
    ],
    "lensThicknessMaterials": [...],
    "lensThicknessOptions": [...],
    "lensTreatments": [...],
    "photochromicColors": [...],
    "prescriptionSunColors": [...]
  }
}
```

**Frontend Code:**
```javascript
// When user clicks "Select Lenses" button
const productId = 89; // From URL or state

const response = await fetch(
  `http://localhost:5000/api/products/${productId}/configuration`
);
const data = await response.json();

if (data.success) {
  const progressiveType = data.data.prescriptionLensTypes.find(
    type => type.slug === 'progressive'
  );
  
  if (progressiveType && progressiveType.variants.length > 0) {
    // Show variants
    setProgressiveVariants(progressiveType.variants);
  } else {
    // Show "No progressive options available" message
    setNoVariantsMessage(true);
  }
}
```

---

### 2. Get Prescription Lens Variants (Alternative)

**Endpoint:**
```
GET /api/lens/prescription-lens-types/:typeId/variants
```

**Example:**
```
GET http://localhost:5000/api/lens/prescription-lens-types/3/variants
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
        "isActive": true
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
        "isActive": true
      }
    ],
    "count": 2
  }
}
```

---

### 3. Get All Prescription Lens Types (Alternative)

**Endpoint:**
```
GET /api/lens/prescription-lens-types
```

**Example:**
```
GET http://localhost:5000/api/lens/prescription-lens-types
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription lens types retrieved successfully",
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 1,
        "name": "Distance Vision",
        "prescriptionType": "single_vision",
        "basePrice": 60.00,
        "variants": []
      },
      {
        "id": 2,
        "name": "Near Vision",
        "prescriptionType": "single_vision",
        "basePrice": 60.00,
        "variants": []
      },
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
    ],
    "count": 3
  }
}
```

---

## 🔧 Admin API - Add Progressive Variants

### Create Progressive Lens Variant (Admin)

**Endpoint:**
```
POST /api/admin/prescription-lens-variants
```

**Request:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Premium",
  "slug": "premium",
  "description": "Up to 40% wider viewing areas than Standard. Maximum comfort & balanced vision.",
  "price": 52.95,
  "is_recommended": true,
  "viewing_range": "Wide",
  "use_cases": "Maximum comfort & balanced vision",
  "is_active": true,
  "sort_order": 1
}
```

**Example Request:**
```javascript
// Admin panel - Add Progressive Variant
const response = await fetch(
  'http://localhost:5000/api/admin/prescription-lens-variants',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      prescription_lens_type_id: 3, // Progressive lens type ID
      name: "Premium",
      slug: "premium",
      description: "Up to 40% wider viewing areas than Standard",
      price: 52.95,
      is_recommended: true,
      viewing_range: "Wide",
      use_cases: "Maximum comfort & balanced vision",
      is_active: true,
      sort_order: 1
    })
  }
);
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
      "sortOrder": 1
    }
  }
}
```

---

## 📊 Complete Flow Explanation

### Step-by-Step Flow:

```
1. User selects product "Beatrice Holloway" (ID: 89)
   ↓
2. User clicks "Select Lenses" button
   ↓
3. Frontend calls: GET /api/products/89/configuration
   ↓
4. Backend returns all lens configuration options
   ↓
5. User selects "Progressive" lens type
   ↓
6. Frontend checks: prescriptionLensTypes[2].variants.length
   ↓
7a. If variants.length > 0:
    → Display variants (Premium, Standard, etc.)
    → User selects variant
    → Continue to prescription form
   
7b. If variants.length === 0:
    → Show "No progressive options available"
    → Show message: "Please check the admin panel..."
    → Admin needs to add variants via POST /api/admin/prescription-lens-variants
```

---

## 🎨 Frontend Implementation

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const ProgressiveLensSelection = ({ productId, onContinue }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productConfig, setProductConfig] = useState(null);

  useEffect(() => {
    fetchProgressiveVariants();
  }, [productId]);

  const fetchProgressiveVariants = async () => {
    try {
      // Option 1: Get full product configuration
      const response = await fetch(
        `http://localhost:5000/api/products/${productId}/configuration`
      );
      const data = await response.json();

      if (data.success) {
        setProductConfig(data.data);
        
        // Find Progressive lens type
        const progressiveType = data.data.prescriptionLensTypes.find(
          type => type.slug === 'progressive'
        );

        if (progressiveType && progressiveType.variants.length > 0) {
          setVariants(progressiveType.variants);
        } else {
          setVariants([]); // No variants available
        }
      }
    } catch (error) {
      console.error('Error fetching progressive variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedVariant) {
      onContinue({
        lens_type: 'progressive',
        progressive_variant_id: selectedVariant.id,
        // ... other configuration
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="progressive-lens-selection">
      <div className="header">
        <button onClick={onBack}>← Progressive</button>
        <h2>Progressives (For two powers in same lenses)</h2>
      </div>

      {variants.length === 0 ? (
        <div className="no-variants">
          <p className="message">No progressive options available</p>
          <p className="instruction">
            Please check the admin panel to ensure variants are added and active.
          </p>
        </div>
      ) : (
        <div className="variants-list">
          {variants.map(variant => (
            <div
              key={variant.id}
              className={`variant-card ${selectedVariant?.id === variant.id ? 'selected' : ''}`}
              onClick={() => setSelectedVariant(variant)}
            >
              <div className="variant-header">
                <h3>{variant.name}</h3>
                {variant.isRecommended && (
                  <span className="badge">Recommended</span>
                )}
              </div>
              <p className="price">${variant.price}</p>
              <p className="description">{variant.description}</p>
              {variant.viewingRange && (
                <p className="viewing-range">Viewing Range: {variant.viewingRange}</p>
              )}
              {variant.useCases && (
                <p className="use-cases">{variant.useCases}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        className="continue-btn"
        onClick={handleContinue}
        disabled={variants.length === 0 || !selectedVariant}
      >
        Continue
      </button>
    </div>
  );
};

export default ProgressiveLensSelection;
```

---

## 🔧 Admin Panel - Add Variants

### Complete Admin API Flow

**1. Get Prescription Lens Types (to find Progressive ID):**
```
GET /api/admin/prescription-lens-types
```

**2. Create Progressive Variant:**
```
POST /api/admin/prescription-lens-variants
Body: {
  "prescription_lens_type_id": 3,
  "name": "Premium",
  "price": 52.95,
  "is_recommended": true,
  "is_active": true
}
```

**3. Create More Variants:**
```javascript
// Standard
{
  "prescription_lens_type_id": 3,
  "name": "Standard",
  "price": 37.95,
  "is_recommended": false,
  "is_active": true
}

// Mid-Range
{
  "prescription_lens_type_id": 3,
  "name": "Mid-Range",
  "price": 37.95,
  "description": "Clear vision within 14 ft, ideal for work, dining out or watching TV. Not for driving.",
  "is_active": true
}

// Near-Range
{
  "prescription_lens_type_id": 3,
  "name": "Near-Range",
  "price": 37.95,
  "description": "Clear vision within 3 ft, ideal for reading and heavy screen use. Not for driving.",
  "is_active": true
}
```

---

## 📝 API Summary for Progressive Lens Page

### Public Endpoints (No Auth Required)

1. **Get Product Configuration**
   ```
   GET /api/products/:id/configuration
   ```
   - Returns all lens types with variants
   - Use this to check if progressive variants exist

2. **Get Prescription Lens Types**
   ```
   GET /api/lens/prescription-lens-types
   ```
   - Returns all prescription lens types
   - Filter for progressive type

3. **Get Progressive Variants**
   ```
   GET /api/lens/prescription-lens-types/:typeId/variants
   ```
   - Get variants for specific lens type

### Admin Endpoints (Auth Required)

1. **Get All Prescription Lens Variants**
   ```
   GET /api/admin/prescription-lens-variants?prescriptionLensTypeId=3
   ```

2. **Create Progressive Variant**
   ```
   POST /api/admin/prescription-lens-variants
   ```

3. **Update Variant**
   ```
   PUT /api/admin/prescription-lens-variants/:id
   ```

4. **Delete Variant**
   ```
   DELETE /api/admin/prescription-lens-variants/:id
   ```

---

## 🎯 Quick Fix for "No Variants Available"

### Step 1: Check if Progressive Lens Type Exists

```javascript
GET /api/admin/prescription-lens-types
// Look for one with name "Progressive" or prescriptionType "progressive"
// Note the ID (e.g., 3)
```

### Step 2: Add Progressive Variants

```javascript
POST /api/admin/prescription-lens-variants
Authorization: Bearer <admin_token>
Content-Type: application/json

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

### Step 3: Verify Variants Are Active

```javascript
GET /api/products/89/configuration
// Check if variants appear in response
```

---

## ✅ Complete API Flow Diagram

```
┌─────────────────────────────────────┐
│  User on Product Page               │
│  Product: "Beatrice Holloway" (ID:89)│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  GET /api/products/89/configuration │
│  (No auth required)                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Response:                           │
│  - prescriptionLensTypes[]           │
│  - Find: type.slug === "progressive" │
│  - Check: type.variants.length       │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   Has Variants   No Variants
        │             │
        │             ▼
        │    ┌────────────────────┐
        │    │ Show "No variants"   │
        │    │ message              │
        │    └────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  Display Variants:                  │
│  - Premium ($52.95) [Recommended]   │
│  - Standard ($37.95)                 │
│  - Mid-Range ($37.95)                │
│  - Near-Range ($37.95)               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  User Selects Variant                 │
│  selectedVariant = { id: 1, ... }    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Click "Continue"                    │
│  → Go to Prescription Form           │
└─────────────────────────────────────┘
```

---

## 🔍 Debugging "No Variants Available"

### Check 1: Variants Exist in Database
```sql
SELECT * FROM prescription_lens_variants 
WHERE prescription_lens_type_id = 3 
AND is_active = 1;
```

### Check 2: API Returns Variants
```javascript
// Test endpoint
GET /api/lens/prescription-lens-types/3/variants

// Should return variants if they exist and are active
```

### Check 3: Variants Are Active
```javascript
// Check variant is_active flag
GET /api/admin/prescription-lens-variants?prescriptionLensTypeId=3

// Verify is_active: true for all variants you want to show
```

---

## 📱 Complete Example Request/Response

### Request: Get Product Configuration
```http
GET /api/products/89/configuration HTTP/1.1
Host: localhost:5000
```

### Response: With Variants
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
          },
          {
            "id": 2,
            "name": "Standard",
            "price": 37.95,
            "isRecommended": false
          }
        ]
      }
    ]
  }
}
```

### Response: No Variants (Current Issue)
```json
{
  "success": true,
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 3,
        "name": "Progressive",
        "variants": []  // ← Empty array = No variants
      }
    ]
  }
}
```

---

## 🚀 Quick Solution

**To fix the "No progressive options available" message:**

1. **Login as Admin:**
   ```
   POST /api/auth/login
   Body: { "email": "admin@example.com", "password": "..." }
   ```

2. **Get Progressive Lens Type ID:**
   ```
   GET /api/admin/prescription-lens-types
   Find: { name: "Progressive", id: 3 }
   ```

3. **Add Variants:**
   ```
   POST /api/admin/prescription-lens-variants
   Body: {
     "prescription_lens_type_id": 3,
     "name": "Premium",
     "price": 52.95,
     "is_recommended": true,
     "is_active": true
   }
   ```

4. **Refresh Frontend:**
   - Call `GET /api/products/89/configuration` again
   - Variants should now appear!

---

This guide covers all the APIs needed for the Progressive Lens Selection page! 🎯

