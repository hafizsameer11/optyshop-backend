# Website API Quick Reference

## 🚀 Quick Integration Commands

### Base URL
```
http://localhost:5000/api
```

---

## 📋 Essential API Calls

### 1. Get Product Configuration
```javascript
GET /api/products/:id/configuration

// Example
fetch('http://localhost:5000/api/products/89/configuration')
  .then(res => res.json())
  .then(data => {
    console.log(data.data);
    // Contains: prescriptionLensTypes, lensThicknessMaterials, 
    // lensThicknessOptions, lensTreatments, colors
  });
```

---

### 2. Add to Cart (Distance Vision)
```javascript
POST /api/cart/items

const requestBody = {
  product_id: 89,
  quantity: 1,
  lens_type: "distance_vision",
  prescription_data: {
    pd: 64,
    od: { sph: -2.0, cyl: -0.5, axis: 90 },
    os: { sph: -2.0, cyl: -0.5, axis: 90 }
  },
  lens_thickness_material_id: 2,
  lens_thickness_option_id: 1,
  treatment_ids: [1, 2],
  photochromic_color_id: null,
  prescription_sun_color_id: null
};

fetch('http://localhost:5000/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(requestBody)
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 3. Add to Cart (Near Vision)
```javascript
const requestBody = {
  product_id: 89,
  quantity: 1,
  lens_type: "near_vision",
  prescription_data: {
    pd: 64,
    od: { sph: -2.0, cyl: -0.5, axis: 90 },
    os: { sph: -2.0, cyl: -0.5, axis: 90 }
  },
  lens_thickness_material_id: 1,
  lens_thickness_option_id: 2,
  treatment_ids: [1, 3],
  photochromic_color_id: null,
  prescription_sun_color_id: null
};
```

---

### 4. Add to Cart (Progressive)
```javascript
const requestBody = {
  product_id: 89,
  quantity: 1,
  lens_type: "progressive",
  prescription_data: {
    pd: 64,
    pd_right: 32,
    h: 18,
    od: { sph: -2.0, cyl: -0.5, axis: 90 },
    os: { sph: -2.0, cyl: -0.5, axis: 90 },
    year_of_birth: 1980
  },
  progressive_variant_id: 1,
  lens_thickness_material_id: 2,
  lens_thickness_option_id: 3,
  treatment_ids: [1, 2],
  photochromic_color_id: 1,
  prescription_sun_color_id: null
};
```

---

## 🔑 Required Fields

### Minimum Required for Add to Cart:
- ✅ `product_id` (required)
- ✅ `lens_type` (required: "distance_vision" | "near_vision" | "progressive")
- ✅ `prescription_data` (required)
- ✅ `lens_thickness_material_id` (required)
- ✅ `lens_thickness_option_id` (required)

### Optional Fields:
- ⚪ `progressive_variant_id` (only if lens_type is "progressive")
- ⚪ `treatment_ids` (array, can be empty)
- ⚪ `photochromic_color_id` (only if photochromic treatment selected)
- ⚪ `prescription_sun_color_id` (only if prescription sun selected)

---

## 📊 Response Structure

### Success Response
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "item": {
      "id": 123,
      "product_id": 89,
      "quantity": 1,
      "unit_price": 672.95,
      "lens_type": "progressive",
      "prescription_data": { /* ... */ },
      "treatment_ids": [1, 2]
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## 🎨 Frontend Integration Pattern

```javascript
// 1. Fetch configuration
const config = await fetch('/api/products/89/configuration').then(r => r.json());

// 2. User selects options (store in state)
const selections = {
  lens_type: "progressive",
  prescription_data: { /* ... */ },
  progressive_variant_id: 1,
  lens_thickness_material_id: 2,
  lens_thickness_option_id: 3,
  treatment_ids: [1, 2],
  photochromic_color_id: 1
};

// 3. Calculate price
let price = config.data.product.price;
price += config.data.prescriptionLensTypes[2].variants[0].price; // Progressive variant
price += config.data.lensThicknessMaterials[1].price; // Thickness material
price += config.data.lensTreatments[0].price; // Treatment 1
price += config.data.lensTreatments[1].price; // Treatment 2

// 4. Add to cart
await fetch('/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    product_id: 89,
    quantity: 1,
    ...selections
  })
});
```

---

## ⚡ Quick Copy-Paste Examples

### Axios Example
```javascript
import axios from 'axios';

const addToCart = async (cartData) => {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/cart/items',
      cartData,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
};
```

### Fetch Example
```javascript
const addToCart = async (cartData) => {
  const response = await fetch('http://localhost:5000/api/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(cartData)
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data.data;
};
```

---

## 🎯 Complete Flow Example

```javascript
// Complete integration flow
async function configureAndAddToCart(productId) {
  // Step 1: Get configuration
  const configResponse = await fetch(
    `http://localhost:5000/api/products/${productId}/configuration`
  );
  const config = await configResponse.json();
  
  // Step 2: User makes selections (in your UI)
  const userSelections = {
    lens_type: "progressive",
    prescription_data: {
      pd: 64,
      pd_right: 32,
      h: 18,
      od: { sph: -2.0, cyl: -0.5, axis: 90 },
      os: { sph: -2.0, cyl: -0.5, axis: 90 },
      year_of_birth: 1980
    },
    progressive_variant_id: 1,
    lens_thickness_material_id: 2,
    lens_thickness_option_id: 3,
    treatment_ids: [1, 2],
    photochromic_color_id: 1
  };
  
  // Step 3: Add to cart
  const cartResponse = await fetch('http://localhost:5000/api/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      product_id: productId,
      quantity: 1,
      ...userSelections
    })
  });
  
  const cartResult = await cartResponse.json();
  
  if (cartResult.success) {
    console.log('Added to cart:', cartResult.data.item);
    return cartResult.data.item;
  } else {
    throw new Error(cartResult.message);
  }
}
```

---

## 📱 Mobile/React Native Example

```javascript
// React Native example
import axios from 'axios';

const API_URL = 'http://your-api-url.com/api';

export const addToCart = async (cartData, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/cart/items`,
      cartData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Add to cart error:', error);
    throw error;
  }
};
```

---

## 🔍 Testing with cURL

```bash
# Get product configuration
curl -X GET http://localhost:5000/api/products/89/configuration

# Add to cart
curl -X POST http://localhost:5000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": 89,
    "quantity": 1,
    "lens_type": "progressive",
    "prescription_data": {
      "pd": 64,
      "od": {"sph": -2.0, "cyl": -0.5, "axis": 90},
      "os": {"sph": -2.0, "cyl": -0.5, "axis": 90}
    },
    "progressive_variant_id": 1,
    "lens_thickness_material_id": 2,
    "lens_thickness_option_id": 3,
    "treatment_ids": [1, 2]
  }'
```

---

## ✅ Integration Checklist

Copy this checklist for your integration:

```
□ Set API base URL
□ Create API service helper
□ Fetch product configuration
□ Display lens type selection
□ Show prescription form
□ Display progressive variants (if progressive)
□ Show thickness materials
□ Show thickness options
□ Display treatments
□ Show colors (if applicable)
□ Calculate total price
□ Implement add to cart
□ Handle authentication
□ Add error handling
□ Test all scenarios
```

---

This quick reference gives you everything you need to integrate! 🚀

