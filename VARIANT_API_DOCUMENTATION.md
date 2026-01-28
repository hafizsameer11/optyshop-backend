# Product Variant API Documentation

## Overview

This document describes the backend implementation for managing product variants with image display and cart functionality. The system supports three types of variants:

1. **MM Caliber Variants** - Different sizes/calibers (e.g., 78mm, 80mm)
2. **Eye Hygiene Variants** - Eye care product variants
3. **Size/Volume Variants** - Different pack sizes and volumes (e.g., 15ml Pack, 550ML Pack)

## API Endpoints

### 1. Get Product Variants

**Endpoint:** `GET /api/products/:id/variants`

**Description:** Retrieves all available variants for a specific product.

**Response:**
```json
{
  "success": true,
  "message": "Product variants retrieved successfully",
  "data": {
    "product": {
      "id": 1,
      "name": "Product Name",
      "slug": "product-name",
      "base_price": 29.99,
      "images": ["image1.jpg"],
      "color_images": []
    },
    "variants": [
      {
        "id": "caliber_78",
        "type": "mm_caliber",
        "name": "78mm",
        "display_name": "78mm Caliber",
        "price": 29.99,
        "image_url": "https://example.com/caliber-78.jpg",
        "stock_quantity": 10,
        "stock_status": "in_stock",
        "sort_order": 0,
        "metadata": {
          "mm": "78",
          "image_url": "https://example.com/caliber-78.jpg"
        }
      },
      {
        "id": "size_volume_1",
        "type": "size_volume",
        "name": "15ml Pack",
        "display_name": "15ml Pack",
        "price": 29.99,
        "compare_at_price": 39.99,
        "image_url": "https://example.com/15ml-pack.jpg",
        "stock_quantity": 5,
        "stock_status": "in_stock",
        "sku": "TEST-15ML",
        "sort_order": 1,
        "metadata": {
          "variant_id": 1,
          "size_volume": "15ml",
          "pack_type": "Pack",
          "sku": "TEST-15ML",
          "image_url": "https://example.com/15ml-pack.jpg"
        }
      }
    ]
  }
}
```

### 2. Get Variant Details

**Endpoint:** `GET /api/products/:id/variants/:variantId`

**Description:** Retrieves detailed information about a specific variant.

**Response:**
```json
{
  "success": true,
  "message": "Variant details retrieved successfully",
  "data": {
    "product": {
      "id": 1,
      "name": "Product Name",
      "slug": "product-name",
      "base_price": 29.99,
      "images": ["image1.jpg"],
      "color_images": []
    },
    "variant": {
      "id": "size_volume_1",
      "type": "size_volume",
      "name": "15ml Pack",
      "display_name": "15ml Pack",
      "price": 29.99,
      "compare_at_price": 39.99,
      "image_url": "https://example.com/15ml-pack.jpg",
      "stock_quantity": 5,
      "stock_status": "in_stock",
      "sku": "TEST-15ML",
      "metadata": {
        "variant_id": 1,
        "size_volume": "15ml",
        "pack_type": "Pack",
        "sku": "TEST-15ML",
        "image_url": "https://example.com/15ml-pack.jpg"
      }
    }
  }
}
```

### 3. Add Variant to Cart

**Endpoint:** `POST /api/cart/items`

**Description:** Adds a selected variant to the user's cart.

**Request Body:**
```json
{
  "product_id": 1,
  "selected_variant_id": "size_volume_1",
  "variant_type": "size_volume",
  "quantity": 1,
  "lens_index": 1.61,
  "lens_coatings": ["uv_protection"],
  "prescription_data": {
    "pd_binocular": 63,
    "od_sphere": -2.00,
    "od_cylinder": -0.50,
    "od_axis": 180,
    "os_sphere": -2.25,
    "os_cylinder": -0.75,
    "os_axis": 175
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "item": {
      "id": 123,
      "product_id": 1,
      "quantity": 1,
      "unit_price": 29.99,
      "customization": {
        "selected_variant_id": "size_volume_1",
        "variant_type": "size_volume",
        "variant_name": "15ml Pack",
        "variant_display_name": "15ml Pack",
        "variant_price": 29.99,
        "variant_image_url": "https://example.com/15ml-pack.jpg",
        "variant_metadata": {
          "variant_id": 1,
          "size_volume": "15ml",
          "pack_type": "Pack",
          "sku": "TEST-15ML",
          "image_url": "https://example.com/15ml-pack.jpg"
        }
      },
      "display_images": ["https://example.com/15ml-pack.jpg"],
      "display_image": "https://example.com/15ml-pack.jpg"
    }
  }
}
```

## Variant ID Format

Variant IDs follow a specific format based on their type:

- **MM Caliber:** `caliber_{mm_value}` (e.g., `caliber_78`)
- **Eye Hygiene:** `eye_hygiene_{variant_id}` (e.g., `eye_hygiene_1`)
- **Size/Volume:** `size_volume_{variant_id}` (e.g., `size_volume_1`)

## Frontend Implementation Guide

### 1. Loading Variants

```javascript
// Fetch all variants for a product
fetch(`/api/products/${productId}/variants`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      displayVariants(data.data.variants);
    }
  });
```

### 2. Displaying Variants

```javascript
function displayVariants(variants) {
  variants.forEach(variant => {
    const variantElement = createVariantElement(variant);
    container.appendChild(variantElement);
  });
}

function createVariantElement(variant) {
  const div = document.createElement('div');
  div.className = 'variant';
  div.onclick = () => selectVariant(variant);
  
  div.innerHTML = `
    <img src="${variant.image_url}" alt="${variant.display_name}">
    <h3>${variant.display_name}</h3>
    <div class="price">$${variant.price.toFixed(2)}</div>
    ${variant.compare_at_price ? 
      `<span class="compare-price">$${variant.compare_at_price.toFixed(2)}</span>` : ''}
    <div class="stock">Stock: ${variant.stock_quantity}</div>
  `;
  
  return div;
}
```

### 3. Adding to Cart

```javascript
function addToCart(variant) {
  fetch('/api/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      product_id: productId,
      selected_variant_id: variant.id,
      variant_type: variant.type,
      quantity: 1
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showSuccessMessage('Added to cart!');
      updateCartUI();
    }
  });
}
```

## Image Display Priority

The system uses the following priority for displaying variant images:

1. **Variant Image** (new variant system)
2. **Caliber Image** (legacy mm_caliber support)
3. **Eye Hygiene Variant Image**
4. **Size Volume Variant Image**
5. **Selected Color Images**
6. **Product Images**

## Database Schema

### Product Size Volume Variants

```sql
CREATE TABLE product_size_volumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  size_volume VARCHAR(50) NOT NULL,
  pack_type VARCHAR(50),
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  stock_quantity INT DEFAULT 0,
  stock_status ENUM('in_stock', 'out_of_stock', 'backorder') DEFAULT 'in_stock',
  sku VARCHAR(100),
  expiry_date DATETIME,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_product_variant (product_id, size_volume, pack_type),
  INDEX idx_product_id (product_id),
  INDEX idx_is_active (is_active),
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### Eye Hygiene Variants

```sql
CREATE TABLE eye_hygiene_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_product_id (product_id),
  INDEX idx_is_active (is_active),
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

## Testing

A test server is available at `test-variant-api.js`. Run it with:

```bash
node test-variant-api.js
```

Then visit `http://localhost:3001` to test the variant selection and cart functionality interactively.

## Error Handling

The API returns appropriate error messages for common scenarios:

- **404:** Product or variant not found
- **400:** Invalid request data or insufficient stock
- **500:** Server error

Always check the `success` field in the response before processing the data.
