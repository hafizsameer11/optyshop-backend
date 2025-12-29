# Eye Hygiene Fields API Documentation

## Overview
This document describes the Eye Hygiene product fields feature that allows products in the "Eye Hygiene" category (or related subcategories) to have additional fields: **Size/Volume**, **Pack Type**, **Quantity**, **Price**, and **Expiry Date**.

---

## For Admin Panel

### 1. Create Product with Eye Hygiene Fields

**Endpoint:** `POST /api/admin/products`

**Authentication:** Required (Admin/Staff token)

**Request Body:**
```json
{
  "name": "ACUVUE MOIST Eye Drops",
  "slug": "acuvue-moist-eye-drops",
  "sku": "EYE-001",
  "description": "Premium eye drops for dry eyes",
  "category_id": 5,
  "sub_category_id": 12,
  "price": 14.00,
  "stock_quantity": 100,
  "is_active": true,
  
  // Eye Hygiene specific fields
  "size_volume": "10ml",
  "pack_type": "Pack of 2",
  "expiry_date": "2025-12-31T00:00:00.000Z",
  
  // Other standard fields
  "gender": "unisex",
  "images": ["https://example.com/image1.jpg"],
  "product_type": "accessory"
}
```

**Field Descriptions:**
- `size_volume` (String, optional): Size/Volume of the product (e.g., "5ml", "10ml", "30ml")
- `pack_type` (String, optional): Pack type (e.g., "Single", "Pack of 2", "Pack of 3")
- `expiry_date` (DateTime, optional): Expiry date in ISO 8601 format (e.g., "2025-12-31T00:00:00.000Z")
- `price` (Decimal, required): Product price
- `stock_quantity` (Integer, required): Available quantity

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": 123,
      "name": "ACUVUE MOIST Eye Drops",
      "price": 14.00,
      "size_volume": "10ml",
      "pack_type": "Pack of 2",
      "expiry_date": "2025-12-31T00:00:00.000Z",
      "stock_quantity": 100,
      ...
    }
  }
}
```

---

### 2. Update Product with Eye Hygiene Fields

**Endpoint:** `PUT /api/admin/products/:id`

**Authentication:** Required (Admin/Staff token)

**Request Body:**
```json
{
  "size_volume": "30ml",
  "pack_type": "Single",
  "expiry_date": "2026-06-30T00:00:00.000Z",
  "price": 18.00,
  "stock_quantity": 50
}
```

**Note:** You can update individual fields. Only include the fields you want to update.

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "id": 123,
      "name": "ACUVUE MOIST Eye Drops",
      "price": 18.00,
      "size_volume": "30ml",
      "pack_type": "Single",
      "expiry_date": "2026-06-30T00:00:00.000Z",
      "stock_quantity": 50,
      ...
    }
  }
}
```

---

### 3. Get Product (Admin)

**Endpoint:** `GET /api/admin/products/:id`

**Response:** Includes all Eye Hygiene fields if the product belongs to Eye Hygiene category/subcategory.

---

### 4. Get All Products (Admin)

**Endpoint:** `GET /api/admin/products`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `category` (optional): Filter by category slug
- `search` (optional): Search term

**Response:** Array of products with Eye Hygiene fields included when applicable.

---

## For Website (Frontend)

### 1. Get Single Product

**Endpoint:** `GET /api/products/:id`

**Public Access:** No authentication required

**Response:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {
      "id": 123,
      "name": "ACUVUE MOIST Eye Drops",
      "slug": "acuvue-moist-eye-drops",
      "price": 14.00,
      "stock_quantity": 100,
      "category": {
        "id": 5,
        "name": "Eye Hygiene",
        "slug": "eye-hygiene"
      },
      "subCategory": {
        "id": 12,
        "name": "Eye Drops",
        "slug": "eye-drops"
      },
      
      // Eye Hygiene fields (only present if category/subcategory is Eye Hygiene)
      "size_volume": "10ml",
      "pack_type": "Pack of 2",
      "expiry_date": "2025-12-31T00:00:00.000Z",
      
      // Standard product fields
      "images": ["https://example.com/image1.jpg"],
      "description": "Premium eye drops for dry eyes",
      "gender": "unisex",
      ...
    }
  }
}
```

**Important:** Eye Hygiene fields (`size_volume`, `pack_type`, `expiry_date`) are **automatically included** in the response when:
- The product's category name/slug contains "eye hygiene" (case-insensitive), OR
- The product's subcategory name/slug contains "eye hygiene" (case-insensitive)

If the product is not in Eye Hygiene category, these fields will be `null` or not included.

---

### 2. Get Product by Slug

**Endpoint:** `GET /api/products/slug/:slug`

**Example:** `GET /api/products/slug/acuvue-moist-eye-drops`

**Response:** Same structure as Get Single Product above.

---

### 3. Get All Products (with filters)

**Endpoint:** `GET /api/products`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)
- `category` (optional): Filter by category slug (e.g., `eye-hygiene`)
- `subCategory` (optional): Filter by subcategory slug
- `search` (optional): Search term
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `sortBy` (optional): Sort field (default: `created_at`)
- `sortOrder` (optional): Sort order - `asc` or `desc` (default: `desc`)

**Example Request:**
```
GET /api/products?category=eye-hygiene&page=1&limit=12
```

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 123,
        "name": "ACUVUE MOIST Eye Drops",
        "price": 14.00,
        "size_volume": "10ml",
        "pack_type": "Pack of 2",
        "expiry_date": "2025-12-31T00:00:00.000Z",
        "stock_quantity": 100,
        ...
      },
      {
        "id": 124,
        "name": "Eye Solution 5ml",
        "price": 8.00,
        "size_volume": "5ml",
        "pack_type": "Single",
        "expiry_date": "2025-11-30T00:00:00.000Z",
        "stock_quantity": 50,
        ...
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 12,
      "pages": 3
    }
  }
}
```

---

### 4. Get Featured Products

**Endpoint:** `GET /api/products/featured`

**Query Parameters:**
- `limit` (optional): Number of products (default: 8)

**Response:** Array of featured products with Eye Hygiene fields included when applicable.

---

### 5. Get Related Products

**Endpoint:** `GET /api/products/:id/related`

**Query Parameters:**
- `limit` (optional): Number of products (default: 4)

**Response:** Array of related products with Eye Hygiene fields included when applicable.

---

## Field Details

### Size/Volume (`size_volume`)
- **Type:** String
- **Format:** Free text (e.g., "5ml", "10ml", "30ml", "15ml", "50ml")
- **Admin Input:** Text field
- **Frontend Display:** Display as-is

### Pack Type (`pack_type`)
- **Type:** String
- **Format:** Free text (e.g., "Single", "Pack of 2", "Pack of 3", "Pack of 6")
- **Admin Input:** Text field or dropdown
- **Frontend Display:** Display as-is

### Quantity (`stock_quantity`)
- **Type:** Integer
- **Format:** Number
- **Admin Input:** Number input
- **Frontend Display:** Display stock quantity

### Price (`price`)
- **Type:** Decimal (10, 2)
- **Format:** Decimal number (e.g., 14.00, 8.50)
- **Admin Input:** Number input with 2 decimal places
- **Frontend Display:** Format as currency (e.g., "$14.00")

### Expiry Date (`expiry_date`)
- **Type:** DateTime
- **Format:** ISO 8601 (e.g., "2025-12-31T00:00:00.000Z")
- **Admin Input:** Date picker
- **Frontend Display:** Format as readable date (e.g., "December 31, 2025")

---

## Frontend Implementation Example

### React/Next.js Example

```jsx
// ProductPage.jsx
import { useEffect, useState } from 'react';

function ProductPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProduct(data.data.product);
        }
        setLoading(false);
      });
  }, [productId]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  // Check if product has Eye Hygiene fields
  const isEyeHygiene = product.size_volume || product.pack_type || product.expiry_date;

  return (
    <div className="product-page">
      <h1>{product.name}</h1>
      <p className="price">${product.price.toFixed(2)}</p>
      
      {/* Eye Hygiene Fields */}
      {isEyeHygiene && (
        <div className="eye-hygiene-fields">
          {product.size_volume && (
            <div className="field">
              <label>Size / Volume:</label>
              <span>{product.size_volume}</span>
            </div>
          )}
          
          {product.pack_type && (
            <div className="field">
              <label>Pack Type:</label>
              <span>{product.pack_type}</span>
            </div>
          )}
          
          <div className="field">
            <label>Quantity:</label>
            <span>{product.stock_quantity}</span>
          </div>
          
          {product.expiry_date && (
            <div className="field">
              <label>Expiry Date:</label>
              <span>{new Date(product.expiry_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
      
      <button onClick={() => addToCart(product)}>Add to Cart</button>
    </div>
  );
}
```

---

## Admin Panel Implementation Example

### Form Example (React)

```jsx
// AdminProductForm.jsx
import { useState } from 'react';

function AdminProductForm({ product, onSubmit }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category_id: product?.category_id || '',
    price: product?.price || 0,
    stock_quantity: product?.stock_quantity || 0,
    // Eye Hygiene fields
    size_volume: product?.size_volume || '',
    pack_type: product?.pack_type || '',
    expiry_date: product?.expiry_date || '',
    ...
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format expiry_date if provided
    const submitData = {
      ...formData,
      expiry_date: formData.expiry_date 
        ? new Date(formData.expiry_date).toISOString() 
        : null
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Standard fields */}
      <input
        type="text"
        placeholder="Product Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
      />
      
      {/* Eye Hygiene Fields */}
      <div className="eye-hygiene-section">
        <h3>Eye Hygiene Fields</h3>
        
        <select
          value={formData.size_volume}
          onChange={(e) => setFormData({ ...formData, size_volume: e.target.value })}
        >
          <option value="">Select Size/Volume</option>
          <option value="5ml">5ml</option>
          <option value="10ml">10ml</option>
          <option value="30ml">30ml</option>
        </select>
        
        <select
          value={formData.pack_type}
          onChange={(e) => setFormData({ ...formData, pack_type: e.target.value })}
        >
          <option value="">Select Pack Type</option>
          <option value="Single">Single</option>
          <option value="Pack of 2">Pack of 2</option>
          <option value="Pack of 3">Pack of 3</option>
        </select>
        
        <input
          type="number"
          placeholder="Quantity"
          value={formData.stock_quantity}
          onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
        />
        
        <input
          type="date"
          placeholder="Expiry Date"
          value={formData.expiry_date ? formData.expiry_date.split('T')[0] : ''}
          onChange={(e) => setFormData({ 
            ...formData, 
            expiry_date: e.target.value ? new Date(e.target.value).toISOString() : '' 
          })}
        />
      </div>
      
      <button type="submit">Save Product</button>
    </form>
  );
}
```

---

## Important Notes

1. **Automatic Detection:** The system automatically detects Eye Hygiene products based on category/subcategory names or slugs containing "eye hygiene" (case-insensitive).

2. **Field Availability:** Eye Hygiene fields are only returned in API responses when the product belongs to an Eye Hygiene category/subcategory.

3. **Optional Fields:** All Eye Hygiene fields are optional. You can create a product with some, all, or none of these fields.

4. **Date Format:** Expiry date should be sent in ISO 8601 format (e.g., "2025-12-31T00:00:00.000Z") when creating/updating products.

5. **Empty Values:** Empty strings are automatically converted to `null` in the database.

6. **Category Matching:** The system checks both category and subcategory names/slugs. If either contains "eye hygiene", the fields will be included.

---

## Testing

### Test Create Product (Admin)
```bash
curl -X POST http://localhost:5000/api/admin/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Eye Drops",
    "slug": "test-eye-drops",
    "sku": "TEST-001",
    "category_id": 5,
    "price": 14.00,
    "stock_quantity": 100,
    "size_volume": "10ml",
    "pack_type": "Pack of 2",
    "expiry_date": "2025-12-31T00:00:00.000Z"
  }'
```

### Test Get Product (Frontend)
```bash
curl http://localhost:5000/api/products/123
```

---

## Migration

To apply the database changes, run:
```bash
npx prisma migrate dev
```

This will create the new columns: `size_volume`, `pack_type`, and `expiry_date` in the `products` table.

