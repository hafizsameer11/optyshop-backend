# Eye Hygiene Fields - Quick Reference

## What Was Implemented

### Database Fields Added
- `size_volume` (String) - e.g., "5ml", "10ml", "30ml"
- `pack_type` (String) - e.g., "Single", "Pack of 2"
- `expiry_date` (DateTime) - Product expiry date

### Automatic Detection
The system automatically detects if a product is in the "Eye Hygiene" category by checking:
- Category name/slug contains "eye hygiene" (case-insensitive)
- Subcategory name/slug contains "eye hygiene" (case-insensitive)

---

## For Admin Panel

### Create/Update Product
**Endpoint:** `POST /api/admin/products` or `PUT /api/admin/products/:id`

**Request Body Example:**
```json
{
  "name": "Eye Drops",
  "category_id": 5,
  "price": 14.00,
  "stock_quantity": 100,
  "size_volume": "10ml",
  "pack_type": "Pack of 2",
  "expiry_date": "2025-12-31T00:00:00.000Z"
}
```

**Fields:**
- `size_volume` - Text field (optional)
- `pack_type` - Text field (optional)
- `expiry_date` - Date picker, ISO 8601 format (optional)
- `price` - Number field (required)
- `stock_quantity` - Number field (required)

---

## For Website (Frontend)

### Get Product
**Endpoint:** `GET /api/products/:id` or `GET /api/products/slug/:slug`

**Response Example:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 123,
      "name": "Eye Drops",
      "price": 14.00,
      "stock_quantity": 100,
      "size_volume": "10ml",        // Only if Eye Hygiene category
      "pack_type": "Pack of 2",     // Only if Eye Hygiene category
      "expiry_date": "2025-12-31T00:00:00.000Z"  // Only if Eye Hygiene category
    }
  }
}
```

**Note:** Eye Hygiene fields are automatically included when the product belongs to Eye Hygiene category/subcategory.

---

## Frontend Display Example

```jsx
// Check if product has Eye Hygiene fields
const isEyeHygiene = product.size_volume || product.pack_type || product.expiry_date;

{isEyeHygiene && (
  <div className="eye-hygiene-fields">
    {product.size_volume && (
      <div>Size / Volume: {product.size_volume}</div>
    )}
    {product.pack_type && (
      <div>Pack Type: {product.pack_type}</div>
    )}
    <div>Quantity: {product.stock_quantity}</div>
    {product.expiry_date && (
      <div>Expiry Date: {new Date(product.expiry_date).toLocaleDateString()}</div>
    )}
  </div>
)}
```

---

## Admin Form Example

```jsx
// Size/Volume dropdown
<select name="size_volume">
  <option value="">Select Size/Volume</option>
  <option value="5ml">5ml</option>
  <option value="10ml">10ml</option>
  <option value="30ml">30ml</option>
</select>

// Pack Type dropdown
<select name="pack_type">
  <option value="">Select Pack Type</option>
  <option value="Single">Single</option>
  <option value="Pack of 2">Pack of 2</option>
</select>

// Expiry Date
<input type="date" name="expiry_date" />
```

---

## Key Points

✅ **Automatic:** Fields are automatically included in API responses for Eye Hygiene products  
✅ **Optional:** All Eye Hygiene fields are optional  
✅ **Smart Detection:** Works with category name, slug, subcategory name, or subcategory slug  
✅ **Backward Compatible:** Existing products without these fields work normally  

---

## API Endpoints Summary

### Admin
- `POST /api/admin/products` - Create product with Eye Hygiene fields
- `PUT /api/admin/products/:id` - Update product with Eye Hygiene fields
- `GET /api/admin/products/:id` - Get product (includes Eye Hygiene fields)

### Frontend
- `GET /api/products/:id` - Get product (includes Eye Hygiene fields if applicable)
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/products` - Get all products (includes Eye Hygiene fields when applicable)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id/related` - Get related products

---

## Next Steps

1. **Run Migration:**
   ```bash
   npx prisma migrate dev
   ```

2. **Test Admin API:**
   - Create a product in Eye Hygiene category with the new fields
   - Update an existing Eye Hygiene product

3. **Test Frontend API:**
   - Fetch a product in Eye Hygiene category
   - Verify fields are included in response

4. **Frontend Integration:**
   - Display Eye Hygiene fields on product page
   - Add form fields in admin panel for these fields

