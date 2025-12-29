# Prescription Forms API Documentation

## Overview

This system allows admins to manage dropdown values for prescription forms (Progressive Vision, Near Vision, Distance Vision) and provides public endpoints for the frontend to fetch these values and submit forms.

## Route Structure

### Base URL
All routes are prefixed with `/api/prescription-forms`

---

## 🔐 ADMIN ROUTES (Protected - Requires Admin/Staff Authentication)

### 1. Get All Dropdown Values (Admin)
**Route:** `GET /api/prescription-forms/admin/dropdown-values`  
**Access:** Admin/Staff only  
**Authentication:** Required (Bearer token)

**Query Parameters:**
- `field_type` (optional): Filter by field type (`pd`, `sph`, `cyl`, `axis`, `h`, `year_of_birth`, `select_option`)
- `eye_type` (optional): Filter by eye type (`left`, `right`, `both`)
- `form_type` (optional): Filter by form type (`progressive`, `near_vision`, `distance_vision`)

**Response:**
```json
{
  "success": true,
  "message": "Prescription form dropdown values retrieved successfully",
  "data": {
    "values": [...],
    "grouped": {
      "pd": [...],
      "sph": [...],
      "cyl": [...],
      "axis": [...],
      "h": [...],
      "year_of_birth": [...],
      "select_option": [...]
    }
  }
}
```

**Example:**
```bash
GET /api/prescription-forms/admin/dropdown-values?field_type=sph&form_type=progressive
Authorization: Bearer {admin_token}
```

---

### 2. Create Dropdown Value (Admin)
**Route:** `POST /api/prescription-forms/admin/dropdown-values`  
**Access:** Admin/Staff only  
**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "field_type": "sph",
  "value": "-2.00",
  "label": "-2.00 D",
  "eye_type": "both",
  "form_type": "progressive",
  "sort_order": 0
}
```

**Field Types:**
- `pd` - Pupillary Distance
- `sph` - Sphere (Spherical power)
- `cyl` - Cylinder
- `axis` - Axis
- `h` - H value (for Progressive)
- `year_of_birth` - Year of Birth
- `select_option` - Select Option

**Eye Types:**
- `left` - Left eye only
- `right` - Right eye only
- `both` - Both eyes (or null)

**Form Types:**
- `progressive` - Progressive Vision form
- `near_vision` - Near Vision form
- `distance_vision` - Distance Vision form
- `null` - Available for all forms

**Response:**
```json
{
  "success": true,
  "message": "Prescription form dropdown value created successfully",
  "data": {
    "value": {
      "id": 1,
      "field_type": "sph",
      "value": "-2.00",
      "label": "-2.00 D",
      "eye_type": "both",
      "form_type": "progressive",
      "is_active": true,
      "sort_order": 0
    }
  }
}
```

---

### 3. Update Dropdown Value (Admin)
**Route:** `PUT /api/prescription-forms/admin/dropdown-values/:id`  
**Access:** Admin/Staff only  
**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "value": "-2.25",
  "label": "-2.25 D",
  "is_active": true,
  "sort_order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prescription form dropdown value updated successfully",
  "data": {
    "value": {...}
  }
}
```

---

### 4. Delete Dropdown Value (Admin)
**Route:** `DELETE /api/prescription-forms/admin/dropdown-values/:id`  
**Access:** Admin/Staff only  
**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "message": "Prescription form dropdown value deleted successfully"
}
```

---

## 🌐 PUBLIC ROUTES (No Authentication Required)

### 1. Get Dropdown Values (Public)
**Route:** `GET /api/prescription-forms/dropdown-values`  
**Access:** Public (No authentication)

**Query Parameters:**
- `field_type` (optional): Filter by field type
- `eye_type` (optional): Filter by eye type
- `form_type` (optional): Filter by form type

**Note:** Only returns `is_active: true` values

**Response:**
```json
{
  "success": true,
  "message": "Prescription form dropdown values retrieved successfully",
  "data": {
    "values": [...],
    "grouped": {
      "pd": [...],
      "sph": [...],
      "cyl": [...],
      "axis": [...],
      "h": [...],
      "year_of_birth": [...],
      "select_option": [...]
    }
  }
}
```

---

### 2. Get Form Structure (Public)
**Route:** `GET /api/prescription-forms/:form_type`  
**Access:** Public (No authentication)

**Valid form_type values:**
- `progressive` - Progressive Vision form
- `near_vision` - Near Vision form
- `distance_vision` - Distance Vision form

**Response:**
```json
{
  "success": true,
  "message": "Prescription form structure retrieved successfully",
  "data": {
    "formType": "progressive",
    "dropdownValues": {
      "pd": [...],
      "h": [...],
      "year_of_birth": [...],
      "select_option": [...],
      "rightEye": {
        "sph": [...],
        "cyl": [...],
        "axis": [...]
      },
      "leftEye": {
        "sph": [...],
        "cyl": [...],
        "axis": [...]
      }
    }
  }
}
```

**Example:**
```bash
GET /api/prescription-forms/progressive
GET /api/prescription-forms/near_vision
GET /api/prescription-forms/distance_vision
```

---

### 3. Submit Prescription Form (Public)
**Route:** `POST /api/prescription-forms/submit`  
**Access:** Public (No authentication)

**Request Body:**
```json
{
  "form_type": "progressive",
  "pd": "64",
  "pd_right": "32",
  "h": "18",
  "right_eye_sph": "-2.00",
  "right_eye_cyl": "-0.50",
  "right_eye_axis": "90",
  "left_eye_sph": "-2.00",
  "left_eye_cyl": "-0.50",
  "left_eye_axis": "90",
  "select_option": "premium",
  "year_of_birth": "1980"
}
```

**With Copy Left to Right Feature:**
```json
{
  "form_type": "progressive",
  "pd": "64",
  "pd_right": "32",
  "h": "18",
  "left_eye_sph": "-2.00",
  "left_eye_cyl": "-0.50",
  "left_eye_axis": "90",
  "copy_left_to_right": true,
  "select_option": "premium",
  "year_of_birth": "1980"
}
```

**Note:** When `copy_left_to_right: true` or `same_for_both_eyes: true` is set:
- Left eye values (SPH, CYL, AXIS) are automatically copied to right eye
- Right eye parameters can be omitted
- Right eye will be filled with left eye values

**Response:**
```json
{
  "success": true,
  "message": "Prescription form submitted successfully",
  "data": {
    "prescription": {
      "form_type": "progressive",
      "pd": "64",
      "pd_right": "32",
      "h": "18",
      "right_eye": {
        "sph": "-2.00",
        "cyl": "-0.50",
        "axis": "90"
      },
      "left_eye": {
        "sph": "-2.00",
        "cyl": "-0.50",
        "axis": "90"
      },
      "select_option": "premium",
      "year_of_birth": "1980",
      "copied_left_to_right": true
    }
  }
}
```

---

## 🔄 How Copy Left to Right Works

When a user fills in the **Left Eye** fields and clicks a "Copy Left to Right" or "Same for Both Eyes" button:

1. Frontend sends `copy_left_to_right: true` in the request
2. Backend automatically copies:
   - `left_eye_sph` → `right_eye_sph`
   - `left_eye_cyl` → `right_eye_cyl`
   - `left_eye_axis` → `right_eye_axis`
3. Right eye fields are populated automatically
4. Response includes `copied_left_to_right: true` flag

**Frontend Implementation Example:**
```javascript
// When user clicks "Copy Left to Right" button
const formData = {
  form_type: 'progressive',
  pd: '64',
  left_eye_sph: '-2.00',
  left_eye_cyl: '-0.50',
  left_eye_axis: '90',
  copy_left_to_right: true  // This triggers the copy
};

// Submit to backend
fetch('/api/prescription-forms/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

---

## 📋 Route Order & Security

Routes are ordered to prevent conflicts:

1. **Admin routes first** (more specific, protected)
   - `/admin/dropdown-values` - Specific admin routes
   
2. **Public routes** (less specific, no auth)
   - `/dropdown-values` - Specific public route
   - `/submit` - Specific public route
   - `/:form_type` - Dynamic route (last to avoid conflicts)

This ensures:
- Admin routes are protected by authentication middleware
- Public routes are accessible without authentication
- Dynamic routes don't interfere with admin routes

---

## 🎯 Complete Flow Example

### Step 1: Admin Creates Dropdown Values
```bash
POST /api/prescription-forms/admin/dropdown-values
Authorization: Bearer {admin_token}
{
  "field_type": "sph",
  "value": "-2.00",
  "label": "-2.00 D",
  "eye_type": "both",
  "form_type": "progressive"
}
```

### Step 2: Frontend Fetches Form Structure
```bash
GET /api/prescription-forms/progressive
```

### Step 3: User Fills Form & Submits
```bash
POST /api/prescription-forms/submit
{
  "form_type": "progressive",
  "pd": "64",
  "left_eye_sph": "-2.00",
  "left_eye_cyl": "-0.50",
  "left_eye_axis": "90",
  "copy_left_to_right": true
}
```

### Step 4: Backend Processes & Returns
- Right eye values are automatically filled from left eye
- Response includes complete prescription data

---

## ✅ Verification Checklist

- ✅ Admin routes are protected with `protect` and `authorize('admin', 'staff')`
- ✅ Public routes are accessible without authentication
- ✅ Route order prevents conflicts (admin routes before dynamic routes)
- ✅ Copy left to right feature works correctly
- ✅ Form types are validated (progressive, near_vision, distance_vision)
- ✅ Field types are validated (pd, sph, cyl, axis, h, year_of_birth, select_option)
- ✅ Only active values are returned in public endpoints
- ✅ All routes are registered in `server.js`

---

## 🚀 Testing the Routes

### Test Admin Routes:
```bash
# Get admin token first
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}

# Then use the token
GET /api/prescription-forms/admin/dropdown-values
Authorization: Bearer {token}
```

### Test Public Routes:
```bash
# No authentication needed
GET /api/prescription-forms/dropdown-values
GET /api/prescription-forms/progressive
POST /api/prescription-forms/submit
```

---

## 📝 Notes

1. **Database Migration Required:**
   ```bash
   npx prisma migrate dev --name add_prescription_form_dropdown_values
   npx prisma generate
   ```

2. **Form Type Mapping:**
   - Progressive Vision → `form_type: "progressive"`
   - Near Vision → `form_type: "near_vision"`
   - Distance Vision → `form_type: "distance_vision"`

3. **Field Type Mapping:**
   - PD → `field_type: "pd"`
   - SPH → `field_type: "sph"`
   - CYL → `field_type: "cyl"`
   - AXIS → `field_type: "axis"`
   - H → `field_type: "h"`
   - Year of Birth → `field_type: "year_of_birth"`
   - Select Option → `field_type: "select_option"`

