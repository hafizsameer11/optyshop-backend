# Color Variant Selection - Implementation Guide

## Overview

This document describes the color/variant selection feature that allows customers to select a product color variant before adding to cart. When a color is selected, the system uses the variant-specific price and stores the selection for cart and order processing.

---

## 🎨 **How It Works**

### **1. Product Color Variants**

Products can have multiple color variants stored in the `color_images` field (JSON array). Each variant includes:
- `color`: Color value (e.g., "black", "brown")
- `name`: Variant name (e.g., "Black Classic")
- `display_name`: Display name shown to customers
- `price`: Variant-specific price (optional - uses base product price if not provided)
- `images`: Array of images for this color variant

### **2. Color Selection Flow**

```
1. Customer views product
   ↓
2. Product API returns colors array with all available variants
   ↓
3. Customer selects a color (e.g., "black")
   ↓
4. Frontend updates:
   - Product images (shows color-specific images)
   - Product price (shows variant price if available)
   ↓
5. Customer clicks "Add to Cart" or "Select Lenses"
   ↓
6. Frontend sends selected_color in request
   ↓
7. Backend:
   - Finds matching color variant
   - Uses variant price (or base price)
   - Stores color selection in cart item
```

---

## 📋 **API Implementation**

### **Add to Cart with Color Selection**

**Endpoint:** `POST /api/cart/items`

**Request Body:**
```json
{
  "product_id": 89,
  "quantity": 1,
  "selected_color": "black",
  "lens_index": 1.61,
  "lens_coatings": ["ar", "blue_light"]
}
```

**Parameters:**
- `selected_color` (optional): Color value from product's colors array (e.g., "black", "brown")
  - Must match the `value` field from the colors array returned by product API
  - Case-insensitive matching
  - If not provided, uses base product price

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "item": {
      "id": 1,
      "product_id": 89,
      "quantity": 1,
      "unit_price": "75.99",
      "customization": {
        "selected_color": "black",
        "color_name": "Black Classic",
        "color_display_name": "Black Classic Premium",
        "variant_price": 75.99,
        "variant_images": [
          "https://example.com/images/black-1.jpg",
          "https://example.com/images/black-2.jpg"
        ]
      }
    }
  }
}
```

---

## 🔄 **Backend Logic**

### **Color Variant Matching**

1. **Parse color_images**: Extract color variants from product's `color_images` field
2. **Find match**: Search for color variant matching `selected_color` (case-insensitive)
3. **Price selection**:
   - If variant has `price`, use variant price
   - Otherwise, use base product price
4. **Store selection**: Save color information in cart item's `customization` field

### **Cart Item Uniqueness**

Cart items are considered the same if:
- Same `product_id`
- Same `lens_index`
- Same `selected_color` (if color is selected)

If a matching item exists, quantity is incremented instead of creating a new item.

---

## 💾 **Data Storage**

### **CartItem.customization Field**

When a color is selected, the following data is stored in the `customization` JSON field:

```json
{
  "selected_color": "black",
  "color_name": "Black Classic",
  "color_display_name": "Black Classic Premium",
  "variant_price": 75.99,
  "variant_images": [
    "https://example.com/images/black-1.jpg",
    "https://example.com/images/black-2.jpg"
  ]
}
```

This data is:
- Stored when adding to cart
- Retrieved when viewing cart
- Used when creating orders
- Preserved in order items

---

## 🎯 **Frontend Integration**

### **1. Get Product with Colors**

```javascript
// Product API already returns colors array
const product = await getProduct(productId);
// product.colors = [
//   { value: "black", name: "Black Classic", price: 75.99, images: [...] },
//   { value: "brown", name: "Brown Premium", price: 79.99, images: [...] }
// ]
```

### **2. Handle Color Selection**

```javascript
const [selectedColor, setSelectedColor] = useState(product.selectedColor || null);

const handleColorSelect = (colorValue) => {
  setSelectedColor(colorValue);
  
  // Find selected color variant
  const colorVariant = product.colors.find(c => c.value === colorValue);
  
  // Update displayed price
  const displayPrice = colorVariant?.price || product.price;
  
  // Update displayed images
  const displayImages = colorVariant?.images || product.images;
};
```

### **3. Add to Cart with Selected Color**

```javascript
const handleAddToCart = async () => {
  const response = await addToCart({
    product_id: product.id,
    quantity: 1,
    selected_color: selectedColor, // Pass selected color
    lens_index: selectedLensIndex,
    lens_coatings: selectedCoatings
  });
  
  // Cart item will have customization.selected_color stored
};
```

---

## ✅ **Features**

### **Automatic Price Updates**
- ✅ Variant-specific prices are automatically used
- ✅ Base product price used if variant has no price
- ✅ Price updates when color changes

### **Image Updates**
- ✅ Color-specific images displayed when color selected
- ✅ Base product images used if variant has no images
- ✅ Images stored in cart item for order processing

### **Cart Management**
- ✅ Same color variants are combined (quantity incremented)
- ✅ Different colors create separate cart items
- ✅ Color selection preserved in cart and orders

### **Order Processing**
- ✅ Color selection included in order items
- ✅ Variant price used for order total
- ✅ Color information available for fulfillment

---

## 📝 **Example Use Cases**

### **Use Case 1: Simple Color Selection**

**Product:** Sunglasses with Black and Brown variants

1. Customer views product → Sees both colors available
2. Customer selects "Black" → Price updates to $75.99, images change
3. Customer clicks "Add to Cart" → Item added with `selected_color: "black"`
4. Cart shows: "Sunglasses - Black" with variant price

### **Use Case 2: Color with Lens Selection**

**Product:** Prescription glasses with color variants

1. Customer selects "Brown" color
2. Customer clicks "Select Lenses"
3. Customer configures prescription lenses
4. Customer adds to cart → Item includes both color and lens configuration
5. Cart item stores: `selected_color: "brown"` + lens configuration

### **Use Case 3: Multiple Quantities**

**Product:** Frames with multiple colors

1. Customer adds "Black" variant (quantity: 1)
2. Customer adds "Black" variant again (quantity: 2) → Same item, quantity incremented
3. Customer adds "Brown" variant → New cart item created
4. Cart shows: 2 items (Black x2, Brown x1)

---

## 🔧 **Technical Details**

### **Color Matching Algorithm**

```javascript
// Backend matching logic (case-insensitive)
const normalizedSelectedColor = selected_color.toLowerCase().trim();
selectedColorVariant = colorImages.find(colorData => {
  const colorValue = colorData.color?.toLowerCase() || colorData.name?.toLowerCase() || '';
  return colorValue === normalizedSelectedColor || 
         colorValue.includes(normalizedSelectedColor) ||
         normalizedSelectedColor.includes(colorValue);
});
```

### **Price Calculation**

```javascript
// Variant price takes precedence
let calculatedPrice = variantPrice !== null 
  ? variantPrice 
  : parseFloat(product.price);

// Then add lens/addon prices
calculatedPrice += lensPrice + coatingPrice + ...;
```

### **Cart Item Uniqueness**

```javascript
// Items are unique by: product_id + lens_index + selected_color
// If all match, quantity is incremented
// If any differ, new item is created
```

---

## 🚨 **Error Handling**

### **Invalid Color Selection**

If `selected_color` doesn't match any variant:
- ⚠️ Warning logged to console
- ✅ Request continues with base product price
- ✅ No error returned to user
- ℹ️ Base product added to cart (no color stored)

### **Missing Variant Price**

If variant exists but has no `price`:
- ✅ Base product price is used
- ✅ Color selection is still stored
- ✅ Variant images are still used

---

## 📊 **Database Schema**

### **Product.color_images (JSON)**

```json
[
  {
    "color": "black",
    "name": "Black Classic",
    "display_name": "Black Classic Premium",
    "price": 75.99,
    "images": [
      "https://example.com/black-1.jpg",
      "https://example.com/black-2.jpg"
    ]
  },
  {
    "color": "brown",
    "name": "Brown Premium",
    "display_name": "Brown Premium",
    "price": 79.99,
    "images": [
      "https://example.com/brown-1.jpg"
    ]
  }
]
```

### **CartItem.customization (JSON)**

```json
{
  "selected_color": "black",
  "color_name": "Black Classic",
  "color_display_name": "Black Classic Premium",
  "variant_price": 75.99,
  "variant_images": [
    "https://example.com/black-1.jpg",
    "https://example.com/black-2.jpg"
  ]
}
```

---

## 🎉 **Benefits**

1. **Flexible Pricing**: Different colors can have different prices
2. **Visual Selection**: Customers see color-specific images
3. **Accurate Orders**: Color selection preserved through checkout
4. **Inventory Tracking**: Can track sales by color variant
5. **Customer Experience**: Clear color selection and pricing

---

## 📞 **Support**

For questions or issues:
1. Check product `color_images` structure
2. Verify `selected_color` matches color `value` field
3. Check cart item `customization` field for stored color data
4. Review server logs for color matching warnings

---

**Last Updated:** 2025-01-26
**Version:** 1.0.0

