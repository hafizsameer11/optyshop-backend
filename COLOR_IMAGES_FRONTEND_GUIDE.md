# Color Images Frontend Integration Guide

## Overview
Products with color variants now display color-specific images on category, subcategory, and sub-subcategory pages. When a user clicks on a color, the product images update to show that color's images, and the selected color is preserved when adding to cart and proceeding to checkout.

---

## Backend Changes

### 1. Updated Endpoints
All product listing endpoints now return color images formatted with hex codes:

- ✅ `GET /api/products` - Already includes color images via `formatProductMedia`
- ✅ `GET /api/products/:id` - Single product with color images
- ✅ `GET /api/products/slug/:slug` - Product by slug with color images
- ✅ `GET /api/products/featured` - Featured products with color images
- ✅ `GET /api/products/:id/related` - Related products with color images
- ✅ `GET /api/subcategories/:id/products` - **UPDATED** Now uses `formatProductMedia` to include color images

### 2. Product Response Format
All product endpoints return products in this format:

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Product Name",
        "price": "99.99",
        "images": ["url1.jpg", "url2.jpg"],  // General product images
        "image": "url1.jpg",  // Primary image (from selected color or general)
        "color_images": [  // Raw color images data
          {
            "hexCode": "#000000",
            "name": "Black",
            "price": 99.99,
            "images": ["black1.jpg", "black2.jpg"]
          },
          {
            "hexCode": "#FFD700",
            "name": "Gold",
            "price": 109.99,
            "images": ["gold1.jpg", "gold2.jpg"]
          }
        ],
        "colors": [  // Formatted for frontend color swatches
          {
            "name": "Black",
            "display_name": "Black",
            "value": "#000000",  // Use this for color selection
            "hexCode": "#000000",  // For color picker/swatch display
            "price": 99.99,  // Variant-specific price (null if same as base)
            "images": ["black1.jpg", "black2.jpg"],
            "primaryImage": "black1.jpg"
          },
          {
            "name": "Gold",
            "display_name": "Gold",
            "value": "#FFD700",
            "hexCode": "#FFD700",
            "price": 109.99,
            "images": ["gold1.jpg", "gold2.jpg"],
            "primaryImage": "gold1.jpg"
          }
        ],
        "selectedColor": "#000000",  // Default selected color
        "currentVariantPrice": 99.99,  // Price for selected color
        "model_3d_url": null
      }
    ]
  }
}
```

---

## Frontend Implementation Guide

### 1. Display Products on Category/Subcategory Pages

#### Product Card Component
```jsx
import { useState } from 'react';

function ProductCard({ product }) {
  const [selectedColor, setSelectedColor] = useState(product.selectedColor || null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get images for selected color
  const getCurrentImages = () => {
    if (selectedColor && product.colors && product.colors.length > 0) {
      const colorData = product.colors.find(c => c.value === selectedColor);
      if (colorData && colorData.images && colorData.images.length > 0) {
        return colorData.images;
      }
    }
    // Fallback to general images
    return product.images || [];
  };

  const currentImages = getCurrentImages();
  const currentImage = currentImages[currentImageIndex] || product.image;

  // Get current price (variant price or base price)
  const getCurrentPrice = () => {
    if (selectedColor && product.colors && product.colors.length > 0) {
      const colorData = product.colors.find(c => c.value === selectedColor);
      if (colorData && colorData.price !== null) {
        return colorData.price;
      }
    }
    return parseFloat(product.price);
  };

  return (
    <div className="product-card">
      {/* Image Gallery */}
      <div className="product-images">
        <img 
          src={currentImage} 
          alt={product.name}
          onClick={() => {
            // Navigate to product detail page with selected color
            window.location.href = `/products/${product.slug}?color=${selectedColor}`;
          }}
        />
        
        {/* Image Navigation (if multiple images) */}
        {currentImages.length > 1 && (
          <div className="image-nav">
            <button 
              onClick={() => setCurrentImageIndex(prev => 
                prev > 0 ? prev - 1 : currentImages.length - 1
              )}
            >
              ←
            </button>
            <span>{currentImageIndex + 1} / {currentImages.length}</span>
            <button 
              onClick={() => setCurrentImageIndex(prev => 
                prev < currentImages.length - 1 ? prev + 1 : 0
              )}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Color Swatches */}
      {product.colors && product.colors.length > 0 && (
        <div className="color-swatches">
          {product.colors.map((color) => (
            <button
              key={color.value}
              className={`color-swatch ${selectedColor === color.value ? 'active' : ''}`}
              style={{ backgroundColor: color.hexCode }}
              onClick={() => {
                setSelectedColor(color.value);
                setCurrentImageIndex(0); // Reset to first image of new color
              }}
              title={color.display_name}
            />
          ))}
        </div>
      )}

      {/* Product Info */}
      <h3>{product.name}</h3>
      <p className="price">${getCurrentPrice().toFixed(2)}</p>

      {/* Quick Add to Cart */}
      <button 
        onClick={() => handleAddToCart(product, selectedColor)}
        className="add-to-cart-btn"
      >
        Add to Cart
      </button>
    </div>
  );
}
```

### 2. Add to Cart with Selected Color

```javascript
async function handleAddToCart(product, selectedColor) {
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: product.id,
        quantity: 1,
        selected_color: selectedColor || product.selectedColor  // Send hex code
      })
    });

    const data = await response.json();
    if (data.success) {
      // Show success message
      // Update cart count
    }
  } catch (error) {
    console.error('Add to cart error:', error);
  }
}
```

### 3. Product Detail Page

```jsx
function ProductDetailPage({ productId, initialColor }) {
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(initialColor || null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct(productId);
  }, [productId]);

  useEffect(() => {
    // Update selected color from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const colorParam = urlParams.get('color');
    if (colorParam) {
      setSelectedColor(colorParam);
    } else if (product && product.selectedColor) {
      setSelectedColor(product.selectedColor);
    }
  }, [product]);

  const getCurrentImages = () => {
    if (selectedColor && product?.colors?.length > 0) {
      const colorData = product.colors.find(c => c.value === selectedColor);
      if (colorData?.images?.length > 0) {
        return colorData.images;
      }
    }
    return product?.images || [];
  };

  const currentImages = getCurrentImages();
  const currentImage = currentImages[currentImageIndex];

  return (
    <div className="product-detail">
      {/* Main Image Display */}
      <div className="main-image">
        <img src={currentImage} alt={product?.name} />
        
        {/* Image Navigation */}
        {currentImages.length > 1 && (
          <div className="image-nav">
            <button onClick={() => setCurrentImageIndex(prev => 
              prev > 0 ? prev - 1 : currentImages.length - 1
            )}>← Previous</button>
            <span>{currentImageIndex + 1} / {currentImages.length}</span>
            <button onClick={() => setCurrentImageIndex(prev => 
              prev < currentImages.length - 1 ? prev + 1 : 0
            )}>Next →</button>
          </div>
        )}

        {/* Thumbnail Gallery */}
        <div className="thumbnail-gallery">
          {currentImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${product?.name} - Image ${idx + 1}`}
              className={currentImageIndex === idx ? 'active' : ''}
              onClick={() => setCurrentImageIndex(idx)}
            />
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="color-selection">
        <h3>Select Color</h3>
        <div className="color-swatches">
          {product?.colors?.map((color) => (
            <button
              key={color.value}
              className={`color-swatch ${selectedColor === color.value ? 'active' : ''}`}
              style={{ backgroundColor: color.hexCode }}
              onClick={() => {
                setSelectedColor(color.value);
                setCurrentImageIndex(0); // Reset to first image
                // Update URL without page reload
                const url = new URL(window.location);
                url.searchParams.set('color', color.value);
                window.history.pushState({}, '', url);
              }}
              title={color.display_name}
            >
              {color.display_name}
            </button>
          ))}
        </div>
      </div>

      {/* Add to Cart */}
      <button 
        onClick={() => handleAddToCart(product, selectedColor)}
        className="add-to-cart-btn"
      >
        Add to Cart - ${getCurrentPrice().toFixed(2)}
      </button>

      {/* Proceed to Checkout */}
      <button 
        onClick={() => {
          handleAddToCart(product, selectedColor);
          // Navigate to checkout after adding
          setTimeout(() => {
            window.location.href = '/checkout';
          }, 500);
        }}
        className="checkout-btn"
      >
        Buy Now
      </button>
    </div>
  );
}
```

### 4. Cart Display with Color

The cart already stores the selected color in the `customization` field. Display it like this:

```jsx
function CartItem({ item }) {
  const customization = item.customization ? 
    (typeof item.customization === 'string' ? 
      JSON.parse(item.customization) : 
      item.customization
    ) : {};

  const selectedColor = customization.selected_color || customization.hex_code;
  const colorName = customization.color_name || customization.color_display_name;

  return (
    <div className="cart-item">
      <img src={item.product.image} alt={item.product.name} />
      <div>
        <h4>{item.product.name}</h4>
        {selectedColor && (
          <div className="selected-color">
            <span 
              className="color-indicator" 
              style={{ backgroundColor: selectedColor }}
            />
            <span>Color: {colorName}</span>
          </div>
        )}
        <p>Quantity: {item.quantity}</p>
        <p>Price: ${item.calculated_price}</p>
      </div>
    </div>
  );
}
```

---

## Key Points

1. **Color Selection**: Use `color.value` (hex code) for color selection and matching
2. **Image Display**: When a color is selected, show images from `color.images` array
3. **Price Display**: Use `color.price` if available, otherwise use base `product.price`
4. **Add to Cart**: Always send `selected_color` as hex code (e.g., `"#000000"`)
5. **URL Parameters**: Use `?color=#000000` in product detail URLs to preserve color selection
6. **Image Navigation**: Allow users to navigate through all images for the selected color
7. **Checkout**: Selected color is automatically included in cart items and preserved through checkout

---

## Testing Checklist

- [ ] Products with color images display on category pages
- [ ] Products with color images display on subcategory pages
- [ ] Products with color images display on sub-subcategory pages
- [ ] Color swatches are clickable and update product images
- [ ] Image navigation (next/previous) works for each color
- [ ] Selected color is preserved when adding to cart
- [ ] Selected color is displayed in cart items
- [ ] Selected color is preserved through checkout
- [ ] URL parameters preserve color selection on product detail page
- [ ] Price updates when color with different price is selected
- [ ] Fallback to general images when no color is selected

---

## API Endpoints Summary

| Endpoint | Color Images | Notes |
|----------|--------------|-------|
| `GET /api/products` | ✅ Yes | Includes `colors` array |
| `GET /api/products/:id` | ✅ Yes | Single product with colors |
| `GET /api/products/slug/:slug` | ✅ Yes | Product by slug with colors |
| `GET /api/products/featured` | ✅ Yes | Featured products with colors |
| `GET /api/products/:id/related` | ✅ Yes | Related products with colors |
| `GET /api/subcategories/:id/products` | ✅ Yes | **Now includes colors** |
| `POST /api/cart` | ✅ Yes | Accepts `selected_color` (hex code) |
| `GET /api/cart` | ✅ Yes | Returns color in `customization` field |

---

## Example API Response

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Classic Black Frames",
        "slug": "classic-black-frames",
        "price": "99.99",
        "images": ["general1.jpg", "general2.jpg"],
        "image": "black1.jpg",
        "colors": [
          {
            "name": "Black",
            "value": "#000000",
            "hexCode": "#000000",
            "price": 99.99,
            "images": ["black1.jpg", "black2.jpg", "black3.jpg"],
            "primaryImage": "black1.jpg"
          },
          {
            "name": "Gold",
            "value": "#FFD700",
            "hexCode": "#FFD700",
            "price": 109.99,
            "images": ["gold1.jpg", "gold2.jpg"],
            "primaryImage": "gold1.jpg"
          }
        ],
        "selectedColor": "#000000",
        "currentVariantPrice": 99.99
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 12,
      "pages": 1
    }
  }
}
```

---

## Support

For questions or issues, refer to:
- `COLOR_IMAGE_SYSTEM_VERIFICATION.md` - System architecture
- `COLOR_VARIANT_SELECTION.md` - Color selection implementation
- Postman Collection - API examples

