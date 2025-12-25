# Contact Lens Forms System - Complete Documentation

## Overview

The Contact Lens Forms System provides a dynamic form interface for contact lens products based on sub-sub-category selection. **ALL form fields are dropdowns managed by the admin panel** - no manual input fields. The system supports two form types:
- **Spherical**: Form with dropdowns for Qty, Base Curve (B.C), Diameter (DIA), and Power (PWR)
- **Astigmatism**: Advanced form with dropdowns for Qty, Base Curve (B.C), Diameter (DIA), Power (PWR), Cylinder (CYL), and Axis (AX)

## System Architecture

### 1. Database Models

#### `AstigmatismDropdownValue`
Stores dropdown values for contact lens forms (used by both Spherical and Astigmatism):
- `field_type`: `power` (used in both forms), `cylinder` (Astigmatism only), or `axis` (Astigmatism only)
- `value`: The actual value (e.g., "-2.00", "0.25", "180")
- `label`: Display label (optional)
- `eye_type`: `left`, `right`, `both`, or `null` (for both)
- `is_active`: Boolean flag
- `sort_order`: For ordering

#### `ContactLensConfiguration`
Stores Spherical configurations:
- `configuration_type`: `spherical` or `astigmatism`
- Parameter fields stored as JSON arrays (allows multiple values):
  - `right_qty`, `right_base_curve`, `right_diameter`
  - `left_qty`, `left_base_curve`, `left_diameter`
  - `right_power`, `left_power` (used in both Spherical and Astigmatism forms)
  - `right_cylinder`, `left_cylinder`, `right_axis`, `left_axis` (Astigmatism only)

### 2. API Endpoints

#### Public/Website Routes

##### Get Form Configuration
```
GET /api/contact-lens-forms/config/:sub_category_id
```
**Description**: Returns form structure based on sub-sub-category type.

**Response for Spherical**:
```json
{
  "success": true,
  "data": {
    "formType": "spherical",
    "subCategory": { "id": 1, "name": "Spherical", "slug": "spherical" },
    "formFields": {
      "rightEye": {
        "qty": {
          "type": "select",
          "label": "Qty",
          "required": true,
          "options": [
            { "value": "1", "label": "1" },
            { "value": "2", "label": "2" },
            { "value": "3", "label": "3" }
          ]
        },
        "baseCurve": {
          "type": "select",
          "label": "Raggio Base (B.C)",
          "required": true,
          "options": [
            { "value": "8.6", "label": "8.6" },
            { "value": "8.7", "label": "8.7" },
            { "value": "8.8", "label": "8.8" }
          ]
        },
        "diameter": {
          "type": "select",
          "label": "Diametro (DIA)",
          "required": true,
          "options": [
            { "value": "14.0", "label": "14.0" },
            { "value": "14.2", "label": "14.2" },
            { "value": "14.5", "label": "14.5" }
          ]
        },
        "power": {
          "type": "select",
          "label": "* Power (PWR)",
          "required": true,
          "options": [
            { "value": "-2.00", "label": "-2.00 D" },
            { "value": "-1.75", "label": "-1.75 D" }
          ]
        }
      },
      "leftEye": { /* same structure with all dropdowns */ }
    },
    "dropdownValues": {
      "qty": [ /* qty values */ ],
      "base_curve": [ /* base curve values */ ],
      "diameter": [ /* diameter values */ ],
      "power": [ /* power values */ ]
    }
  }
}
```

**Response for Astigmatism**:
```json
{
  "success": true,
  "data": {
    "formType": "astigmatism",
    "subCategory": { "id": 2, "name": "Astigmatism", "slug": "astigmatism" },
    "formFields": {
      "rightEye": {
        "qty": { "type": "select", "label": "Qty", "required": true, "options": [ /* ... */ ] },
        "baseCurve": { "type": "select", "label": "Raggio Base (B.C)", "required": true, "options": [ /* ... */ ] },
        "diameter": { "type": "select", "label": "Diametro (DIA)", "required": true, "options": [ /* ... */ ] }
      },
      "leftEye": {
        "qty": { "type": "select", "label": "Qty", "required": true, "options": [ /* ... */ ] },
        "baseCurve": { "type": "select", "label": "Raggio Base (B.C)", "required": true, "options": [ /* ... */ ] },
        "diameter": { "type": "select", "label": "Diametro (DIA)", "required": true, "options": [ /* ... */ ] },
        "leftPower": {
          "type": "select",
          "label": "* Occhio Sinistro PWR Power",
          "required": true,
          "options": [
            { "value": "-2.00", "label": "-2.00 D" },
            { "value": "-1.75", "label": "-1.75 D" }
          ]
        },
        "rightPower": { /* ... */ },
        "leftCylinder": { /* ... */ },
        "rightCylinder": { /* ... */ },
        "leftAxis": { /* ... */ },
        "rightAxis": { /* ... */ }
      }
    },
    "dropdownValues": {
      "qty": [ /* ... */ ],
      "base_curve": [ /* ... */ ],
      "diameter": [ /* ... */ ],
      "power": [ /* ... */ ],
      "cylinder": [ /* ... */ ],
      "axis": [ /* ... */ ]
    }
  }
}
```

##### Get Dropdown Values (Public)
```
GET /api/contact-lens-forms/astigmatism/dropdown-values?field_type=power&eye_type=left
```
**Query Parameters**:
- `field_type` (optional): `qty`, `base_curve`, `diameter`, `power`, `cylinder`, or `axis`
- `eye_type` (optional): `left`, `right`, or `both`

##### Get Spherical Configurations (Public)
```
GET /api/contact-lens-forms/spherical?sub_category_id=1
```
**Query Parameters**:
- `sub_category_id` (optional): Filter by sub-sub-category

#### Checkout Route (Authenticated)

##### Add Contact Lens to Cart
```
POST /api/contact-lens-forms/checkout
Authorization: Bearer {access_token}
```

**Request Body for Spherical**:
```json
{
  "product_id": 1,
  "form_type": "spherical",
  "right_qty": "1",
  "right_base_curve": "8.7",
  "right_diameter": "14.0",
  "right_power": "-2.00",
  "left_qty": "1",
  "left_base_curve": "8.7",
  "left_diameter": "14.0",
  "left_power": "-2.25"
}
```

**Request Body for Astigmatism**:
```json
{
  "product_id": 1,
  "form_type": "astigmatism",
  "right_qty": 1,
  "right_base_curve": 8.6,
  "right_diameter": 14.5,
  "left_qty": 1,
  "left_base_curve": 8.6,
  "left_diameter": 14.5,
  "left_power": "-2.00",
  "right_power": "-2.25",
  "left_cylinder": "-0.25",
  "right_cylinder": "-0.50",
  "left_axis": 180,
  "right_axis": 90
}
```

**Response**:
```json
{
  "success": true,
  "message": "Contact lens added to cart successfully",
  "data": {
    "item": {
      "id": 1,
      "product_id": 1,
      "quantity": 2,
      "contact_lens_right_qty": 1,
      "contact_lens_right_base_curve": 8.7,
      "contact_lens_right_diameter": 14.0,
      "contact_lens_left_qty": 1,
      "contact_lens_left_base_curve": 8.7,
      "contact_lens_left_diameter": 14.0,
      "contact_lens_left_power": -2.00,
      "contact_lens_right_power": -2.25,
      "customization": {
        "left_cylinder": -0.25,
        "right_cylinder": -0.50,
        "left_axis": 180,
        "right_axis": 90
      }
    }
  }
}
```

#### Admin Routes (Authenticated - Admin/Staff Only)

##### Spherical Configurations CRUD

**Get All Spherical Configs**:
```
GET /api/contact-lens-forms/admin/spherical?page=1&limit=50&sub_category_id=1
```

**Create Spherical Config**:
```
POST /api/contact-lens-forms/admin/spherical
```
**Request Body**:
```json
{
  "name": "Daily Spherical Config",
  "sub_category_id": 1,
  "right_qty": [1, 2, 3],
  "right_base_curve": [8.6, 8.7, 8.8],
  "right_diameter": [14.0, 14.2, 14.5],
  "left_qty": [1, 2, 3],
  "left_base_curve": [8.6, 8.7, 8.8],
  "left_diameter": [14.0, 14.2, 14.5],
  "price": 29.99,
  "display_name": "Daily Spherical"
}
```

**Update Spherical Config**:
```
PUT /api/contact-lens-forms/admin/spherical/:id
```

**Delete Spherical Config**:
```
DELETE /api/contact-lens-forms/admin/spherical/:id
```

##### Astigmatism Dropdown Values CRUD

**Get All Dropdown Values**:
```
GET /api/contact-lens-forms/admin/astigmatism/dropdown-values?field_type=power&eye_type=left
```

**Create Dropdown Value**:
```
POST /api/contact-lens-forms/admin/astigmatism/dropdown-values
```
**Request Body**:
```json
{
  "field_type": "power",
  "value": "-2.00",
  "label": "-2.00 D",
  "eye_type": "both",
  "sort_order": 0
}
```

**Update Dropdown Value**:
```
PUT /api/contact-lens-forms/admin/astigmatism/dropdown-values/:id
```

**Delete Dropdown Value**:
```
DELETE /api/contact-lens-forms/admin/astigmatism/dropdown-values/:id
```

## How It Works - Complete Flow

### 1. User Selects Sub-Sub-Category

When a user navigates to a contact lens product and selects a sub-sub-category:

```
User Action: Select "Spherical" or "Astigmatism" sub-sub-category
↓
Frontend: GET /api/contact-lens-forms/config/{sub_category_id}
↓
Backend: 
  - Checks if sub-category has parent_id (must be sub-sub-category)
  - Determines form type from sub-category name
  - Returns appropriate form structure
```

### 2. Form Display

**For Spherical**:
- Frontend displays form with ALL fields as dropdowns (from admin-managed values):
  - Right Eye: Qty dropdown, Base Curve (B.C) dropdown, Diameter (DIA) dropdown, Power (PWR) dropdown
  - Left Eye: Qty dropdown, Base Curve (B.C) dropdown, Diameter (DIA) dropdown, Power (PWR) dropdown

**For Astigmatism**:
- Frontend displays advanced form with ALL fields as dropdowns (from admin-managed values):
  - Right Eye: Qty dropdown, Base Curve (B.C) dropdown, Diameter (DIA) dropdown
  - Left Eye: Qty dropdown, Base Curve (B.C) dropdown, Diameter (DIA) dropdown
  - Left Power dropdown, Right Power dropdown
  - Left Cylinder dropdown, Right Cylinder dropdown
  - Left Axis dropdown, Right Axis dropdown

### 3. Admin Management

**Setting Up Spherical Configurations**:
1. Admin creates Spherical configurations via admin panel
2. Each config can have multiple values (arrays) for each parameter
3. These are used as reference/defaults for the form

**Setting Up Dropdown Values (ALL fields for both Spherical and Astigmatism)**:
1. Admin creates dropdown values for ALL field types:
   - **Qty** (both forms): e.g., 1, 2, 3, 6, 12, etc.
   - **Base Curve** (both forms): e.g., 8.6, 8.7, 8.8, 8.9, etc.
   - **Diameter** (both forms): e.g., 14.0, 14.2, 14.5, etc.
   - **Power** (both forms): e.g., -2.00, -1.75, -1.50, etc.
   - **Cylinder** (Astigmatism only): e.g., -0.25, -0.50, -0.75, etc.
   - **Axis** (Astigmatism only): e.g., 0, 90, 180, etc.
2. Each value can be specific to left eye, right eye, or both
3. Values are sorted by `sort_order` and `value`
4. Qty, Base Curve, Diameter, and Power values are shared between Spherical and Astigmatism forms

### 4. User Fills Form and Checks Out

**Spherical Flow**:
```
User fills form (including Power dropdown selection) → 
POST /api/contact-lens-forms/checkout with form data (including power values) →
Backend validates and creates CartItem with contact lens fields (including power) →
Item added to cart →
User proceeds to checkout/order
```

**Astigmatism Flow**:
```
User fills form (including dropdown selections) →
POST /api/contact-lens-forms/checkout with all form data →
Backend validates and creates CartItem with:
  - Basic contact lens fields
  - Power values
  - Cylinder and Axis stored in customization JSON →
Item added to cart →
User proceeds to checkout/order
```

### 5. Cart and Order Processing

- Cart items store all contact lens parameters
- When order is created, these parameters are preserved in `OrderItem`
- Order processing can use these parameters for fulfillment

## Data Storage

### CartItem Fields for Contact Lenses:
- `contact_lens_right_qty`: Integer
- `contact_lens_right_base_curve`: Decimal(5,2)
- `contact_lens_right_diameter`: Decimal(5,2)
- `contact_lens_right_power`: Decimal(5,2) (for astigmatism)
- `contact_lens_left_qty`: Integer
- `contact_lens_left_base_curve`: Decimal(5,2)
- `contact_lens_left_diameter`: Decimal(5,2)
- `contact_lens_left_power`: Decimal(5,2) (for astigmatism)
- `customization`: JSON string (stores cylinder and axis for astigmatism)

### OrderItem Fields:
Same structure as CartItem, ensuring all contact lens specifications are preserved in orders.

## Key Features

1. **Dynamic Form Detection**: Automatically detects form type based on sub-sub-category name
2. **Multiple Values Support**: Spherical configs support arrays of values for flexibility
3. **Admin-Managed Dropdowns**: Astigmatism dropdown values are fully managed by admin
4. **Eye-Specific Values**: Dropdown values can be specific to left, right, or both eyes
5. **Complete Checkout Integration**: Seamlessly integrates with existing cart and order system

## Error Handling

- Invalid sub-sub-category: Returns 404 if not found
- Not a sub-sub-category: Returns 400 if parent_id is null
- Unknown form type: Returns 400 if sub-category name doesn't match "spherical" or "astigmatism"
- Missing required fields: Returns 400 with validation errors
- Insufficient stock: Returns 400 if product stock is insufficient

## Testing

Use the Postman collection endpoints:
- **Website (Public) > Contact Lens Forms (Public)**: Test public endpoints
- **Admin > Contact Lens Forms (Admin)**: Test admin CRUD operations

## Migration

Run the migration to create the `astigmatism_dropdown_values` table:
```bash
npx prisma migrate deploy
```

Or for development:
```bash
npx prisma migrate dev
```

## Summary

The Contact Lens Forms System provides a complete solution for:
1. ✅ Dynamic form rendering based on sub-sub-category
2. ✅ Admin management of form configurations and dropdown values
3. ✅ Seamless checkout integration
4. ✅ Complete data preservation through cart and order lifecycle

All endpoints are documented in the Postman collection and ready for frontend integration.

