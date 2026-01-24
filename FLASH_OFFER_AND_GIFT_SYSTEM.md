# Flash Offer and Free Gift System Implementation

## Overview
This document describes the implementation of two new features:
1. **Flash Offers with Countdown Timer** - Time-limited sales with countdown display
2. **Free Gift System** - Automatic free gifts for selected products

## Database Schema

### FlashOffer Model
- `id` - Primary key
- `title` - Offer title
- `description` - Offer description
- `product_ids` - JSON array of product IDs on offer
- `discount_type` - Optional discount type (percentage, fixed_amount, etc.)
- `discount_value` - Optional discount value
- `starts_at` - Offer start date/time
- `ends_at` - Offer end date/time (required for countdown)
- `is_active` - Active status
- `image_url` - Optional banner image
- `link_url` - Optional link URL

### ProductGift Model
- `id` - Primary key
- `product_id` - Product that triggers the gift
- `gift_product_id` - Product given as free gift
- `min_quantity` - Minimum quantity to get gift (default: 1)
- `max_quantity` - Maximum quantity for gift eligibility (optional)
- `is_active` - Active status
- `description` - Optional description

## API Endpoints

### Flash Offers

#### Public Endpoints
- `GET /api/flash-offers` - Get all flash offers (optional `?activeOnly=true`)
- `GET /api/flash-offers/active` - Get currently active flash offer with countdown

#### Admin Endpoints
- `GET /api/admin/flash-offers` - Get all flash offers (admin)
- `GET /api/admin/flash-offers/:id` - Get flash offer by ID
- `POST /api/admin/flash-offers` - Create flash offer (supports image upload)
- `PUT /api/admin/flash-offers/:id` - Update flash offer (supports image upload)
- `DELETE /api/admin/flash-offers/:id` - Delete flash offer

**Response Format for Active Offer:**
```json
{
  "success": true,
  "message": "Active flash offer retrieved successfully",
  "data": {
    "offer": {
      "id": 1,
      "title": "Flash Sale - 50% Off!",
      "description": "Limited time offer",
      "product_ids": [1, 2, 3],
      "starts_at": "2026-01-15T10:00:00.000Z",
      "ends_at": "2026-01-20T23:59:59.000Z",
      "countdown": {
        "hours": 48,
        "minutes": 30,
        "seconds": 15,
        "totalSeconds": 174615
      },
      "is_expired": false
    }
  }
}
```

### Product Gifts

#### Public Endpoints
- `GET /api/product-gifts` - Get all active product gifts (optional `?product_id=X`)
- `GET /api/product-gifts/product/:productId` - Get gifts for a specific product

#### Admin Endpoints
- `GET /api/admin/product-gifts` - Get all product gifts (admin)
- `GET /api/admin/product-gifts/:id` - Get product gift by ID
- `POST /api/admin/product-gifts` - Create product gift
- `PUT /api/admin/product-gifts/:id` - Update product gift
- `DELETE /api/admin/product-gifts/:id` - Delete product gift

**Request Body for Creating Product Gift:**
```json
{
  "product_id": 1,
  "gift_product_id": 5,
  "min_quantity": 1,
  "max_quantity": 10,
  "description": "Free gift with purchase",
  "is_active": true
}
```

## Cart Integration

### Automatic Gift Addition
When a product is added to the cart, the system automatically:
1. Checks for applicable free gifts based on:
   - Product ID matches
   - Quantity meets `min_quantity` requirement
   - Quantity is within `max_quantity` range (if set)
   - Gift product is active and in stock
2. Adds gift items to cart with:
   - `unit_price: 0` (free)
   - `customization` field marked with `is_gift: true`
   - Reference to original product and gift rule

**Cart Response includes gifts:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "item": { ... },
    "gifts": [
      {
        "id": 123,
        "product_id": 5,
        "quantity": 1,
        "unit_price": 0,
        "gift_product": { ... }
      }
    ]
  }
}
```

## Frontend Integration Guide

### Flash Offer Countdown Display

1. **Fetch Active Offer:**
```javascript
const response = await fetch('/api/flash-offers/active');
const { data } = await response.json();
const offer = data.offer;
```

2. **Display Countdown:**
```javascript
if (offer && !offer.is_expired && offer.countdown) {
  const { hours, minutes, seconds } = offer.countdown;
  // Display countdown timer
  // Update every second using setInterval
}
```

3. **Update Countdown (Client-side):**
```javascript
setInterval(() => {
  const now = new Date();
  const endsAt = new Date(offer.ends_at);
  const timeRemaining = endsAt - now;
  
  if (timeRemaining <= 0) {
    // Offer expired
    return;
  }
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  // Update UI
}, 1000);
```

### Free Gift Display

1. **Check for Gifts:**
```javascript
// When viewing a product
const response = await fetch(`/api/product-gifts/product/${productId}`);
const { gifts } = await response.data;

if (gifts && gifts.length > 0) {
  // Display "Free gift with purchase" message
  gifts.forEach(gift => {
    console.log(`Buy ${gift.min_quantity}+ and get ${gift.giftProduct.name} free!`);
  });
}
```

2. **Handle Gift in Cart:**
```javascript
// After adding item to cart
const response = await fetch('/api/cart/items', {
  method: 'POST',
  body: JSON.stringify({ product_id: 1, quantity: 2 })
});

const { data } = await response.json();
if (data.gifts && data.gifts.length > 0) {
  // Show notification: "Free gift added to your cart!"
  data.gifts.forEach(gift => {
    console.log(`Added free: ${gift.gift_product.name}`);
  });
}
```

## Migration

To apply the database changes, run:
```bash
npx prisma migrate deploy
```

Or manually execute the SQL file:
```bash
mysql -u username -p database_name < prisma/migrations/20250115000000_add_flash_offers_and_product_gifts/migration.sql
```

## Admin Panel Usage

### Creating a Flash Offer
1. Navigate to Admin Panel → Flash Offers
2. Click "Create New Flash Offer"
3. Fill in:
   - Title (e.g., "Flash Sale - 50% Off!")
   - Description
   - Select products (product_ids array)
   - Start date/time
   - End date/time (required for countdown)
   - Upload banner image (optional)
   - Add link URL (optional)
4. Save

### Creating a Product Gift
1. Navigate to Admin Panel → Product Gifts
2. Click "Create New Gift"
3. Fill in:
   - Product (that triggers the gift)
   - Gift Product (free item)
   - Minimum quantity (default: 1)
   - Maximum quantity (optional)
   - Description
4. Save

## Notes

- Flash offers automatically calculate countdown in hours, minutes, and seconds
- Free gifts are automatically added to cart when eligible products are added
- Gift items have `unit_price: 0` and are marked in customization field
- Both systems support active/inactive status for easy management
- Product gifts check stock status before adding to cart
