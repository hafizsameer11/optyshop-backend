# Size/Volume Variants API Documentation

## Overview
This document describes the Size/Volume Variants feature for Eye Hygiene products. This allows products to have multiple size/volume options (e.g., 5ml, 10ml, 30ml) with individual prices and stock quantities for each variant.

---

## Database Schema

### ProductSizeVolume Model
```prisma
model ProductSizeVolume {
  id               Int         @id @default(autoincrement())
  product_id       Int
  size_volume      String      @db.VarChar(50)        // e.g., "5ml", "10ml", "30ml"
  pack_type        String?     @db.VarChar(50)        // e.g., "Single", "Pack of 2"
  price            Decimal     @db.Decimal(10, 2)     // Price for this variant
  compare_at_price Decimal?    @db.Decimal(10, 2)     // Compare at price
  cost_price       Decimal?    @db.Decimal(10, 2)     // Cost price
  stock_quantity   Int         @default(0)            // Stock for this variant
  stock_status     StockStatus @default(in_stock)     // Stock status
  sku              String?     @db.VarChar(100)       // SKU for this variant
  expiry_date      DateTime?                          // Expiry date (optional)
  is_active        Boolean     @default(true)         // Active status
  sort_order       Int         @default(0)            // Sort order
  created_at       DateTime    @default(now())
  updated_at       DateTime    @updatedAt
  product          Product     @relation(...)
  
  @@unique([product_id, size_volume, pack_type])
}
```

---

## For Admin Panel

### 1. Create Product with Size/Volume Variants

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
  "product_type": "eye_hygiene",
  
  // Size/Volume Variants Array
  "sizeVolumeVariants": [
    {
      "size_volume": "5ml",
      "pack_type": "Single",
      "price": 8.00,
      "compare_at_price": 10.00,
      "cost_price": 5.00,
      "stock_quantity": 50,
      "stock_status": "in_stock",
      "sku": "EYE-001-5ML",
      "expiry_date": "2025-12-31T00:00:00.000Z",
      "is_active": true,
      "sort_order": 1
    },
    {
      "size_volume": "10ml",
      "pack_type": "Single",
      "price": 14.00,
      "compare_at_price": 18.00,
      "cost_price": 9.00,
      "stock_quantity": 75,
      "stock_status": "in_stock",
      "sku": "EYE-001-10ML",
      "expiry_date": "2025-12-31T00:00:00.000Z",
      "is_active": true,
      "sort_order": 2
    },
    {
      "size_volume": "10ml",
      "pack_type": "Pack of 2",
      "price": 25.00,
      "compare_at_price": 28.00,
      "cost_price": 18.00,
      "stock_quantity": 30,
      "stock_status": "in_stock",
      "sku": "EYE-001-10ML-2PK",
      "expiry_date": "2025-12-31T00:00:00.000Z",
      "is_active": true,
      "sort_order": 3
    }
  ]
}
```

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
      "sizeVolumeVariants": [
        {
          "id": 1,
          "size_volume": "5ml",
          "pack_type": "Single",
          "price": 8.00,
          "stock_quantity": 50,
          ...
        },
        {
          "id": 2,
          "size_volume": "10ml",
          "pack_type": "Single",
          "price": 14.00,
          "stock_quantity": 75,
          ...
        },
        {
          "id": 3,
          "size_volume": "10ml",
          "pack_type": "Pack of 2",
          "price": 25.00,
          "stock_quantity": 30,
          ...
        }
      ],
      ...
    }
  }
}
```

---

### 2. Update Product with Size/Volume Variants

**Endpoint:** `PUT /api/admin/products/:id`

**Authentication:** Required (Admin/Staff token)

**Request Body:**
```json
{
  "sizeVolumeVariants": [
    {
      "id": 1,  // Include id to update existing variant
      "size_volume": "5ml",
      "pack_type": "Single",
      "price": 9.00,  // Updated price
      "stock_quantity": 60,  // Updated stock
      "is_active": true
    },
    {
      // No id = new variant will be created
      "size_volume": "30ml",
      "pack_type": "Single",
      "price": 20.00,
      "stock_quantity": 40,
      "stock_status": "in_stock",
      "is_active": true,
      "sort_order": 4
    }
  ]
}
```

**Important Notes:**
- Variants with `id` will be updated
- Variants without `id` will be created
- Variants not included in the array will be deleted
- Set `sizeVolumeVariants` to `null` to skip variant updates

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "id": 123,
      "sizeVolumeVariants": [
        // Updated variants
      ],
      ...
    }
  }
}
```

---

### 3. Get Product (Admin)

**Endpoint:** `GET /api/admin/products/:id`

**Response:** Includes `sizeVolumeVariants` array with all variants (active and inactive).

---

### 4. Get All Products (Admin)

**Endpoint:** `GET /api/admin/products`

**Response:** Each product includes `sizeVolumeVariants` array if variants exist.

---

## For Website (Frontend)

### 1. Get Single Product

**Endpoint:** `GET /api/products/:id` or `GET /api/products/slug/:slug`

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
      "category": {
        "id": 5,
        "name": "Eye Hygiene",
        "slug": "eye-hygiene"
      },
      
      // Size/Volume Variants (only active variants)
      "size_volume_variants": [
        {
          "id": 1,
          "size_volume": "5ml",
          "pack_type": "Single",
          "price": 8.00,
          "compare_at_price": 10.00,
          "stock_quantity": 50,
          "stock_status": "in_stock",
          "sku": "EYE-001-5ML",
          "expiry_date": "2025-12-31T00:00:00.000Z",
          "is_active": true,
          "sort_order": 1
        },
        {
          "id": 2,
          "size_volume": "10ml",
          "pack_type": "Single",
          "price": 14.00,
          "compare_at_price": 18.00,
          "stock_quantity": 75,
          "stock_status": "in_stock",
          "sku": "EYE-001-10ML",
          "expiry_date": "2025-12-31T00:00:00.000Z",
          "is_active": true,
          "sort_order": 2
        },
        {
          "id": 3,
          "size_volume": "10ml",
          "pack_type": "Pack of 2",
          "price": 25.00,
          "compare_at_price": 28.00,
          "stock_quantity": 30,
          "stock_status": "in_stock",
          "sku": "EYE-001-10ML-2PK",
          "expiry_date": "2025-12-31T00:00:00.000Z",
          "is_active": true,
          "sort_order": 3
        }
      ],
      
      // Legacy fields (for backward compatibility)
      "size_volume": null,
      "pack_type": null,
      "expiry_date": null,
      
      ...
    }
  }
}
```

**Important:** 
- `size_volume_variants` is only included for Eye Hygiene products
- Only active variants (`is_active: true`) are returned in public endpoints
- Variants are sorted by `sort_order`, then `size_volume`, then `pack_type`

---

### 2. Get All Products (with filters)

**Endpoint:** `GET /api/products`

**Query Parameters:**
- `category` (optional): Filter by category slug (e.g., `eye-hygiene`)
- `page`, `limit`, `search`, etc.

**Response:** Products include `size_volume_variants` array if they are Eye Hygiene products and have variants.

---

## Field Descriptions

### Size/Volume Variant Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Integer | No (for create) | Variant ID (required for updates) |
| `size_volume` | String | Yes | Size/Volume (e.g., "5ml", "10ml", "30ml") |
| `pack_type` | String | No | Pack type (e.g., "Single", "Pack of 2") |
| `price` | Decimal | Yes | Price for this variant |
| `compare_at_price` | Decimal | No | Compare at price (for showing discounts) |
| `cost_price` | Decimal | No | Cost price (internal use) |
| `stock_quantity` | Integer | Yes | Available quantity |
| `stock_status` | Enum | Yes | `in_stock`, `out_of_stock`, or `backorder` |
| `sku` | String | No | SKU for this specific variant |
| `expiry_date` | DateTime | No | Expiry date (ISO 8601 format) |
| `is_active` | Boolean | Yes | Whether variant is active |
| `sort_order` | Integer | Yes | Display order (lower = first) |

---

## Frontend Implementation Example

### React/Next.js Example

```jsx
// ProductPage.jsx
import { useEffect, useState } from 'react';

function ProductPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const product = data.data.product;
          setProduct(product);
          
          // Select first variant by default if variants exist
          if (product.size_volume_variants && product.size_volume_variants.length > 0) {
            setSelectedVariant(product.size_volume_variants[0]);
          }
        }
        setLoading(false);
      });
  }, [productId]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  const hasVariants = product.size_volume_variants && product.size_volume_variants.length > 0;
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;

  return (
    <div className="product-page">
      <h1>{product.name}</h1>
      
      {/* Price Display */}
      <div className="price">
        <span className="current-price">${displayPrice.toFixed(2)}</span>
        {selectedVariant && selectedVariant.compare_at_price && (
          <span className="compare-price">${selectedVariant.compare_at_price.toFixed(2)}</span>
        )}
      </div>
      
      {/* Size/Volume Variant Selector */}
      {hasVariants && (
        <div className="size-volume-variants">
          <h3>Select Size/Volume</h3>
          <div className="variant-options">
            {product.size_volume_variants.map((variant) => (
              <button
                key={variant.id}
                className={`variant-option ${selectedVariant?.id === variant.id ? 'selected' : ''} ${variant.stock_status !== 'in_stock' ? 'out-of-stock' : ''}`}
                onClick={() => setSelectedVariant(variant)}
                disabled={variant.stock_status !== 'in_stock'}
              >
                <div className="variant-label">
                  {variant.size_volume}
                  {variant.pack_type && ` - ${variant.pack_type}`}
                </div>
                <div className="variant-price">${variant.price.toFixed(2)}</div>
                {variant.stock_status !== 'in_stock' && (
                  <div className="stock-badge">Out of Stock</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Stock Display */}
      <div className="stock">
        {displayStock > 0 ? (
          <span className="in-stock">In Stock ({displayStock} available)</span>
        ) : (
          <span className="out-of-stock">Out of Stock</span>
        )}
      </div>
      
      {/* Expiry Date (if variant has one) */}
      {selectedVariant && selectedVariant.expiry_date && (
        <div className="expiry-date">
          Expiry Date: {new Date(selectedVariant.expiry_date).toLocaleDateString()}
        </div>
      )}
      
      <button 
        onClick={() => addToCart(product, selectedVariant)} 
        disabled={!selectedVariant || selectedVariant.stock_status !== 'in_stock'}
      >
        Add to Cart
      </button>
    </div>
  );
}

function addToCart(product, variant) {
  // Add to cart with variant information
  fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: product.id,
      quantity: 1,
      size_volume_variant_id: variant ? variant.id : null,
      // ... other cart fields
    })
  });
}
```

---

## Admin Panel Implementation Example

### React Form Example

```jsx
// AdminProductForm.jsx
import { useState } from 'react';

function AdminProductForm({ product, onSubmit }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category_id: product?.category_id || '',
    price: product?.price || 0,
    product_type: product?.product_type || 'eye_hygiene',
    sizeVolumeVariants: product?.sizeVolumeVariants || []
  });

  const addVariant = () => {
    setFormData({
      ...formData,
      sizeVolumeVariants: [
        ...formData.sizeVolumeVariants,
        {
          size_volume: '',
          pack_type: '',
          price: 0,
          stock_quantity: 0,
          stock_status: 'in_stock',
          is_active: true,
          sort_order: formData.sizeVolumeVariants.length
        }
      ]
    });
  };

  const updateVariant = (index, field, value) => {
    const updatedVariants = [...formData.sizeVolumeVariants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value
    };
    setFormData({
      ...formData,
      sizeVolumeVariants: updatedVariants
    });
  };

  const removeVariant = (index) => {
    const updatedVariants = formData.sizeVolumeVariants.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      sizeVolumeVariants: updatedVariants
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format variants - convert expiry_date to ISO string
    const submitData = {
      ...formData,
      sizeVolumeVariants: formData.sizeVolumeVariants.map(variant => ({
        ...variant,
        expiry_date: variant.expiry_date 
          ? new Date(variant.expiry_date).toISOString() 
          : null
      }))
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Standard product fields */}
      <input
        type="text"
        placeholder="Product Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      {/* Size/Volume Variants Section */}
      <div className="size-volume-variants-section">
        <h3>Size/Volume Variants</h3>
        <button type="button" onClick={addVariant}>Add Variant</button>
        
        {formData.sizeVolumeVariants.map((variant, index) => (
          <div key={index} className="variant-row">
            {variant.id && <input type="hidden" name={`variants[${index}][id]`} value={variant.id} />}
            
            <input
              type="text"
              placeholder="Size/Volume (e.g., 5ml)"
              value={variant.size_volume}
              onChange={(e) => updateVariant(index, 'size_volume', e.target.value)}
              required
            />
            
            <input
              type="text"
              placeholder="Pack Type (e.g., Single, Pack of 2)"
              value={variant.pack_type || ''}
              onChange={(e) => updateVariant(index, 'pack_type', e.target.value)}
            />
            
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={variant.price}
              onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
              required
            />
            
            <input
              type="number"
              step="0.01"
              placeholder="Compare At Price"
              value={variant.compare_at_price || ''}
              onChange={(e) => updateVariant(index, 'compare_at_price', e.target.value ? parseFloat(e.target.value) : null)}
            />
            
            <input
              type="number"
              placeholder="Stock Quantity"
              value={variant.stock_quantity}
              onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value))}
              required
            />
            
            <input
              type="date"
              placeholder="Expiry Date"
              value={variant.expiry_date ? new Date(variant.expiry_date).toISOString().split('T')[0] : ''}
              onChange={(e) => updateVariant(index, 'expiry_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
            
            <input
              type="text"
              placeholder="SKU"
              value={variant.sku || ''}
              onChange={(e) => updateVariant(index, 'sku', e.target.value)}
            />
            
            <label>
              <input
                type="checkbox"
                checked={variant.is_active}
                onChange={(e) => updateVariant(index, 'is_active', e.target.checked)}
              />
              Active
            </label>
            
            <button type="button" onClick={() => removeVariant(index)}>Remove</button>
          </div>
        ))}
      </div>
      
      <button type="submit">Save Product</button>
    </form>
  );
}
```

---

## Important Notes

1. **Unique Constraint:** Each product can only have one variant per unique combination of `size_volume` and `pack_type`.

2. **Legacy Fields:** The base product's `size_volume`, `pack_type`, and `expiry_date` fields are still supported for backward compatibility but are not used when variants exist.

3. **Stock Management:** Each variant has its own stock quantity and status. The base product's stock is ignored when variants exist.

4. **Pricing:** Each variant has its own price. When a variant is selected, use the variant's price instead of the base product price.

5. **Cart Integration:** When adding to cart, include the `size_volume_variant_id` to track which variant was selected.

6. **Migration:** Run the migration to create the `product_size_volumes` table:
   ```bash
   npx prisma migrate dev
   ```

---

## Testing

### Test Create Product with Variants (Admin)
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
    "product_type": "eye_hygiene",
    "sizeVolumeVariants": [
      {
        "size_volume": "5ml",
        "pack_type": "Single",
        "price": 8.00,
        "stock_quantity": 50,
        "stock_status": "in_stock"
      },
      {
        "size_volume": "10ml",
        "pack_type": "Single",
        "price": 14.00,
        "stock_quantity": 75,
        "stock_status": "in_stock"
      }
    ]
  }'
```

### Test Get Product (Frontend)
```bash
curl http://localhost:5000/api/products/123
```

---

## Database Migration

The migration file has been created at:
`prisma/migrations/20250107000000_add_product_size_volume_variants/migration.sql`

Run the migration when your database is available:
```bash
npx prisma migrate dev
```

Or apply it to production:
```bash
npx prisma migrate deploy
```

