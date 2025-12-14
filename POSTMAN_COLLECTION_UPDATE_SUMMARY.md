# Postman Collection Update Summary

## ✅ Updates Made to OptyShop_API.postman_collection.json

### 1. **Products Section (Public) - Added 2 New Endpoints**

#### Get Product Configuration
- **Method:** GET
- **URL:** `/api/products/:id/configuration`
- **Description:** Get all lens configuration options for a product including prescription lens types, thickness materials, thickness options, treatments, and colors.

#### Get All Lens Types
- **Method:** GET
- **URL:** `/api/products/configuration/lens-types`
- **Description:** Get all prescription lens types (Distance Vision, Near Vision, Progressive) with their variants and colors.

---

### 2. **Lens Options & Treatments Section (Public) - Added 4 New Endpoints**

#### Get Lens Thickness Materials
- **Method:** GET
- **URL:** `/api/lens/thickness-materials`
- **Description:** Get all active lens thickness materials (Unbreakable/Plastic, Minerals/Glass) with prices.

#### Get Lens Thickness Material by ID
- **Method:** GET
- **URL:** `/api/lens/thickness-materials/:id`
- **Description:** Get a single lens thickness material by ID.

#### Get Lens Thickness Options
- **Method:** GET
- **URL:** `/api/lens/thickness-options`
- **Description:** Get all active lens thickness dropdown options (Thin, Medium, Thick, etc.).

#### Get Lens Thickness Option by ID
- **Method:** GET
- **URL:** `/api/lens/thickness-options/:id`
- **Description:** Get a single lens thickness option by ID.

---

### 3. **Cart Section (Customer) - Updated 1 Endpoint**

#### Add to Cart (Updated)
- **Method:** POST
- **URL:** `/api/cart/items`
- **Updated Request Body:** Now includes full lens configuration fields:
  ```json
  {
    "product_id": 89,
    "quantity": 1,
    "lens_type": "progressive",
    "prescription_data": {
      "pd": 64,
      "pd_right": 32,
      "h": 18,
      "od": {"sph": -2.0, "cyl": -0.5, "axis": 90},
      "os": {"sph": -2.0, "cyl": -0.5, "axis": 90},
      "year_of_birth": 1980
    },
    "progressive_variant_id": 1,
    "lens_thickness_material_id": 2,
    "lens_thickness_option_id": 3,
    "treatment_ids": [1, 2],
    "photochromic_color_id": 1,
    "prescription_sun_color_id": null
  }
  ```
- **New Fields Added:**
  - `lens_type`: "distance_vision" | "near_vision" | "progressive"
  - `prescription_data`: Complete prescription object
  - `progressive_variant_id`: Progressive variant ID
  - `lens_thickness_material_id`: Thickness material ID
  - `lens_thickness_option_id`: Thickness option ID
  - `treatment_ids`: Array of treatment IDs
  - `photochromic_color_id`: Photochromic color ID
  - `prescription_sun_color_id`: Prescription sun color ID

---

### 4. **Admin Section - Added 2 New Sections**

#### Lens Thickness Materials (Admin) - 5 Endpoints
1. **Get All Lens Thickness Materials**
   - GET `/api/admin/lens-thickness-materials`
   - Query params: `page`, `limit`, `isActive`

2. **Get Lens Thickness Material by ID**
   - GET `/api/admin/lens-thickness-materials/:id`

3. **Create Lens Thickness Material**
   - POST `/api/admin/lens-thickness-materials`
   - Body: `name`, `slug`, `description`, `price`, `is_active`, `sort_order`

4. **Update Lens Thickness Material**
   - PUT `/api/admin/lens-thickness-materials/:id`

5. **Delete Lens Thickness Material**
   - DELETE `/api/admin/lens-thickness-materials/:id`

#### Lens Thickness Options (Admin) - 5 Endpoints
1. **Get All Lens Thickness Options**
   - GET `/api/admin/lens-thickness-options`
   - Query params: `page`, `limit`, `isActive`

2. **Get Lens Thickness Option by ID**
   - GET `/api/admin/lens-thickness-options/:id`

3. **Create Lens Thickness Option**
   - POST `/api/admin/lens-thickness-options`
   - Body: `name`, `slug`, `description`, `thickness_value`, `is_active`, `sort_order`

4. **Update Lens Thickness Option**
   - PUT `/api/admin/lens-thickness-options/:id`

5. **Delete Lens Thickness Option**
   - DELETE `/api/admin/lens-thickness-options/:id`

---

## 📊 Summary

- **Total New Endpoints Added:** 16
  - Public Endpoints: 6
  - Admin Endpoints: 10
- **Updated Endpoints:** 1 (Add to Cart)
- **Total Sections Added:** 2 (Admin sections)

---

## 🎯 How to Use

1. **Import the Collection:**
   - Open Postman
   - Click "Import"
   - Select `OptyShop_API.postman_collection.json`

2. **Set Variables:**
   - `base_url`: http://localhost:5000
   - `access_token`: Your customer JWT token
   - `admin_token`: Your admin JWT token

3. **Test the Endpoints:**
   - Start with public endpoints (no auth required)
   - Use customer endpoints with `access_token`
   - Use admin endpoints with `admin_token`

---

## 📝 Example Requests

### Get Product Configuration (Public)
```
GET {{base_url}}/api/products/89/configuration
```

### Add to Cart with Full Configuration (Customer)
```
POST {{base_url}}/api/cart/items
Authorization: Bearer {{access_token}}
Body: {
  "product_id": 89,
  "lens_type": "progressive",
  "prescription_data": {...},
  "progressive_variant_id": 1,
  "lens_thickness_material_id": 2,
  "lens_thickness_option_id": 3,
  "treatment_ids": [1, 2]
}
```

### Create Lens Thickness Material (Admin)
```
POST {{base_url}}/api/admin/lens-thickness-materials
Authorization: Bearer {{admin_token}}
Body: {
  "name": "Unbreakable (Plastic)",
  "price": 30.00,
  "is_active": true
}
```

---

All endpoints are ready to test! 🚀

