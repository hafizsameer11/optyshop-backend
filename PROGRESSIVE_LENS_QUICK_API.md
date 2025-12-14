# Progressive Lens Selection - Quick API Reference

## 🎯 For Your UI Page

Based on your image showing "No progressive options available", here are the exact APIs:

---

## 📡 Main API Endpoint (Frontend)

### Get Product Configuration
```
GET /api/products/:id/configuration
```

**Example:**
```javascript
// When user clicks "Select Lenses" on product page
const productId = 89; // Beatrice Holloway

fetch(`http://localhost:5000/api/products/${productId}/configuration`)
  .then(res => res.json())
  .then(data => {
    // Find Progressive lens type
    const progressive = data.data.prescriptionLensTypes.find(
      t => t.slug === 'progressive'
    );
    
    // Check if variants exist
    if (progressive && progressive.variants.length > 0) {
      // Show variants: Premium, Standard, etc.
      displayVariants(progressive.variants);
    } else {
      // Show "No progressive options available"
      showNoVariantsMessage();
    }
  });
```

**Response Structure:**
```json
{
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

---

## 🔧 Admin API - Fix "No Variants Available"

### Step 1: Get Progressive Lens Type ID
```
GET /api/admin/prescription-lens-types
Authorization: Bearer <admin_token>
```

**Find the Progressive type:**
```json
{
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 3,  // ← Use this ID
        "name": "Progressive",
        "prescriptionType": "progressive"
      }
    ]
  }
}
```

### Step 2: Add Progressive Variants
```
POST /api/admin/prescription-lens-variants
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body Examples:**

**Premium Variant:**
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

**Standard Variant:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Standard",
  "slug": "standard",
  "description": "Perfect for everyday tasks, offering a comfortable and well-balanced view.",
  "price": 37.95,
  "is_recommended": false,
  "viewing_range": "Standard",
  "use_cases": "Comfortable and well-balanced view",
  "is_active": true,
  "sort_order": 2
}
```

**Mid-Range Variant:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Mid-Range",
  "slug": "mid-range",
  "description": "Clear vision within 14 ft, ideal for work, dining out or watching TV. Not for driving.",
  "price": 37.95,
  "is_recommended": false,
  "viewing_range": "14 ft",
  "use_cases": "Work, dining out, watching TV. Not for driving.",
  "is_active": true,
  "sort_order": 3
}
```

**Near-Range Variant:**
```json
{
  "prescription_lens_type_id": 3,
  "name": "Near-Range",
  "slug": "near-range",
  "description": "Clear vision within 3 ft, ideal for reading and heavy screen use. Not for driving.",
  "price": 37.95,
  "is_recommended": false,
  "viewing_range": "3 ft",
  "use_cases": "Reading and heavy screen use. Not for driving.",
  "is_active": true,
  "sort_order": 4
}
```

---

## 📋 Complete API List

### Frontend APIs (No Auth)

1. **Get Product Configuration**
   ```
   GET /api/products/89/configuration
   ```
   - Returns all lens types with variants
   - Use to check if progressive variants exist

2. **Get All Prescription Lens Types**
   ```
   GET /api/lens/prescription-lens-types
   ```
   - Alternative way to get progressive variants

3. **Get Variants for Specific Type**
   ```
   GET /api/lens/prescription-lens-types/3/variants
   ```
   - Get variants for progressive (type ID 3)

### Admin APIs (Auth Required)

1. **Get All Variants**
   ```
   GET /api/admin/prescription-lens-variants?prescriptionLensTypeId=3
   ```

2. **Create Variant**
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

## 🎯 Quick Fix Steps

**To resolve "No progressive options available":**

1. **Login as Admin**
   ```javascript
   POST /api/auth/login
   { "email": "admin@example.com", "password": "..." }
   ```

2. **Get Progressive Type ID**
   ```javascript
   GET /api/admin/prescription-lens-types
   // Find: { name: "Progressive", id: 3 }
   ```

3. **Add Variants (use Postman or Admin Panel)**
   ```javascript
   POST /api/admin/prescription-lens-variants
   // Add Premium, Standard, Mid-Range, Near-Range
   ```

4. **Verify**
   ```javascript
   GET /api/products/89/configuration
   // Check variants array is populated
   ```

---

## 💻 Frontend Integration Code

```javascript
// ProgressiveLensSelection.jsx

const [variants, setVariants] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchProgressiveVariants();
}, [productId]);

const fetchProgressiveVariants = async () => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/products/${productId}/configuration`
    );
    const data = await response.json();
    
    if (data.success) {
      const progressive = data.data.prescriptionLensTypes.find(
        type => type.slug === 'progressive'
      );
      
      if (progressive && progressive.variants.length > 0) {
        setVariants(progressive.variants);
      } else {
        setVariants([]); // Triggers "No variants" message
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

// Render
{variants.length === 0 ? (
  <div>
    <p>No progressive options available</p>
    <p>Please check the admin panel to ensure variants are added and active.</p>
  </div>
) : (
  variants.map(variant => (
    <VariantCard key={variant.id} variant={variant} />
  ))
)}
```

---

## ✅ Summary

**For Your Progressive Lens Page:**

1. **Main API:** `GET /api/products/:id/configuration`
2. **Check:** `prescriptionLensTypes[].variants.length`
3. **If empty:** Show "No progressive options available"
4. **To fix:** Admin adds variants via `POST /api/admin/prescription-lens-variants`

**All APIs are ready and working!** 🚀



