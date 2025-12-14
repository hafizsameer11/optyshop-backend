# Admin Panel Integration Guide

## Quick Start

### 1. API Endpoints Summary

All admin endpoints are prefixed with `/api/admin/` and require authentication.

#### Lens Thickness Materials
- `GET /api/admin/lens-thickness-materials` - List all
- `GET /api/admin/lens-thickness-materials/:id` - Get one
- `POST /api/admin/lens-thickness-materials` - Create
- `PUT /api/admin/lens-thickness-materials/:id` - Update
- `DELETE /api/admin/lens-thickness-materials/:id` - Delete

#### Lens Thickness Options
- `GET /api/admin/lens-thickness-options` - List all
- `GET /api/admin/lens-thickness-options/:id` - Get one
- `POST /api/admin/lens-thickness-options` - Create
- `PUT /api/admin/lens-thickness-options/:id` - Update
- `DELETE /api/admin/lens-thickness-options/:id` - Delete

#### Lens Treatments
- `GET /api/admin/lens-treatments` - List all
- `GET /api/admin/lens-treatments/:id` - Get one
- `POST /api/admin/lens-treatments` - Create
- `PUT /api/admin/lens-treatments/:id` - Update
- `DELETE /api/admin/lens-treatments/:id` - Delete

#### Lens Colors
- `GET /api/admin/lens-colors` - List all
- `POST /api/admin/lens-colors` - Create
- `PUT /api/admin/lens-colors/:id` - Update
- `DELETE /api/admin/lens-colors/:id` - Delete

#### Prescription Lens Variants
- `GET /api/admin/prescription-lens-variants` - List all
- `POST /api/admin/prescription-lens-variants` - Create
- `PUT /api/admin/prescription-lens-variants/:id` - Update
- `DELETE /api/admin/prescription-lens-variants/:id` - Delete

---

### 2. Authentication

Include JWT token in all requests:

```javascript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};
```

---

### 3. Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

---

### 4. Common Request Bodies

#### Create Lens Thickness Material
```json
{
  "name": "Unbreakable (Plastic)",
  "slug": "unbreakable-plastic",
  "description": "Durable plastic material",
  "price": 30.00,
  "is_active": true,
  "sort_order": 1
}
```

#### Create Lens Thickness Option
```json
{
  "name": "Thin",
  "slug": "thin",
  "description": "Thin lens option",
  "thickness_value": 1.5,
  "is_active": true,
  "sort_order": 1
}
```

#### Create Lens Treatment
```json
{
  "name": "Scratch Proof",
  "slug": "scratch-proof",
  "type": "scratch_proof",
  "description": "Protects from scratches",
  "price": 30.00,
  "icon": "icon-url",
  "is_active": true,
  "sort_order": 1
}
```

#### Create Lens Color (Photochromic)
```json
{
  "lens_option_id": 5,
  "name": "Gray",
  "color_code": "GRAY",
  "hex_code": "#808080",
  "image_url": "https://example.com/color.png",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

#### Create Lens Color (Prescription Sun)
```json
{
  "prescription_lens_type_id": 4,
  "name": "Dark Brown",
  "color_code": "DARK_BROWN",
  "hex_code": "#654321",
  "image_url": "https://example.com/color.png",
  "price_adjustment": 0.00,
  "is_active": true,
  "sort_order": 1
}
```

#### Create Prescription Lens Variant
```json
{
  "prescription_lens_type_id": 3,
  "name": "Premium",
  "slug": "premium",
  "description": "Wide viewing areas",
  "price": 52.95,
  "is_recommended": true,
  "viewing_range": "Wide",
  "use_cases": "Maximum comfort",
  "is_active": true,
  "sort_order": 1
}
```

---

### 5. Treatment Types

Available treatment types:
- `scratch_proof`
- `anti_glare`
- `blue_light_anti_glare`
- `uv_protection`
- `photochromic`
- `polarized`
- `anti_reflective`

---

### 6. Quick Integration Steps

1. **Set up API service:**
   ```javascript
   // services/api.js
   import axios from 'axios';
   
   const api = axios.create({
     baseURL: 'http://localhost:5000/api',
   });
   
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

2. **Create page components:**
   - Use the template from `ADMIN_PANEL_SIDEBAR_STRUCTURE.md`
   - Replace API calls with your service

3. **Add routes:**
   ```jsx
   <Route path="/admin/lens/thickness-materials" element={<LensThicknessMaterials />} />
   <Route path="/admin/lens/thickness-options" element={<LensThicknessOptions />} />
   <Route path="/admin/lens/treatments" element={<LensTreatments />} />
   ```

4. **Add sidebar menu:**
   - Use the menu structure from `ADMIN_PANEL_SIDEBAR_STRUCTURE.md`
   - Customize icons and styling

---

### 7. Testing Endpoints

Use Postman or curl to test:

```bash
# Get all materials
curl -X GET http://localhost:5000/api/admin/lens-thickness-materials \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create material
curl -X POST http://localhost:5000/api/admin/lens-thickness-materials \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unbreakable (Plastic)",
    "price": 30.00,
    "is_active": true
  }'
```

---

### 8. Error Handling

```javascript
try {
  const response = await api.post('/admin/lens-thickness-materials', data);
  if (response.data.success) {
    // Success
    console.log(response.data.data);
  }
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data.message);
  } else {
    // Network error
    console.error('Network error:', error.message);
  }
}
```

---

### 9. Pagination

All list endpoints support pagination:

```
GET /api/admin/lens-thickness-materials?page=1&limit=50
```

Response includes pagination info:
```json
{
  "data": {
    "materials": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

---

### 10. Filtering

Many endpoints support filtering:

```
GET /api/admin/lens-treatments?type=scratch_proof&isActive=true
GET /api/admin/lens-colors?lensOptionId=5&isActive=true
```

---

## Files Reference

1. **ADMIN_API_DOCUMENTATION.md** - Complete API reference with examples
2. **ADMIN_PANEL_SIDEBAR_STRUCTURE.md** - Sidebar structure and React components
3. **ADMIN_PANEL_INTEGRATION_GUIDE.md** - This file (quick integration guide)

---

## Next Steps

1. ✅ Review API documentation
2. ✅ Set up API service
3. ✅ Create page components
4. ✅ Add routes
5. ✅ Integrate sidebar
6. ✅ Test endpoints
7. ✅ Style components

Good luck with your integration! 🚀

