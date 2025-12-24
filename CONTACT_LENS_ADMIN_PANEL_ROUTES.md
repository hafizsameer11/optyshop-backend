# Contact Lens Configuration System - Admin Panel Routes & Flow

## Overview

This document maps out the **exact API routes** from the Postman collection that the **Admin Panel** will use for managing contact lens configurations. All admin routes require authentication with `Bearer {{admin_token}}`.

---

## 🔐 Authentication (Required for All Admin Routes)

### Step 1: Admin Login
**Route:** `POST /api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**Usage:**
```javascript
// Login as admin
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  })
});
const { data } = await response.json();
const adminToken = data.access_token; // Store this token
```

---

### Step 2: Use Token in All Admin Requests
**Header Required:**
```
Authorization: Bearer {{admin_token}}
```

---

## 📋 Admin Panel Complete Flow

### **Flow 1: Navigate to Contact Lens Configurations Page**

#### Step 1: Get All Categories (For Dropdown)
**Route:** `GET /api/admin/categories`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `sortBy`: Sort field (default: created_at)
- `sortOrder`: asc or desc (default: desc)

**Example:** `GET /api/admin/categories?page=1&limit=50`

**Purpose:** Populate category dropdown in admin form

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 3,
        "name": "Contact Lenses",
        "slug": "contact-lenses",
        "is_active": true
      }
    ],
    "pagination": { ... }
  }
}
```

**Usage:**
```javascript
// Get categories for dropdown
const response = await fetch('/api/admin/categories?page=1&limit=50', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const { data } = await response.json();
// Populate category dropdown
data.categories.forEach(cat => {
  categorySelect.appendChild(new Option(cat.name, cat.id));
});
```

---

#### Step 2: Get Top-Level SubCategories (For Dropdown)
**Route:** `GET /api/admin/subcategories/top-level`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Parameters:**
- `category_id`: Filter by category ID (required)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Example:** `GET /api/admin/subcategories/top-level?category_id=3&page=1&limit=50`

**Purpose:** Get subcategories that have NO parent (top-level subcategories)

**Response:**
```json
{
  "success": true,
  "data": {
    "subcategories": [
      {
        "id": 10,
        "name": "Daily Lenses",
        "slug": "daily-lenses",
        "category_id": 3,
        "parent_id": null,  // ← Top-level (no parent)
        "is_active": true
      }
    ],
    "pagination": { ... }
  }
}
```

**Usage:**
```javascript
// Get top-level subcategories when category is selected
categorySelect.addEventListener('change', async (e) => {
  const categoryId = e.target.value;
  const response = await fetch(
    `/api/admin/subcategories/top-level?category_id=${categoryId}`,
    { headers: { 'Authorization': `Bearer ${adminToken}` } }
  );
  const { data } = await response.json();
  
  // Populate subcategory dropdown
  subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
  data.subcategories.forEach(sub => {
    subcategorySelect.appendChild(new Option(sub.name, sub.id));
  });
});
```

---

#### Step 3: Get Sub-SubCategories (For Dropdown)
**Route:** `GET /api/admin/subcategories/by-parent/:parent_id`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Example:** `GET /api/admin/subcategories/by-parent/10`

**Purpose:** Get sub-subcategories that belong to a parent subcategory (these are the ones you can use for configurations)

**Response:**
```json
{
  "success": true,
  "data": {
    "subcategories": [
      {
        "id": 100,
        "name": "Spherical",
        "slug": "spherical",
        "category_id": 3,
        "parent_id": 10,  // ← Has parent (sub-subcategory)
        "is_active": true
      },
      {
        "id": 101,
        "name": "Astigmatism",
        "slug": "astigmatism",
        "category_id": 3,
        "parent_id": 10,  // ← Has parent (sub-subcategory)
        "is_active": true
      }
    ]
  }
}
```

**Usage:**
```javascript
// Get sub-subcategories when subcategory is selected
subcategorySelect.addEventListener('change', async (e) => {
  const parentId = e.target.value;
  const response = await fetch(
    `/api/admin/subcategories/by-parent/${parentId}`,
    { headers: { 'Authorization': `Bearer ${adminToken}` } }
  );
  const { data } = await response.json();
  
  // Populate sub-subcategory dropdown
  subSubcategorySelect.innerHTML = '<option value="">Select Sub-SubCategory</option>';
  data.subcategories.forEach(sub => {
    subSubcategorySelect.appendChild(new Option(sub.name, sub.id));
  });
});
```

---

### **Flow 2: View All Configurations (List Page)**

#### Get All Contact Lens Configurations
**Route:** `GET /api/admin/contact-lens-configs`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `product_id`: Filter by product ID (optional)
- `category_id`: Filter by category ID (optional)
- `sub_category_id`: Filter by subcategory ID (optional)
- `configuration_type`: Filter by type - `spherical` or `astigmatism` (optional)
- `is_active`: Filter by active status - `true` or `false` (optional)
- `search`: Search in name, display_name, sku, description (optional)

**Example:** 
- `GET /api/admin/contact-lens-configs?page=1&limit=50`
- `GET /api/admin/contact-lens-configs?configuration_type=spherical&is_active=true`
- `GET /api/admin/contact-lens-configs?search=acuvue`

**Purpose:** Display all configurations in admin table/list

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
        "slug": "acuvue-daily-spherical",
        "sku": "ACU-DAILY-SPH-001",
        "configuration_type": "spherical",
        "price": "29.99",
        "stock_quantity": 100,
        "stock_status": "in_stock",
        "is_active": true,
        "right_qty": [30, 90],
        "right_base_curve": [8.5, 8.6],
        "right_diameter": [14.2, 14.3],
        "right_power": [-2.00, -1.75, -1.50],
        "left_qty": [30, 90],
        "left_base_curve": [8.5, 8.6],
        "left_diameter": [14.2, 14.3],
        "left_power": [-2.00, -1.75, -1.50],
        "category": {
          "id": 3,
          "name": "Contact Lenses"
        },
        "subCategory": {
          "id": 100,
          "name": "Spherical",
          "parent": {
            "id": 10,
            "name": "Daily Lenses"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "pages": 1
    }
  }
}
```

**Usage:**
```javascript
// Get all configurations
const response = await fetch(
  '/api/admin/contact-lens-configs?page=1&limit=50',
  { headers: { 'Authorization': `Bearer ${adminToken}` } }
);
const { data } = await response.json();

// Display in table
data.configurations.forEach(config => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${config.id}</td>
    <td>${config.display_name}</td>
    <td>${config.configuration_type}</td>
    <td>$${config.price}</td>
    <td>${config.stock_quantity}</td>
    <td>${config.is_active ? 'Active' : 'Inactive'}</td>
    <td>
      <button onclick="editConfig(${config.id})">Edit</button>
      <button onclick="deleteConfig(${config.id})">Delete</button>
    </td>
  `;
  tableBody.appendChild(row);
});
```

---

### **Flow 3: View Single Configuration**

#### Get Configuration by ID
**Route:** `GET /api/admin/contact-lens-configs/:id`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Example:** `GET /api/admin/contact-lens-configs/1`

**Purpose:** Get full details of a single configuration for edit/view page

**Response:**
```json
{
  "success": true,
  "message": "Contact lens configuration retrieved successfully",
  "data": {
    "configuration": {
      "id": 1,
      "name": "Acuvue Daily Spherical",
      "display_name": "Acuvue Daily - Spherical",
      "slug": "acuvue-daily-spherical",
      "sku": "ACU-DAILY-SPH-001",
      "description": "Daily disposable spherical contact lenses",
      "short_description": "Daily spherical lenses",
      "price": "29.99",
      "compare_at_price": "39.99",
      "cost_price": "15.00",
      "stock_quantity": 100,
      "stock_status": "in_stock",
      "configuration_type": "spherical",
      "spherical_lens_type": "Daily",
      "is_active": true,
      "sort_order": 0,
      "images": ["https://s3.../image1.jpg", "https://s3.../image2.jpg"],
      "color_images": [
        {
          "color": "black",
          "images": ["https://s3.../black1.jpg"]
        }
      ],
      "right_qty": [30, 90],
      "right_base_curve": [8.5, 8.6],
      "right_diameter": [14.2, 14.3],
      "right_power": [-2.00, -1.75, -1.50],
      "left_qty": [30, 90],
      "left_base_curve": [8.5, 8.6],
      "left_diameter": [14.2, 14.3],
      "left_power": [-2.00, -1.75, -1.50],
      "category": {
        "id": 3,
        "name": "Contact Lenses"
      },
      "subCategory": {
        "id": 100,
        "name": "Spherical",
        "parent": {
          "id": 10,
          "name": "Daily Lenses"
        }
      }
    }
  }
}
```

**Usage:**
```javascript
// Get configuration for edit form
async function loadConfiguration(id) {
  const response = await fetch(
    `/api/admin/contact-lens-configs/${id}`,
    { headers: { 'Authorization': `Bearer ${adminToken}` } }
  );
  const { data } = await response.json();
  const config = data.configuration;
  
  // Pre-fill form
  document.getElementById('name').value = config.name;
  document.getElementById('display_name').value = config.display_name;
  document.getElementById('price').value = config.price;
  document.getElementById('configuration_type').value = config.configuration_type;
  
  // Pre-fill parameter arrays
  if (config.right_power) {
    config.right_power.forEach(power => {
      const option = document.createElement('option');
      option.value = power;
      option.textContent = power;
      rightPowerSelect.appendChild(option);
    });
  }
  // ... same for other parameters
}
```

---

### **Flow 4: Create New Configuration**

#### Create Spherical Configuration
**Route:** `POST /api/admin/contact-lens-configs`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data  (for file uploads)
OR
Content-Type: application/json  (without file uploads)
```

**Required Fields:**
- `name`: Configuration name (string, required)
- `display_name`: Name shown in dropdown (string, required)
- `configuration_type`: Must be `"spherical"` (string, required)
- `sub_category_id`: Sub-subcategory ID (number, required - MUST have parent_id)

**Optional Product Fields:**
- `slug`: URL-friendly slug (auto-generated if not provided)
- `sku`: Stock keeping unit (must be unique)
- `description`: Full description
- `short_description`: Short description (max 500 chars)
- `price`: Price (decimal)
- `compare_at_price`: Original/compare price (decimal)
- `cost_price`: Wholesale cost (decimal)
- `stock_quantity`: Stock quantity (integer, default: 0)
- `stock_status`: `in_stock`, `out_of_stock`, `backorder` (default: `in_stock`)
- `frame_shape`: `round`, `square`, `oval`, `cat_eye`, `aviator`, `rectangle`, `wayfarer`, `geometric`
- `frame_material`: `acetate`, `metal`, `tr90`, `titanium`, `wood`, `mixed`
- `frame_color`: Frame color (string)
- `gender`: `men`, `women`, `unisex`, `kids` (default: `unisex`)
- `lens_type`: Lens type enum
- `spherical_lens_type`: Optional lens type name (e.g., "Daily", "Monthly")
- `is_active`: Active status (boolean, default: true)
- `sort_order`: Sort order (integer, default: 0)

**Parameter Fields (Arrays - Multiple Selections):**
- `right_qty`: Array of integers (e.g., `[30, 90]`)
- `right_base_curve`: Array of decimals (e.g., `[8.5, 8.6, 8.7]`)
- `right_diameter`: Array of decimals (e.g., `[14.2, 14.3]`)
- `right_power`: Array of decimals (e.g., `[-2.00, -1.75, -1.50]`)
- `left_qty`: Array of integers (e.g., `[30, 90]`)
- `left_base_curve`: Array of decimals (e.g., `[8.5, 8.6, 8.7]`)
- `left_diameter`: Array of decimals (e.g., `[14.2, 14.3]`)
- `left_power`: Array of decimals (e.g., `[-2.00, -1.75, -1.50]`)

**Image Uploads (multipart/form-data):**
- `images`: Multiple image files (field name: `images`, max 5 files)
- `color_images_{colorName}`: Color-specific images (e.g., `color_images_black`, `color_images_brown`, max 5 per color)

**Example Request (JSON):**
```json
{
  "name": "Acuvue Daily Spherical",
  "display_name": "Acuvue Daily - Spherical",
  "configuration_type": "spherical",
  "sub_category_id": 100,
  "category_id": 3,
  "sku": "ACU-DAILY-SPH-001",
  "price": 29.99,
  "compare_at_price": 39.99,
  "stock_quantity": 100,
  "stock_status": "in_stock",
  "description": "Daily disposable spherical contact lenses",
  "short_description": "Daily spherical lenses",
  "right_qty": [30, 90],
  "right_base_curve": [8.5, 8.6],
  "right_diameter": [14.2, 14.3],
  "right_power": [-2.00, -1.75, -1.50],
  "left_qty": [30, 90],
  "left_base_curve": [8.5, 8.6],
  "left_diameter": [14.2, 14.3],
  "left_power": [-2.00, -1.75, -1.50],
  "is_active": true,
  "sort_order": 0
}
```

**Example Request (Form Data with Images):**
```javascript
const formData = new FormData();
formData.append('name', 'Acuvue Daily Spherical');
formData.append('display_name', 'Acuvue Daily - Spherical');
formData.append('configuration_type', 'spherical');
formData.append('sub_category_id', '100');
formData.append('category_id', '3');
formData.append('price', '29.99');
formData.append('right_power', JSON.stringify([-2.00, -1.75, -1.50]));
formData.append('right_base_curve', JSON.stringify([8.5, 8.6]));
formData.append('right_diameter', JSON.stringify([14.2, 14.3]));
formData.append('right_qty', JSON.stringify([30, 90]));
// ... same for left eye
formData.append('images', file1);
formData.append('images', file2);
formData.append('color_images_black', colorFile1);

const response = await fetch('/api/admin/contact-lens-configs', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${adminToken}` },
  body: formData
});
```

**Validation Rules:**
- ✅ `sub_category_id` MUST be a sub-subcategory (must have `parent_id`)
- ✅ Sub-subcategory name must contain "spherical", "sferiche", or "sferica"
- ✅ If power is provided, base_curve and diameter are required
- ❌ Cannot include cylinder or axis fields (spherical only)

---

#### Create Astigmatism Configuration
**Route:** `POST /api/admin/contact-lens-configs`

**Same as Spherical, but with additional fields:**

**Additional Parameter Fields (Arrays):**
- `right_cylinder`: Array of decimals (e.g., `[-0.25, -0.50, -0.75]`)
- `right_axis`: Array of integers (e.g., `[0, 90, 180]`)
- `left_cylinder`: Array of decimals (e.g., `[-0.25, -0.50, -0.75]`)
- `left_axis`: Array of integers (e.g., `[0, 90, 180]`)

**Example Request:**
```json
{
  "name": "Acuvue Oasys Astigmatism",
  "display_name": "Acuvue Oasys - Astigmatism",
  "configuration_type": "astigmatism",
  "sub_category_id": 101,
  "category_id": 3,
  "price": 49.99,
  "right_power": [-2.00, -1.75],
  "right_base_curve": [8.4, 8.5],
  "right_diameter": [14.3],
  "right_cylinder": [-0.50, -0.75],
  "right_axis": [90, 180],
  "right_qty": [6],
  "left_power": [-2.00, -1.75],
  "left_base_curve": [8.4, 8.5],
  "left_diameter": [14.3],
  "left_cylinder": [-0.50, -0.75],
  "left_axis": [90, 180],
  "left_qty": [6]
}
```

**Validation Rules:**
- ✅ `sub_category_id` MUST be a sub-subcategory (must have `parent_id`)
- ✅ Sub-subcategory name must contain "astigmatism", "astigmatismo", "toric", or "torica"
- ✅ If power is provided, base_curve and diameter are required
- ✅ If cylinder is provided, axis is required

---

### **Flow 5: Update Configuration**

#### Update Configuration
**Route:** `PUT /api/admin/contact-lens-configs/:id`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data  (for file uploads)
OR
Content-Type: application/json  (without file uploads)
```

**Example:** `PUT /api/admin/contact-lens-configs/1`

**Body:** Same fields as create (all optional - only send fields you want to update)

**Example Request:**
```json
{
  "display_name": "Updated Configuration Name",
  "price": 34.99,
  "is_active": true,
  "sort_order": 1,
  "right_power": [-2.00, -1.75, -1.50, -1.25]
}
```

**Usage:**
```javascript
// Update configuration
const response = await fetch('/api/admin/contact-lens-configs/1', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    display_name: 'Updated Name',
    price: 34.99,
    is_active: true
  })
});
```

**Validation Rules:**
- Same as create, but only validates fields that are being updated
- For Spherical: Cannot add cylinder/axis (will be cleared if provided)
- For Astigmatism: If cylinder is updated, axis must also be provided

---

### **Flow 6: Delete Configuration**

#### Delete Configuration
**Route:** `DELETE /api/admin/contact-lens-configs/:id`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Example:** `DELETE /api/admin/contact-lens-configs/1`

**Purpose:** Permanently delete a configuration

**Response:**
```json
{
  "success": true,
  "message": "Contact lens configuration deleted successfully"
}
```

**Usage:**
```javascript
// Delete configuration
const response = await fetch('/api/admin/contact-lens-configs/1', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

**⚠️ Warning:** This action cannot be undone!

---

## 📊 Complete Admin Panel Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL WORKFLOW                      │
└─────────────────────────────────────────────────────────────┘

1. ADMIN LOGIN
   ↓
   POST /api/auth/login
   → Get admin_token
   
2. NAVIGATE TO CONFIGURATIONS PAGE
   ↓
   GET /api/admin/contact-lens-configs
   → Display configurations list
   
3. CLICK "CREATE NEW"
   ↓
   Load form dependencies:
   - GET /api/admin/categories (for category dropdown)
   - GET /api/admin/subcategories/top-level?category_id=X (for subcategory dropdown)
   - GET /api/admin/subcategories/by-parent/:id (for sub-subcategory dropdown)
   
4. FILL CREATE FORM
   ↓
   - Select Category → SubCategory → Sub-SubCategory
   - Enter name, display_name, configuration_type
   - Enter product fields (price, description, etc.)
   - Enter parameter arrays (power, base curve, diameter, etc.)
   - Upload images (optional)
   
5. SUBMIT FORM
   ↓
   POST /api/admin/contact-lens-configs
   → Configuration created
   → Redirect to list page
   
6. EDIT CONFIGURATION
   ↓
   GET /api/admin/contact-lens-configs/:id
   → Load configuration data
   → Pre-fill form
   → User modifies fields
   → PUT /api/admin/contact-lens-configs/:id
   → Configuration updated
   
7. DELETE CONFIGURATION
   ↓
   DELETE /api/admin/contact-lens-configs/:id
   → Configuration deleted
   → Refresh list
```

---

## 🔑 Key Admin Routes Summary

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/auth/login` | POST | Admin login | No |
| `/api/admin/categories` | GET | Get all categories | Yes |
| `/api/admin/subcategories/top-level` | GET | Get top-level subcategories | Yes |
| `/api/admin/subcategories/by-parent/:id` | GET | Get sub-subcategories | Yes |
| `/api/admin/contact-lens-configs` | GET | List all configurations | Yes |
| `/api/admin/contact-lens-configs/:id` | GET | Get single configuration | Yes |
| `/api/admin/contact-lens-configs` | POST | Create configuration | Yes |
| `/api/admin/contact-lens-configs/:id` | PUT | Update configuration | Yes |
| `/api/admin/contact-lens-configs/:id` | DELETE | Delete configuration | Yes |

---

## 💡 Implementation Examples

### **Example 1: Complete Create Form Flow**

```javascript
// 1. Load categories
async function loadCategories() {
  const response = await fetch('/api/admin/categories', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const { data } = await response.json();
  data.categories.forEach(cat => {
    categorySelect.appendChild(new Option(cat.name, cat.id));
  });
}

// 2. Load subcategories when category selected
categorySelect.addEventListener('change', async (e) => {
  const categoryId = e.target.value;
  const response = await fetch(
    `/api/admin/subcategories/top-level?category_id=${categoryId}`,
    { headers: { 'Authorization': `Bearer ${adminToken}` } }
  );
  const { data } = await response.json();
  
  subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
  data.subcategories.forEach(sub => {
    subcategorySelect.appendChild(new Option(sub.name, sub.id));
  });
});

// 3. Load sub-subcategories when subcategory selected
subcategorySelect.addEventListener('change', async (e) => {
  const parentId = e.target.value;
  const response = await fetch(
    `/api/admin/subcategories/by-parent/${parentId}`,
    { headers: { 'Authorization': `Bearer ${adminToken}` } }
  );
  const { data } = await response.json();
  
  subSubcategorySelect.innerHTML = '<option value="">Select Sub-SubCategory</option>';
  data.subcategories.forEach(sub => {
    subSubcategorySelect.appendChild(new Option(sub.name, sub.id));
  });
});

// 4. Submit form
async function createConfiguration() {
  const formData = new FormData();
  
  // Basic fields
  formData.append('name', document.getElementById('name').value);
  formData.append('display_name', document.getElementById('display_name').value);
  formData.append('configuration_type', document.getElementById('configuration_type').value);
  formData.append('sub_category_id', subSubcategorySelect.value);
  formData.append('category_id', categorySelect.value);
  formData.append('price', document.getElementById('price').value);
  
  // Parameter arrays (convert to JSON strings)
  const rightPower = Array.from(rightPowerSelect.selectedOptions).map(o => parseFloat(o.value));
  formData.append('right_power', JSON.stringify(rightPower));
  
  const rightBaseCurve = Array.from(rightBaseCurveSelect.selectedOptions).map(o => parseFloat(o.value));
  formData.append('right_base_curve', JSON.stringify(rightBaseCurve));
  
  // ... same for other parameters
  
  // Images
  const imageFiles = document.getElementById('images').files;
  for (let file of imageFiles) {
    formData.append('images', file);
  }
  
  const response = await fetch('/api/admin/contact-lens-configs', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    alert('Configuration created successfully!');
    window.location.href = '/admin/contact-lens-configs';
  }
}
```

---

### **Example 2: Multi-Select Parameter Fields**

```javascript
// Create multi-select dropdowns for parameters
function createParameterMultiSelect(name, options) {
  const select = document.createElement('select');
  select.id = name;
  select.multiple = true;
  select.size = 5;
  
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    select.appendChild(opt);
  });
  
  return select;
}

// Usage
const rightPowerSelect = createParameterMultiSelect('right_power', [
  -10.00, -9.75, -9.50, -9.25, -9.00,
  -8.75, -8.50, -8.25, -8.00, -7.75,
  // ... more options
]);

// Get selected values as array
const selectedPowers = Array.from(rightPowerSelect.selectedOptions)
  .map(opt => parseFloat(opt.value));
// Result: [-2.00, -1.75, -1.50]
```

---

## ⚠️ Important Notes

### **Authentication**
- All admin routes require `Authorization: Bearer {{admin_token}}` header
- Token is obtained from `POST /api/auth/login`
- Token expires after a certain time (check your auth configuration)

### **Sub-SubCategory Requirement**
- ⚠️ **CRITICAL**: `sub_category_id` MUST be a sub-subcategory (must have `parent_id`)
- Top-level subcategories (with `parent_id: null`) cannot be used
- Use `GET /api/admin/subcategories/by-parent/:id` to get valid sub-subcategories

### **Parameter Arrays**
- All parameter fields accept **arrays** (multiple selections)
- Send as JSON strings in form data: `JSON.stringify([-2.00, -1.75, -1.50])`
- Or send as arrays in JSON: `"right_power": [-2.00, -1.75, -1.50]`
- Single values are automatically converted to arrays

### **File Uploads**
- Use `multipart/form-data` content type for file uploads
- Field name: `images` (multiple files)
- Field name: `color_images_{colorName}` (color-specific images)
- Max 5 files per field

### **Validation**
- Sub-subcategory name must match configuration type:
  - Spherical: name contains "spherical", "sferiche", or "sferica"
  - Astigmatism: name contains "astigmatism", "astigmatismo", "toric", or "torica"
- Base curve and diameter required when power is provided
- For astigmatism: axis required when cylinder is provided

---

## 📚 Related Documentation

- `CONTACT_LENS_WEBSITE_ROUTES.md` - Website (public) routes
- `OptyShop_API.postman_collection.json` - Complete Postman collection
- `SUB_SUBCATEGORY_ROUTES.md` - Subcategory management routes

---

**Last Updated:** Based on Postman Collection v1.0
**System:** Contact Lens Configuration System
**Environment:** Admin Panel (Authenticated Routes)

