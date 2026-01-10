# Admin Panel Product Management - Quick Reference

Quick reference guide for integrating the Product Management section in the OptyShop Admin Panel.

---

## Base URL
```
/api/admin/products
```

## Authentication Header
```
Authorization: Bearer {admin_token}
```

---

## Endpoints Summary

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/products` | Get all products (with filters) |
| GET | `/api/admin/products/:id` | Get single product |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |

### Size/Volume Variants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/products/:productId/size-volume-variants` | Get all variants |
| GET | `/api/admin/products/:productId/size-volume-variants/:variantId` | Get single variant |
| POST | `/api/admin/products/:productId/size-volume-variants` | Create variant |
| PUT | `/api/admin/products/:productId/size-volume-variants/:variantId` | Update variant |
| DELETE | `/api/admin/products/:productId/size-volume-variants/:variantId` | Delete variant |
| PUT | `/api/admin/products/:productId/size-volume-variants/bulk` | Bulk update variants |

---

## Common Use Cases

### 1. Create Product with All Tabs

```javascript
const formData = new FormData();

// General Tab
formData.append('name', 'Product Name');
formData.append('sku', 'SKU123');
formData.append('category_id', '1');
formData.append('price', '99.99');

// Size/Volume Variants Tab
formData.append('sizeVolumeVariants', JSON.stringify([
  { size_volume: '5ml', price: 8.00, stock_quantity: 50 }
]));

// Images Tab
formData.append('images', file1);
formData.append('images', file2);

// SEO Tab
formData.append('meta_title', 'SEO Title');
formData.append('meta_description', 'SEO Description');
formData.append('meta_keywords', 'keyword1, keyword2');

fetch('/api/admin/products', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### 2. Update Product - General Tab Only

```javascript
const formData = new FormData();
formData.append('name', 'Updated Name');
formData.append('price', '89.99');
formData.append('stock_quantity', '150');

fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### 3. Update Product - Size/Volume Variants Only

```javascript
const variants = [
  { id: 1, size_volume: '5ml', price: 9.00 }, // Update existing
  { size_volume: '10ml', price: 14.00 } // Create new
  // Variant with id=2 not included = will be deleted
];

const formData = new FormData();
formData.append('sizeVolumeVariants', JSON.stringify(variants));

fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### 4. Update Product - Images Only

```javascript
const formData = new FormData();
// Keep existing images
formData.append('images', JSON.stringify(['existing-url1', 'existing-url2']));
// Add new image
formData.append('images', newFile);

fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### 5. Update Product - SEO Only

```javascript
const formData = new FormData();
formData.append('meta_title', 'Updated SEO Title');
formData.append('meta_description', 'Updated SEO Description');
formData.append('meta_keywords', 'updated, keywords');

fetch(`/api/admin/products/${productId}`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

## Field Reference

### General Tab Fields
- `name` (required): Product name
- `slug` (optional): URL slug
- `sku` (required): Stock Keeping Unit
- `description` (optional): Full description
- `short_description` (optional): Brief description
- `category_id` (required): Category ID
- `sub_category_id` (optional): Subcategory ID
- `product_type` (optional): `frame`, `sunglasses`, `contact_lens`, `eye_hygiene`
- `price` (required): Base price
- `compare_at_price` (optional): Compare at price
- `cost_price` (optional): Cost price
- `stock_quantity` (optional): Stock quantity
- `stock_status` (optional): `in_stock`, `out_of_stock`, `backorder`
- `is_active` (optional): `true`/`false`
- `is_featured` (optional): `true`/`false`

### Size/Volume Variant Fields
- `size_volume` (required): e.g., "5ml", "10ml"
- `pack_type` (optional): e.g., "Single", "Pack of 2"
- `price` (required): Variant price
- `compare_at_price` (optional): Compare at price
- `cost_price` (optional): Cost price
- `stock_quantity` (optional): Stock quantity
- `stock_status` (optional): `in_stock`, `out_of_stock`, `backorder`
- `sku` (optional): Variant SKU
- `expiry_date` (optional): Expiry date (ISO format)
- `is_active` (optional): `true`/`false`
- `sort_order` (optional): Sort order number

### SEO Fields
- `meta_title` (optional): SEO title (max 255 chars)
- `meta_description` (optional): SEO description
- `meta_keywords` (optional): Comma-separated keywords (max 255 chars)

---

## Important Notes

1. **Partial Updates**: Only send fields you want to update. Omitted fields remain unchanged.

2. **Array Replacements**: 
   - `sizeVolumeVariants`: Replaces all variants (missing ones are deleted)
   - `images`: Replaces all images (missing ones are deleted)

3. **File Uploads**: Use `multipart/form-data` with `FormData`

4. **JSON Arrays**: Stringify JSON arrays when sending in form data:
   ```javascript
   formData.append('sizeVolumeVariants', JSON.stringify([...]));
   ```

5. **Boolean Values**: Can be sent as boolean, string (`"true"`), or number (`1`)

6. **Dates**: Use ISO 8601 format (YYYY-MM-DD)

---

## Response Structure

### Success Response
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": 1,
      "name": "Product Name",
      "images": ["url1", "url2"],
      "sizeVolumeVariants": [...],
      "meta_title": "...",
      "meta_description": "...",
      "meta_keywords": "..."
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [...] // Optional, for validation errors
}
```

---

## Status Codes

- `200`: Success (GET, PUT)
- `201`: Created (POST)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `500`: Server Error
- `503`: Service Unavailable (missing database tables)

---

## Testing Checklist

- [ ] Create product with all fields
- [ ] Update product - General tab only
- [ ] Update product - Size/Volume Variants tab only
- [ ] Update product - Images tab only
- [ ] Update product - SEO tab only
- [ ] Create size/volume variant
- [ ] Update size/volume variant
- [ ] Delete size/volume variant
- [ ] Bulk update variants
- [ ] Delete product
- [ ] Error handling (validation, not found, etc.)

---

**For detailed documentation, see**: `ADMIN_PANEL_PRODUCT_MANAGEMENT_API.md`