# Website API Integration Guide

## Complete API Reference for Frontend Integration

---

## 🔑 Authentication

For protected routes, include JWT token:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📦 Product Configuration Flow

### Step 1: Get Product Details

**Endpoint:**
```
GET /api/products/:id
```

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/products/89', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {
      "id": 89,
      "name": "Testing",
      "slug": "testing",
      "price": 500.00,
      "description": "Durable wraparound frames perfect for an active lifestyle.",
      "images": ["image1.jpg", "image2.jpg"],
      "category": {
        "id": 1,
        "name": "Eyeglasses"
      }
    }
  }
}
```

---

### Step 2: Get Product Configuration Options

**Endpoint:**
```
GET /api/products/:id/configuration
```

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/products/89/configuration', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
const config = await response.json();
```

**Response:**
```json
{
  "success": true,
  "message": "Product configuration retrieved successfully",
  "data": {
    "product": {
      "id": 89,
      "name": "Testing",
      "price": 500.00
    },
    "prescriptionLensTypes": [
      {
        "id": 1,
        "name": "Distance Vision",
        "slug": "distance-vision",
        "description": "For distance (Thin, anti-glare, blue-cut options)",
        "prescriptionType": "single_vision",
        "basePrice": 60.00,
        "colors": [],
        "variants": []
      },
      {
        "id": 2,
        "name": "Near Vision",
        "slug": "near-vision",
        "description": "For near vision (Thin, anti-glare, blue-cut options)",
        "prescriptionType": "single_vision",
        "basePrice": 60.00,
        "colors": [],
        "variants": []
      },
      {
        "id": 3,
        "name": "Progressive",
        "slug": "progressive",
        "description": "Progressives (For two powers in same lenses)",
        "prescriptionType": "progressive",
        "basePrice": 60.00,
        "colors": [],
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
        ]
      }
    ],
    "lensThicknessMaterials": [
      {
        "id": 1,
        "name": "Unbreakable (Plastic)",
        "slug": "unbreakable-plastic",
        "description": "Durable plastic material",
        "price": 30.00
      },
      {
        "id": 2,
        "name": "Minerals (Glass)",
        "slug": "minerals-glass",
        "description": "High-quality glass material",
        "price": 60.00
      }
    ],
    "lensThicknessOptions": [
      {
        "id": 1,
        "name": "Thin",
        "slug": "thin",
        "description": "Thin lens option",
        "thicknessValue": 1.5
      },
      {
        "id": 2,
        "name": "Medium",
        "slug": "medium",
        "description": "Medium thickness option",
        "thicknessValue": 2.0
      }
    ],
    "lensTreatments": [
      {
        "id": 1,
        "name": "Scratch Proof",
        "slug": "scratch-proof",
        "type": "scratch_proof",
        "description": "Protects lenses from scratches",
        "price": 30.00,
        "icon": "icon-url"
      },
      {
        "id": 2,
        "name": "Anti Glare",
        "slug": "anti-glare",
        "type": "anti_glare",
        "description": "Reduces glare and reflections",
        "price": 30.00,
        "icon": "icon-url"
      },
      {
        "id": 3,
        "name": "Blue Lens Anti Glare",
        "slug": "blue-lens-anti-glare",
        "type": "blue_light_anti_glare",
        "description": "Filters blue light and reduces glare",
        "price": 30.00,
        "icon": "icon-url"
      }
    ],
    "photochromicColors": [
      {
        "id": 1,
        "name": "Gray",
        "colorCode": "GRAY",
        "hexCode": "#808080",
        "imageUrl": "https://example.com/colors/gray.png",
        "priceAdjustment": 0.00
      },
      {
        "id": 2,
        "name": "Brown",
        "colorCode": "BROWN",
        "hexCode": "#654321",
        "imageUrl": "https://example.com/colors/brown.png",
        "priceAdjustment": 0.00
      }
    ],
    "prescriptionSunColors": [
      {
        "id": 1,
        "name": "Dark Brown",
        "colorCode": "DARK_BROWN",
        "hexCode": "#654321",
        "imageUrl": "https://example.com/colors/dark-brown.png",
        "priceAdjustment": 0.00
      },
      {
        "id": 2,
        "name": "Dark Gray",
        "colorCode": "DARK_GRAY",
        "hexCode": "#404040",
        "imageUrl": "https://example.com/colors/dark-gray.png",
        "priceAdjustment": 0.00
      }
    ]
  }
}
```

---

## 🛒 Add to Cart with Full Configuration

### Endpoint
```
POST /api/cart/items
```

### Request Body Structure

**For Distance Vision:**
```javascript
const cartData = {
  product_id: 89,
  quantity: 1,
  lens_type: "distance_vision",
  prescription_data: {
    pd: 64,
    od: {
      sph: -2.0,
      cyl: -0.5,
      axis: 90
    },
    os: {
      sph: -2.0,
      cyl: -0.5,
      axis: 90
    }
  },
  lens_thickness_material_id: 2,
  lens_thickness_option_id: 1,
  treatment_ids: [1, 2],
  photochromic_color_id: null,
  prescription_sun_color_id: null
};
```

**For Near Vision:**
```javascript
const cartData = {
  product_id: 89,
  quantity: 1,
  lens_type: "near_vision",
  prescription_data: {
    pd: 64,
    od: {
      sph: -2.0,
      cyl: -0.5,
      axis: 90
    },
    os: {
      sph: -2.0,
      cyl: -0.5,
      axis: 90
    }
  },
  lens_thickness_material_id: 1,
  lens_thickness_option_id: 2,
  treatment_ids: [1, 3],
  photochromic_color_id: null,
  prescription_sun_color_id: null
};
```

**For Progressive:**
```javascript
const cartData = {
  product_id: 89,
  quantity: 1,
  lens_type: "progressive",
  prescription_data: {
    pd: 64,
    pd_right: 32,
    h: 18,
    od: {
      sph: -2.0,
      cyl: -0.5,
      axis: 90
    },
    os: {
      sph: -2.0,
      cyl: -0.5,
      axis: 90
    },
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

### Example Request
```javascript
const response = await fetch('http://localhost:5000/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(cartData)
});

const result = await response.json();
```

### Response
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "item": {
      "id": 123,
      "cart_id": 45,
      "product_id": 89,
      "quantity": 1,
      "unit_price": 672.95,
      "lens_type": "progressive",
      "prescription_data": {
        "pd": 64,
        "pd_right": 32,
        "h": 18,
        "od": {
          "sph": -2.0,
          "cyl": -0.5,
          "axis": 90
        },
        "os": {
          "sph": -2.0,
          "cyl": -0.5,
          "axis": 90
        },
        "year_of_birth": 1980
      },
      "progressive_variant_id": 1,
      "lens_thickness_material_id": 2,
      "lens_thickness_option_id": 3,
      "treatment_ids": [1, 2],
      "photochromic_color_id": 1,
      "prescription_sun_color_id": null,
      "created_at": "2024-12-13T21:30:00.000Z",
      "updated_at": "2024-12-13T21:30:00.000Z"
    },
    "coupon": null
  }
}
```

---

## 📋 Public API Endpoints

### Get All Lens Types
```
GET /api/products/configuration/lens-types
```

**Response:**
```json
{
  "success": true,
  "message": "Lens types retrieved successfully",
  "data": {
    "lensTypes": [
      {
        "id": 1,
        "name": "Distance Vision",
        "prescriptionType": "single_vision",
        "basePrice": 60.00,
        "colors": [],
        "variants": []
      }
    ]
  }
}
```

---

### Get Lens Thickness Materials
```
GET /api/lens/thickness-materials
```

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
        "price": 30.00,
        "description": "Durable plastic material"
      },
      {
        "id": 2,
        "name": "Minerals (Glass)",
        "price": 60.00,
        "description": "High-quality glass material"
      }
    ],
    "count": 2
  }
}
```

---

### Get Lens Thickness Options
```
GET /api/lens/thickness-options
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
        "thicknessValue": 1.5
      },
      {
        "id": 2,
        "name": "Medium",
        "thicknessValue": 2.0
      }
    ],
    "count": 2
  }
}
```

---

### Get Lens Treatments
```
GET /api/lens/treatments
```

**Query Parameters:**
- `type` (optional): Filter by treatment type

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
        "type": "scratch_proof",
        "price": 30.00,
        "icon": "icon-url"
      },
      {
        "id": 2,
        "name": "Anti Glare",
        "type": "anti_glare",
        "price": 30.00,
        "icon": "icon-url"
      }
    ],
    "count": 2
  }
}
```

---

### Get Prescription Lens Types
```
GET /api/lens/prescription-lens-types
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription lens types retrieved successfully",
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
    ],
    "count": 1
  }
}
```

---

## 💻 Complete Integration Example

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const ProductLensConfiguration = ({ productId }) => {
  const [config, setConfig] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({
    lens_type: null,
    prescription_data: null,
    progressive_variant_id: null,
    lens_thickness_material_id: null,
    lens_thickness_option_id: null,
    treatment_ids: [],
    photochromic_color_id: null,
    prescription_sun_color_id: null
  });
  const [price, setPrice] = useState(0);

  // Fetch configuration
  useEffect(() => {
    fetchConfiguration();
  }, [productId]);

  const fetchConfiguration = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${productId}/configuration`
      );
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
        setPrice(data.data.product.price);
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  };

  // Calculate price
  useEffect(() => {
    calculatePrice();
  }, [selectedOptions, config]);

  const calculatePrice = () => {
    if (!config) return;

    let total = config.product.price;

    // Add progressive variant price
    if (selectedOptions.progressive_variant_id) {
      const variant = config.prescriptionLensTypes
        .find(type => type.id === 3)?.variants
        .find(v => v.id === selectedOptions.progressive_variant_id);
      if (variant) total += variant.price;
    }

    // Add thickness material price
    if (selectedOptions.lens_thickness_material_id) {
      const material = config.lensThicknessMaterials.find(
        m => m.id === selectedOptions.lens_thickness_material_id
      );
      if (material) total += material.price;
    }

    // Add treatment prices
    if (selectedOptions.treatment_ids.length > 0) {
      selectedOptions.treatment_ids.forEach(treatmentId => {
        const treatment = config.lensTreatments.find(t => t.id === treatmentId);
        if (treatment) total += treatment.price;
      });
    }

    // Add color price adjustments
    if (selectedOptions.photochromic_color_id) {
      const color = config.photochromicColors.find(
        c => c.id === selectedOptions.photochromic_color_id
      );
      if (color) total += color.priceAdjustment;
    }

    if (selectedOptions.prescription_sun_color_id) {
      const color = config.prescriptionSunColors.find(
        c => c.id === selectedOptions.prescription_sun_color_id
      );
      if (color) total += color.priceAdjustment;
    }

    setPrice(total);
  };

  // Add to cart
  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
          ...selectedOptions
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Item added to cart!');
        // Redirect to cart or show success message
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
    }
  };

  if (!config) return <div>Loading...</div>;

  return (
    <div className="lens-configuration">
      <h2>Configure Your Lenses</h2>

      {/* Lens Type Selection */}
      <div className="section">
        <h3>Select Lens Type</h3>
        {config.prescriptionLensTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedOptions({
              ...selectedOptions,
              lens_type: type.slug === 'distance-vision' ? 'distance_vision' :
                       type.slug === 'near-vision' ? 'near_vision' : 'progressive'
            })}
            className={selectedOptions.lens_type === type.slug ? 'active' : ''}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* Prescription Form */}
      {selectedOptions.lens_type && (
        <div className="section">
          <h3>Enter Prescription</h3>
          <PrescriptionForm
            lensType={selectedOptions.lens_type}
            onDataChange={(data) => setSelectedOptions({
              ...selectedOptions,
              prescription_data: data
            })}
          />
        </div>
      )}

      {/* Progressive Variant Selection */}
      {selectedOptions.lens_type === 'progressive' && (
        <div className="section">
          <h3>Select Progressive Variant</h3>
          {config.prescriptionLensTypes
            .find(t => t.slug === 'progressive')?.variants.map(variant => (
              <div key={variant.id} className="variant-card">
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={selectedOptions.progressive_variant_id === variant.id}
                  onChange={() => setSelectedOptions({
                    ...selectedOptions,
                    progressive_variant_id: variant.id
                  })}
                />
                <label>
                  <strong>{variant.name}</strong> - €{variant.price}
                  {variant.isRecommended && <span className="badge">Recommended</span>}
                </label>
                <p>{variant.description}</p>
              </div>
            ))}
        </div>
      )}

      {/* Lens Thickness Material */}
      <div className="section">
        <h3>Select Lens Thickness Material</h3>
        {config.lensThicknessMaterials.map(material => (
          <div key={material.id} className="option-card">
            <input
              type="radio"
              name="thickness-material"
              value={material.id}
              checked={selectedOptions.lens_thickness_material_id === material.id}
              onChange={() => setSelectedOptions({
                ...selectedOptions,
                lens_thickness_material_id: material.id
              })}
            />
            <label>
              {material.name} - €{material.price}
            </label>
          </div>
        ))}
      </div>

      {/* Lens Thickness Option */}
      <div className="section">
        <h3>Select Lens Thickness</h3>
        <select
          value={selectedOptions.lens_thickness_option_id || ''}
          onChange={(e) => setSelectedOptions({
            ...selectedOptions,
            lens_thickness_option_id: parseInt(e.target.value)
          })}
        >
          <option value="">Select thickness</option>
          {config.lensThicknessOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      {/* Treatments */}
      <div className="section">
        <h3>Select Treatments</h3>
        {config.lensTreatments.map(treatment => (
          <div key={treatment.id} className="treatment-card">
            <input
              type="checkbox"
              checked={selectedOptions.treatment_ids.includes(treatment.id)}
              onChange={(e) => {
                const ids = e.target.checked
                  ? [...selectedOptions.treatment_ids, treatment.id]
                  : selectedOptions.treatment_ids.filter(id => id !== treatment.id);
                setSelectedOptions({
                  ...selectedOptions,
                  treatment_ids: ids
                });
              }}
            />
            <label>
              {treatment.name} - €{treatment.price}
            </label>
          </div>
        ))}
      </div>

      {/* Photochromic Colors */}
      {selectedOptions.treatment_ids.some(id => {
        const treatment = config.lensTreatments.find(t => t.id === id);
        return treatment?.type === 'photochromic';
      }) && (
        <div className="section">
          <h3>Select Photochromic Color</h3>
          <div className="color-grid">
            {config.photochromicColors.map(color => (
              <div
                key={color.id}
                className={`color-option ${selectedOptions.photochromic_color_id === color.id ? 'selected' : ''}`}
                onClick={() => setSelectedOptions({
                  ...selectedOptions,
                  photochromic_color_id: color.id
                })}
              >
                <div
                  className="color-swatch"
                  style={{ backgroundColor: color.hexCode }}
                />
                <span>{color.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Display */}
      <div className="price-section">
        <h2>Total Price: €{price.toFixed(2)}</h2>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        className="btn-add-to-cart"
        disabled={!isConfigurationComplete()}
      >
        Add to Cart
      </button>
    </div>
  );

  function isConfigurationComplete() {
    return (
      selectedOptions.lens_type &&
      selectedOptions.prescription_data &&
      selectedOptions.lens_thickness_material_id &&
      selectedOptions.lens_thickness_option_id
    );
  }
};

export default ProductLensConfiguration;
```

---

## 🔧 API Service Helper

```javascript
// services/productAPI.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ProductAPI {
  // Get product details
  static async getProduct(productId) {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data.product;
  }

  // Get product configuration
  static async getProductConfiguration(productId) {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/configuration`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  // Get lens types
  static async getLensTypes() {
    const response = await fetch(`${API_BASE_URL}/products/configuration/lens-types`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data.lensTypes;
  }

  // Get lens thickness materials
  static async getLensThicknessMaterials() {
    const response = await fetch(`${API_BASE_URL}/lens/thickness-materials`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data.materials;
  }

  // Get lens thickness options
  static async getLensThicknessOptions() {
    const response = await fetch(`${API_BASE_URL}/lens/thickness-options`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data.options;
  }

  // Get lens treatments
  static async getLensTreatments(type = null) {
    const url = type
      ? `${API_BASE_URL}/lens/treatments?type=${type}`
      : `${API_BASE_URL}/lens/treatments`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data.treatments;
  }

  // Add to cart
  static async addToCart(cartData, token) {
    const response = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cartData)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data.item;
  }
}

export default ProductAPI;
```

---

## 📝 Integration Commands for Your Website

### 1. Install Dependencies (if using React)
```bash
npm install axios
# or
yarn add axios
```

### 2. Set Environment Variables
```bash
# .env file
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Integration Steps

**Step 1: Create API Service**
```javascript
// Create services/productAPI.js (see above)
```

**Step 2: Use in Components**
```javascript
import ProductAPI from './services/productAPI';

// In your component
const config = await ProductAPI.getProductConfiguration(productId);
```

**Step 3: Handle Cart Addition**
```javascript
const cartData = {
  product_id: 89,
  quantity: 1,
  lens_type: "progressive",
  prescription_data: { /* ... */ },
  progressive_variant_id: 1,
  lens_thickness_material_id: 2,
  lens_thickness_option_id: 3,
  treatment_ids: [1, 2],
  photochromic_color_id: 1
};

const item = await ProductAPI.addToCart(cartData, token);
```

---

## 🎯 Quick Reference Commands

### Fetch Product Configuration
```javascript
fetch('http://localhost:5000/api/products/89/configuration')
  .then(res => res.json())
  .then(data => console.log(data.data));
```

### Add to Cart
```javascript
fetch('http://localhost:5000/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    product_id: 89,
    quantity: 1,
    lens_type: "progressive",
    prescription_data: { pd: 64, od: {...}, os: {...} },
    progressive_variant_id: 1,
    lens_thickness_material_id: 2,
    lens_thickness_option_id: 3,
    treatment_ids: [1, 2]
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## ✅ Checklist for Integration

- [ ] Set up API base URL
- [ ] Create API service helper
- [ ] Fetch product configuration on product page
- [ ] Display lens type options
- [ ] Show prescription form based on lens type
- [ ] Display progressive variants if progressive selected
- [ ] Show thickness materials and options
- [ ] Display treatments with checkboxes
- [ ] Show color options for photochromic/prescription sun
- [ ] Calculate and display total price
- [ ] Implement add to cart functionality
- [ ] Handle authentication token
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test all flows

---

This guide provides everything you need to integrate the lens configuration system into your website! 🚀

