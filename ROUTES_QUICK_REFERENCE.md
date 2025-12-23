# Prescription Sun Lenses & Photochromic Lenses - Routes Quick Reference

## Public Routes (No Authentication Required)

### Prescription Sun Lenses
- `GET /api/prescription-sun-lenses` - Get all prescription sun lenses (Polarized, Classic, Blokz)
- `GET /api/prescription-sun-lenses/:id` - Get single prescription sun lens option

### Photochromic Lenses
- `GET /api/photochromic-lenses` - Get all photochromic lenses
- `GET /api/photochromic-lenses/:id` - Get single photochromic lens option

## Admin Routes (Authentication Required)

**All admin routes require:** `Authorization: Bearer <admin_token>`

### Prescription Sun Lenses (Admin)
- `GET /api/admin/prescription-sun-lenses` - Get all (with pagination and filters)
- `POST /api/admin/prescription-sun-lenses` - Create new prescription sun lens option
- `PUT /api/admin/prescription-sun-lenses/:id` - Update prescription sun lens option
- `DELETE /api/admin/prescription-sun-lenses/:id` - Delete prescription sun lens option

### Photochromic Lenses (Admin)
- `GET /api/admin/photochromic-lenses` - Get all (with pagination and filters)
- `POST /api/admin/photochromic-lenses` - Create new photochromic lens option
- `PUT /api/admin/photochromic-lenses/:id` - Update photochromic lens option
- `DELETE /api/admin/photochromic-lenses/:id` - Delete photochromic lens option

## Related Routes (For Managing Finishes and Colors)

### Lens Finishes (Admin)
- `GET /api/admin/lens-finishes` - Get all lens finishes
- `POST /api/admin/lens-finishes` - Create lens finish (for prescription sun lenses)
- `PUT /api/admin/lens-finishes/:id` - Update lens finish
- `DELETE /api/admin/lens-finishes/:id` - Delete lens finish

### Lens Colors (Admin)
- `GET /api/admin/lens-colors` - Get all lens colors
- `POST /api/admin/lens-colors` - Create lens color (for finishes or options)
- `PUT /api/admin/lens-colors/:id` - Update lens color
- `DELETE /api/admin/lens-colors/:id` - Delete lens color

## Example Usage

### Create Prescription Sun Lens with Finishes and Colors

1. **Create the main lens option:**
```bash
POST /api/admin/prescription-sun-lenses
{
  "name": "Polarized",
  "type": "polarized",
  "base_price": 76.95,
  "description": "Reduce glare and see clearly for outdoor activities and driving."
}
```

2. **Create finishes for the lens:**
```bash
POST /api/admin/lens-finishes
{
  "lens_option_id": 1,
  "name": "Classic",
  "slug": "classic",
  "price_adjustment": 0
}
```

3. **Create colors for the finish:**
```bash
POST /api/admin/lens-colors
{
  "lens_finish_id": 1,
  "name": "Dark Gray",
  "color_code": "dark-gray",
  "hex_code": "#4a4a4a",
  "price_adjustment": 0
}
```

### Create Photochromic Lens with Colors

1. **Create the photochromic lens option:**
```bash
POST /api/admin/photochromic-lenses
{
  "name": "EyeQLenz™ with Zenni ID Guard™",
  "description": "4-in-1 lens that reflects infrared light...",
  "base_price": 0
}
```

2. **Create colors directly for the lens option:**
```bash
POST /api/admin/lens-colors
{
  "lens_option_id": 1,
  "name": "Dark Gray",
  "color_code": "dark-gray",
  "hex_code": "#4a4a4a",
  "price_adjustment": 0
}
```

## Response Format

All endpoints return responses in this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

