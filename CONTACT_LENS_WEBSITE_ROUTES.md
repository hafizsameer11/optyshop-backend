# Contact Lens Configuration System - Website Routes & Flow

## Overview

This document maps out the **exact API routes** from the Postman collection that the **website (frontend)** will use for the contact lens configuration system. This is the customer-facing flow, not the admin panel.

---

## 🌐 Website Routes (Public - No Authentication Required)

### **Flow 1: Browse Contact Lens Products**

#### Step 1: Get Categories
**Route:** `GET /api/categories`

**Purpose:** Display main categories in navigation/filters

**Response:** List of all active categories

**Usage:**
```javascript
// Fetch categories for navigation
const response = await fetch('/api/categories');
const { data } = await response.json();
// data.categories = [{ id, name, slug, ... }]
```

---

#### Step 2: Get SubCategories for a Category
**Route:** `GET /api/subcategories/by-category/:category_id`

**Purpose:** Get top-level subcategories (e.g., "Daily Lenses", "Monthly Lenses")

**Example:** `GET /api/subcategories/by-category/3`

**Response:** Array of subcategories with `parent_id: null`

**Usage:**
```javascript
// Get subcategories for Contact Lenses category
const response = await fetch('/api/subcategories/by-category/3');
const { data } = await response.json();
// data.subcategories = [{ id, name, slug, parent_id: null, ... }]
```

---

#### Step 3: Get Sub-SubCategories (Spherical/Astigmatism)
**Route:** `GET /api/subcategories/by-parent/:parent_id`

**Purpose:** Get sub-subcategories (e.g., "Spherical", "Astigmatism") that belong to a subcategory

**Example:** `GET /api/subcategories/by-parent/10`

**Response:** Array of sub-subcategories with `parent_id: 10`

**Usage:**
```javascript
// Get Spherical and Astigmatism options for "Daily Lenses"
const response = await fetch('/api/subcategories/by-parent/10');
const { data } = await response.json();
// data.subcategories = [
//   { id: 100, name: "Spherical", parent_id: 10, ... },
//   { id: 101, name: "Astigmatism", parent_id: 10, ... }
// ]
```

---

#### Step 4: Get Products by Category/SubCategory
**Route:** `GET /api/products`

**Query Parameters:**
- `category`: Category slug (e.g., `category=contact-lenses`)
- `subCategory`: Subcategory slug (e.g., `subCategory=daily-lenses`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)

**Example:** `GET /api/products?category=contact-lenses&page=1&limit=12`

**Purpose:** Display contact lens products in product listing page

**Usage:**
```javascript
// Get contact lens products
const response = await fetch('/api/products?category=contact-lenses&page=1&limit=12');
const { data } = await response.json();
// data.products = [{ id, name, slug, price, images, ... }]
```

---

### **Flow 2: View Product Details**

#### Step 1: Get Single Product
**Route:** `GET /api/products/:id` or `GET /api/products/slug/:slug`

**Example:** 
- `GET /api/products/89`
- `GET /api/products/slug/acuvue-daily`

**Purpose:** Display product details page

**Response:** Product object with all details

**Usage:**
```javascript
// Get product by ID
const response = await fetch('/api/products/89');
const { data } = await response.json();
// data.product = { id, name, slug, price, description, images, ... }
```

---

#### Step 2: Get Contact Lens Configurations for Product
**Route:** `GET /api/products/contact-lens-configs`

**Query Parameters:**
- `product_id`: **Required** - Product ID to get configurations for
- `configuration_type`: Optional - Filter by `spherical` or `astigmatism`

**Example:** `GET /api/products/contact-lens-configs?product_id=89`

**Purpose:** Get all active configurations for a specific product to populate dropdown

**Response:**
```json
{
  "success": true,
  "message": "Contact lens configurations retrieved successfully",
  "data": {
    "configurations": [
      {
        "id": 1,
        "name": "Acuvue Daily Spherical",
        "display_name": "Acuvue Daily - Spherical",
        "configuration_type": "spherical",
        "price": "29.99",
        "images": ["https://..."],
        "right_qty": [30, 90],
        "right_base_curve": [8.5, 8.6],
        "right_diameter": [14.2, 14.3],
        "right_power": [-2.00, -1.75, -1.50],
        "left_qty": [30, 90],
        "left_base_curve": [8.5, 8.6],
        "left_diameter": [14.2, 14.3],
        "left_power": [-2.00, -1.75, -1.50],
        "category": { "id": 3, "name": "Contact Lenses" },
        "subCategory": {
          "id": 100,
          "name": "Spherical",
          "parent": { "id": 10, "name": "Daily Lenses" }
        }
      }
    ]
  }
}
```

**Usage:**
```javascript
// Get configurations for product
const response = await fetch('/api/products/contact-lens-configs?product_id=89');
const { data } = await response.json();

// Populate dropdown
data.configurations.forEach(config => {
  const option = document.createElement('option');
  option.value = config.id;
  option.textContent = `${config.display_name} - $${config.price}`;
  option.dataset.config = JSON.stringify(config);
  dropdown.appendChild(option);
});
```

---

### **Flow 3: Get Contact Lens Options (Parameter Dropdowns)**

#### Get Available Options for Spherical Sub-SubCategory
**Route:** `GET /api/subcategories/:id/contact-lens-options`

**Example:** `GET /api/subcategories/100/contact-lens-options`

**Purpose:** Get aggregated list of available power, base curve, and diameter options for building dropdown menus

**Response (Spherical):**
```json
{
  "success": true,
  "data": {
    "subcategory": {
      "id": 100,
      "name": "Spherical",
      "slug": "spherical",
      "parent": { "id": 10, "name": "Daily Lenses" },
      "category": { "id": 3, "name": "Contact Lenses" }
    },
    "powerOptions": ["-10.00", "-9.75", "-9.50", ..., "+6.00"],
    "baseCurveOptions": [8.70, 8.80, 8.90, 9.00],
    "diameterOptions": [14.00, 14.20, 14.30],
    "productCount": 15,
    "type": "spherical"
  }
}
```

**Usage:**
```javascript
// Get available options for Spherical
const response = await fetch('/api/subcategories/100/contact-lens-options');
const { data } = await response.json();

// Populate power dropdown
data.powerOptions.forEach(power => {
  const option = document.createElement('option');
  option.value = power;
  option.textContent = power;
  powerDropdown.appendChild(option);
});

// Populate base curve dropdown
data.baseCurveOptions.forEach(bc => {
  const option = document.createElement('option');
  option.value = bc;
  option.textContent = bc;
  baseCurveDropdown.appendChild(option);
});
```

---

#### Get Available Options for Astigmatism Sub-SubCategory
**Route:** `GET /api/subcategories/:id/contact-lens-options`

**Example:** `GET /api/subcategories/101/contact-lens-options`

**Response (Astigmatism):**
```json
{
  "success": true,
  "data": {
    "subcategory": {
      "id": 101,
      "name": "Astigmatism",
      "slug": "astigmatism",
      "parent": { "id": 10, "name": "Daily Lenses" },
      "category": { "id": 3, "name": "Contact Lenses" }
    },
    "powerOptions": ["-10.00", "-9.75", ..., "+6.00"],
    "baseCurveOptions": [8.70, 8.80, 8.90, 9.00],
    "diameterOptions": [14.00, 14.20, 14.30],
    "cylinderOptions": [-0.25, -0.50, -0.75, ..., -6.00],
    "axisOptions": [0, 1, 2, ..., 180],
    "productCount": 15,
    "type": "astigmatism"
  }
}
```

**Usage:**
```javascript
// Get available options for Astigmatism
const response = await fetch('/api/subcategories/101/contact-lens-options');
const { data } = await response.json();

// Populate all dropdowns including cylinder and axis
data.powerOptions.forEach(power => {
  powerDropdown.appendChild(new Option(power, power));
});
data.cylinderOptions.forEach(cyl => {
  cylinderDropdown.appendChild(new Option(cyl, cyl));
});
data.axisOptions.forEach(axis => {
  axisDropdown.appendChild(new Option(axis, axis));
});
```

---

#### Get Options by Sub-SubCategory Slug (Alternative)
**Route:** `GET /api/subcategories/slug/:slug/contact-lens-options`

**Example:** `GET /api/subcategories/slug/sferiche/contact-lens-options`

**Purpose:** Same as above but using slug instead of ID (more SEO-friendly)

**Usage:**
```javascript
// Get options by slug
const response = await fetch('/api/subcategories/slug/sferiche/contact-lens-options');
const { data } = await response.json();
// Same response structure as above
```

---

### **Flow 4: Get Configurations by Category/SubCategory**

#### Get Configurations by Category
**Route:** `GET /api/products/contact-lens-configs?category_id=:id`

**Example:** `GET /api/products/contact-lens-configs?category_id=3`

**Purpose:** Get all active configurations for a category (e.g., all Contact Lenses configurations)

**Usage:**
```javascript
// Get all configurations for Contact Lenses category
const response = await fetch('/api/products/contact-lens-configs?category_id=3');
const { data } = await response.json();
// data.configurations = [...]
```

---

#### Get Configurations by Sub-SubCategory
**Route:** `GET /api/products/contact-lens-configs?sub_category_id=:id`

**Example:** `GET /api/products/contact-lens-configs?sub_category_id=100&configuration_type=spherical`

**Purpose:** Get all active configurations for a specific sub-subcategory (e.g., all Spherical configurations)

**Usage:**
```javascript
// Get all Spherical configurations
const response = await fetch('/api/products/contact-lens-configs?sub_category_id=100&configuration_type=spherical');
const { data } = await response.json();
// data.configurations = [...]
```

---

## 📋 Complete Website Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WEBSITE USER JOURNEY                      │
└─────────────────────────────────────────────────────────────┘

1. BROWSE CATEGORIES
   ↓
   GET /api/categories
   → Display categories in navigation
   
2. SELECT CATEGORY (e.g., "Contact Lenses")
   ↓
   GET /api/subcategories/by-category/:category_id
   → Display subcategories (e.g., "Daily Lenses", "Monthly Lenses")
   
3. SELECT SUBCATEGORY (e.g., "Daily Lenses")
   ↓
   GET /api/subcategories/by-parent/:parent_id
   → Display sub-subcategories (e.g., "Spherical", "Astigmatism")
   
4. VIEW PRODUCTS
   ↓
   GET /api/products?category=contact-lenses&subCategory=daily-lenses
   → Display product listing
   
5. CLICK PRODUCT
   ↓
   GET /api/products/:id (or /api/products/slug/:slug)
   → Display product details page
   
6. PRODUCT HAS CONTACT LENS CONFIGS?
   ↓
   GET /api/products/contact-lens-configs?product_id=:id
   → Display configuration dropdown
   
7. USER SELECTS CONFIGURATION
   ↓
   Check configuration_type:
   - If "spherical" → Show Spherical Form
   - If "astigmatism" → Show Astigmatism Form
   
8. LOAD PARAMETER OPTIONS (Optional - for validation)
   ↓
   GET /api/subcategories/:id/contact-lens-options
   → Populate dropdown options (power, base curve, diameter, etc.)
   
9. USER FILLS FORM
   ↓
   - Select Qty, B.C, DIA, PWR (and CYL, AX for astigmatism)
   - Values can be selected from dropdowns or entered manually
   
10. ADD TO CART
    ↓
    POST /api/cart/add (with configuration_id and parameters)
    → Add to cart with configuration details
```

---

## 🔑 Key Routes Summary

### **Public Routes (No Auth Required)**

| Route | Method | Purpose | When to Use |
|-------|--------|---------|-------------|
| `/api/categories` | GET | Get all categories | Navigation, filters |
| `/api/subcategories/by-category/:id` | GET | Get top-level subcategories | Category page |
| `/api/subcategories/by-parent/:id` | GET | Get sub-subcategories | Subcategory page |
| `/api/products` | GET | Get products (with filters) | Product listing |
| `/api/products/:id` | GET | Get single product | Product details page |
| `/api/products/slug/:slug` | GET | Get product by slug | Product details page (SEO) |
| `/api/products/contact-lens-configs` | GET | Get configurations | Product page dropdown |
| `/api/subcategories/:id/contact-lens-options` | GET | Get parameter options | Form dropdowns |
| `/api/subcategories/slug/:slug/contact-lens-options` | GET | Get options by slug | Form dropdowns (SEO) |

---

## 💡 Implementation Examples

### **Example 1: Product Page with Configuration Dropdown**

```javascript
// 1. Get product details
const productResponse = await fetch(`/api/products/${productId}`);
const { data: productData } = await productResponse.json();

// 2. Get configurations for this product
const configResponse = await fetch(
  `/api/products/contact-lens-configs?product_id=${productId}`
);
const { data: configData } = await configResponse.json();

// 3. Display dropdown
const configSelect = document.getElementById('config-select');
configData.configurations.forEach(config => {
  const option = document.createElement('option');
  option.value = config.id;
  option.textContent = `${config.display_name} - $${config.price}`;
  option.dataset.type = config.configuration_type;
  option.dataset.config = JSON.stringify(config);
  configSelect.appendChild(option);
});

// 4. Handle selection
configSelect.addEventListener('change', (e) => {
  const selectedOption = e.target.options[e.target.selectedIndex];
  const config = JSON.parse(selectedOption.dataset.config);
  const type = selectedOption.dataset.type;
  
  // Show appropriate form
  if (type === 'spherical') {
    showSphericalForm(config);
  } else if (type === 'astigmatism') {
    showAstigmatismForm(config);
  }
});
```

---

### **Example 2: Spherical Form with Pre-filled Values**

```javascript
function showSphericalForm(config) {
  // Show form
  document.getElementById('spherical-form').style.display = 'block';
  
  // Pre-fill with configuration values (arrays)
  const rightPowerSelect = document.getElementById('right-power');
  config.right_power?.forEach(power => {
    rightPowerSelect.appendChild(new Option(power, power));
  });
  
  const rightBaseCurveSelect = document.getElementById('right-base-curve');
  config.right_base_curve?.forEach(bc => {
    rightBaseCurveSelect.appendChild(new Option(bc, bc));
  });
  
  // Same for diameter, qty, and left eye...
}
```

---

### **Example 3: Astigmatism Form with All Parameters**

```javascript
function showAstigmatismForm(config) {
  // Show form
  document.getElementById('astigmatism-form').style.display = 'block';
  
  // Pre-fill power, base curve, diameter, qty
  // ... (same as spherical)
  
  // Additionally, pre-fill cylinder and axis
  const rightCylinderSelect = document.getElementById('right-cylinder');
  config.right_cylinder?.forEach(cyl => {
    rightCylinderSelect.appendChild(new Option(cyl, cyl));
  });
  
  const rightAxisSelect = document.getElementById('right-axis');
  config.right_axis?.forEach(axis => {
    rightAxisSelect.appendChild(new Option(axis, axis));
  });
  
  // Same for left eye...
}
```

---

### **Example 4: Get Available Options for Validation**

```javascript
// Get available options for the selected sub-subcategory
async function loadParameterOptions(subCategoryId) {
  const response = await fetch(
    `/api/subcategories/${subCategoryId}/contact-lens-options`
  );
  const { data } = await response.json();
  
  // Use these options to:
  // 1. Populate dropdowns
  // 2. Validate user input
  // 3. Show only available combinations
  
  if (data.type === 'spherical') {
    // Populate power, base curve, diameter dropdowns
    populateDropdown('power', data.powerOptions);
    populateDropdown('baseCurve', data.baseCurveOptions);
    populateDropdown('diameter', data.diameterOptions);
  } else if (data.type === 'astigmatism') {
    // Populate all dropdowns including cylinder and axis
    populateDropdown('power', data.powerOptions);
    populateDropdown('baseCurve', data.baseCurveOptions);
    populateDropdown('diameter', data.diameterOptions);
    populateDropdown('cylinder', data.cylinderOptions);
    populateDropdown('axis', data.axisOptions);
  }
}
```

---

## ⚠️ Important Notes

### **Query Parameter Requirements**

For `GET /api/products/contact-lens-configs`:
- **At least one** of these must be provided: `product_id`, `category_id`, or `sub_category_id`
- `configuration_type` is optional (filters by `spherical` or `astigmatism`)

### **Response Format**

All parameter fields are returned as **arrays** (JSON arrays):
- `right_power`: `[-2.00, -1.75, -1.50]` (not single value)
- `right_base_curve`: `[8.5, 8.6, 8.7]`
- `right_diameter`: `[14.2, 14.3]`
- `right_qty`: `[30, 90]`
- For astigmatism: `right_cylinder`: `[-0.25, -0.50, -0.75]`
- For astigmatism: `right_axis`: `[0, 90, 180]`

### **Configuration Type Detection**

- Check `configuration_type` field: `"spherical"` or `"astigmatism"`
- Show appropriate form based on type
- Spherical forms should NOT show cylinder/axis fields

### **Active Configurations Only**

- Only configurations with `is_active: true` are returned
- Inactive configurations are automatically filtered out

---

## 🔗 Related Routes

### **Cart Routes (Authenticated)**
- `POST /api/cart/add` - Add item to cart (include `configuration_id` and parameters)
- `GET /api/cart` - Get cart items
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove cart item

### **Product Routes**
- `GET /api/products/featured` - Get featured products
- `GET /api/products/options` - Get all product options (categories, subcategories, etc.)
- `GET /api/products/:id/related` - Get related products

---

## 📚 Complete Route Reference

For complete API documentation, see:
- `OptyShop_API.postman_collection.json` - Postman collection with all routes
- `CONTACT_LENS_CONFIG_GUIDE.md` - Complete system guide
- `ROUTES_QUICK_REFERENCE.md` - Quick route reference

---

**Last Updated:** Based on Postman Collection v1.0
**System:** Contact Lens Configuration System
**Environment:** Production Website (Public Routes)

