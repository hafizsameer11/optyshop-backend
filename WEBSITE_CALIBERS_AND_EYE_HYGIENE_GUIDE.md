# Website Calibers and Eye Hygiene Variants Implementation Guide

## Overview

This guide explains how MM calibers and eye hygiene variants should work on the website frontend. These features enhance the shopping experience for optical products by allowing users to select frame sizes and purchase related eye hygiene products.

---

## MM Calibers System

### What are MM Calibers?
MM calibers represent the frame width/sizes available for glasses (e.g., 58mm, 62mm). Each caliber has its own product image to show how the glasses look in that specific size.

### How It Works on Website

#### 1. Product Display with Caliber Selection
```javascript
// Product page component
function ProductPage({ product }) {
  const [selectedCaliber, setSelectedCaliber] = useState(null);
  const [currentImage, setCurrentImage] = useState(product.images[0]);

  // Initialize with first available caliber
  useEffect(() => {
    if (product.mm_calibers?.length > 0) {
      setSelectedCaliber(product.mm_calibers[0].mm);
      setCurrentImage(product.mm_calibers[0].image_url);
    }
  }, [product]);

  const handleCaliberChange = (caliber) => {
    setSelectedCaliber(caliber.mm);
    setCurrentImage(caliber.image_url);
  };

  return (
    <div className="product-detail">
      {/* Product Image */}
      <div className="product-image">
        <img src={currentImage} alt={product.name} />
      </div>

      {/* Caliber Selector */}
      {product.mm_calibers?.length > 0 && (
        <div className="caliber-selector">
          <h3>Select Frame Size:</h3>
          <div className="caliber-options">
            {product.mm_calibers.map(caliber => (
              <button
                key={caliber.mm}
                className={`caliber-btn ${selectedCaliber === caliber.mm ? 'active' : ''}`}
                onClick={() => handleCaliberChange(caliber)}
              >
                {caliber.mm}mm
              </button>
            ))}
          </div>
          <p className="selected-size">
            Selected: <strong>{selectedCaliber}mm</strong>
          </p>
        </div>
      )}

      {/* Product Info */}
      <div className="product-info">
        <h1>{product.name}</h1>
        <p className="price">${product.price.toFixed(2)}</p>
        <button 
          className="add-to-cart"
          onClick={() => addToCart(product, selectedCaliber)}
          disabled={!selectedCaliber}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

#### 2. Cart Integration with Calibers
```javascript
// Cart item with caliber information
function CartItem({ item, onUpdate, onRemove }) {
  return (
    <div className="cart-item">
      <img src={item.image} alt={item.name} />
      <div className="item-details">
        <h3>{item.name}</h3>
        {item.caliber && (
          <p className="caliber-info">Size: {item.caliber}mm</p>
        )}
        <p className="price">${item.price.toFixed(2)}</p>
        <div className="quantity-controls">
          <button onClick={() => onUpdate(item.id, item.quantity - 1)}>-</button>
          <span>{item.quantity}</span>
          <button onClick={() => onUpdate(item.id, item.quantity + 1)}>+</button>
        </div>
      </div>
      <button className="remove-btn" onClick={() => onRemove(item.id)}>
        Remove
      </button>
    </div>
  );
}

// Add to cart function
function addToCart(product, caliber) {
  const cartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: caliber ? 
      product.mm_calibers.find(c => c.mm === caliber)?.image_url : 
      product.images[0],
    caliber: caliber,
    quantity: 1
  };
  
  // Add to cart state/localStorage
  updateCart(cartItem);
}
```

#### 3. Product Listing with Caliber Info
```javascript
// Product grid showing available calibers
function ProductGrid({ products }) {
  return (
    <div className="product-grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <img 
            src={product.images[0]} 
            alt={product.name}
            onClick={() => navigateToProduct(product.id)}
          />
          <div className="product-info">
            <h3>{product.name}</h3>
            <p className="price">${product.price.toFixed(2)}</p>
            
            {/* Show available calibers */}
            {product.mm_calibers?.length > 0 && (
              <div className="available-calibers">
                <span className="caliber-label">Sizes:</span>
                {product.mm_calibers.map(caliber => (
                  <span key={caliber.mm} className="caliber-tag">
                    {caliber.mm}mm
                  </span>
                ))}
              </div>
            )}
            
            <button onClick={() => navigateToProduct(product.id)}>
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Eye Hygiene Variants System

### What are Eye Hygiene Variants?
Eye hygiene variants are related products like cleaning solutions, cases, and accessories that can be purchased alongside main products. Each variant has its own price, image, and description.

### How It Works on Website

#### 1. Product Page with Eye Hygiene Variants
```javascript
function ProductPage({ product }) {
  return (
    <div className="product-page">
      {/* Main product details */}
      <ProductDetail product={product} />
      
      {/* Eye Hygiene Variants Section */}
      {product.eyeHygieneVariants?.length > 0 && (
        <section className="eye-hygiene-section">
          <h2>Complete Your Eye Care Routine</h2>
          <div className="variants-grid">
            {product.eyeHygieneVariants.map(variant => (
              <EyeHygieneVariantCard 
                key={variant.id} 
                variant={variant}
                onAddToCart={() => addVariantToCart(variant)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EyeHygieneVariantCard({ variant, onAddToCart }) {
  return (
    <div className="variant-card">
      <img src={variant.image_url} alt={variant.name} />
      <div className="variant-info">
        <h3>{variant.name}</h3>
        <p className="description">{variant.description}</p>
        <p className="price">${variant.price.toFixed(2)}</p>
        <button className="add-variant-btn" onClick={onAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

#### 2. Dedicated Eye Hygiene Category Page
```javascript
function EyeHygieneCategory() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    size: '',
    packType: '',
    priceRange: ''
  });

  useEffect(() => {
    fetchEyeHygieneProducts();
  }, [filters]);

  const fetchEyeHygieneProducts = async () => {
    const response = await fetch('/api/products?category=eye-hygiene');
    const data = await response.json();
    setProducts(data.data.products);
  };

  return (
    <div className="eye-hygiene-category">
      <h1>Eye Hygiene Products</h1>
      
      {/* Filters */}
      <div className="filters-sidebar">
        <h3>Filter by Size:</h3>
        <select onChange={(e) => setFilters({...filters, size: e.target.value})}>
          <option value="">All Sizes</option>
          <option value="5ml">5ml</option>
          <option value="10ml">10ml</option>
          <option value="30ml">30ml</option>
        </select>
        
        <h3>Filter by Pack Type:</h3>
        <select onChange={(e) => setFilters({...filters, packType: e.target.value})}>
          <option value="">All Pack Types</option>
          <option value="Single">Single</option>
          <option value="Pack of 2">Pack of 2</option>
          <option value="Pack of 3">Pack of 3</option>
        </select>
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {products.map(product => (
          <EyeHygieneProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function EyeHygieneProductCard({ product }) {
  return (
    <div className="eye-hygiene-card">
      <img src={product.images[0]} alt={product.name} />
      <div className="product-details">
        <h3>{product.name}</h3>
        <p className="price">${product.price.toFixed(2)}</p>
        
        {/* Eye Hygiene Specific Fields */}
        <div className="hygiene-details">
          {product.size_volume && (
            <p><strong>Size:</strong> {product.size_volume}</p>
          )}
          {product.pack_type && (
            <p><strong>Pack:</strong> {product.pack_type}</p>
          )}
          {product.expiry_date && (
            <p><strong>Expires:</strong> {formatDate(product.expiry_date)}</p>
          )}
          <p><strong>Stock:</strong> {product.stock_quantity} available</p>
        </div>
        
        <button onClick={() => addToCart(product)}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

#### 3. Shopping Cart with Mixed Products
```javascript
function ShoppingCart() {
  const [cartItems, setCartItems] = useState([]);

  const renderCartItem = (item) => {
    // Main product with caliber
    if (item.type === 'main_product') {
      return (
        <MainProductCartItem 
          item={item} 
          onUpdate={updateQuantity}
          onRemove={removeFromCart}
        />
      );
    }
    
    // Eye hygiene variant
    if (item.type === 'eye_hygiene_variant') {
      return (
        <EyeHygieneVariantCartItem 
          item={item}
          onUpdate={updateQuantity}
          onRemove={removeFromCart}
        />
      );
    }
  };

  return (
    <div className="shopping-cart">
      <h1>Your Shopping Cart</h1>
      
      <div className="cart-items">
        {cartItems.map(item => (
          <div key={item.uniqueId}>
            {renderCartItem(item)}
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <h3>Order Summary</h3>
        <p>Subtotal: ${calculateSubtotal()}</p>
        <p>Shipping: ${calculateShipping()}</p>
        <p>Total: ${calculateTotal()}</p>
        <button className="checkout-btn">Proceed to Checkout</button>
      </div>
    </div>
  );
}
```

---

## API Integration

### Fetching Product with Calibers and Variants
```javascript
// Get single product with all related data
async function getProductWithDetails(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const data = await response.json();
    
    if (data.success) {
      const product = data.data.product;
      
      // Ensure mm_calibers is an array
      product.mm_calibers = product.mm_calibers || [];
      
      // Ensure eyeHygieneVariants is an array
      product.eyeHygieneVariants = product.eyeHygieneVariants || [];
      
      return product;
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Get eye hygiene category products
async function getEyeHygieneProducts(filters = {}) {
  const queryParams = new URLSearchParams({
    category: 'eye-hygiene',
    ...filters
  });
  
  try {
    const response = await fetch(`/api/products?${queryParams}`);
    const data = await response.json();
    
    return data.success ? data.data.products : [];
  } catch (error) {
    console.error('Error fetching eye hygiene products:', error);
    return [];
  }
}
```

---

## User Experience Flow

### 1. Glasses Shopping Flow
1. **Browse Products**: User sees glasses with available sizes displayed
2. **Select Product**: Click to view details
3. **Choose Caliber**: Select frame size (58mm, 62mm, etc.)
4. **Image Updates**: Product image changes to show selected size
5. **Add to Cart**: Selected size is saved with cart item
6. **Checkout**: Size information is preserved in order

### 2. Eye Hygiene Shopping Flow
1. **Browse Category**: Navigate to Eye Hygiene section
2. **Filter Options**: Filter by size, pack type, price
3. **View Details**: See product specifications (size, pack type, expiry)
4. **Add Variants**: Add cleaning solutions, cases, etc.
5. **Mixed Cart**: Can have both glasses and hygiene products
6. **Checkout**: All items processed together

---

## CSS Styling Examples

### Caliber Selector Styles
```css
.caliber-selector {
  margin: 20px 0;
}

.caliber-options {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.caliber-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.caliber-btn:hover {
  border-color: #007bff;
}

.caliber-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.selected-size {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}
```

### Eye Hygiene Card Styles
```css
.eye-hygiene-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.eye-hygiene-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.hygiene-details {
  background: #f8f9fa;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
}

.hygiene-details p {
  margin: 5px 0;
  font-size: 14px;
}

.hygiene-details strong {
  color: #333;
}
```

---

## Mobile Responsiveness

### Caliber Selector on Mobile
```css
@media (max-width: 768px) {
  .caliber-options {
    flex-wrap: wrap;
  }
  
  .caliber-btn {
    flex: 1;
    min-width: 60px;
    text-align: center;
  }
}
```

### Eye Hygiene Grid on Mobile
```css
@media (max-width: 768px) {
  .variants-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .variant-card {
    display: flex;
    align-items: center;
  }
  
  .variant-card img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    margin-right: 15px;
  }
}
```

---

## Error Handling

### Loading States
```javascript
function ProductPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductWithDetails(productId);
        setProduct(data);
      } catch (err) {
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) return <ProductSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <NotFound />;

  return <ProductDetail product={product} />;
}
```

### Image Fallbacks
```javascript
function ProductImage({ src, alt, fallback }) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback || '/placeholder-image.jpg');
    }
  };

  return (
    <img 
      src={imageSrc} 
      alt={alt}
      onError={handleError}
      className="product-image"
    />
  );
}
```

---

## Performance Optimization

### Image Lazy Loading
```javascript
function LazyImage({ src, alt, className }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
    </div>
  );
}
```

---

## Testing Considerations

### Unit Tests
```javascript
// Test caliber selection
test('should update image when caliber is selected', () => {
  const product = {
    id: 1,
    name: 'Test Glasses',
    mm_calibers: [
      { mm: '58', image_url: 'image-58.jpg' },
      { mm: '62', image_url: 'image-62.jpg' }
    ]
  };

  const { getByRole } = render(<ProductPage product={product} />);
  
  const caliber58 = getByRole('button', { name: '58mm' });
  fireEvent.click(caliber58);
  
  expect(getByAltText('Test Glasses')).toHaveAttribute('src', 'image-58.jpg');
});
```

### Integration Tests
```javascript
// Test API integration
test('should fetch product with calibers and variants', async () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    mm_calibers: [{ mm: '58', image_url: 'test.jpg' }],
    eyeHygieneVariants: [{ id: 1, name: 'Cleaner', price: 9.99 }]
  };

  fetch.mockResolvedValueOnce({
    json: () => Promise.resolve({
      success: true,
      data: { product: mockProduct }
    })
  });

  const product = await getProductWithDetails(1);
  
  expect(product.mm_calibers).toHaveLength(1);
  expect(product.eyeHygieneVariants).toHaveLength(1);
});
```

---

## Summary

The MM calibers and eye hygiene variants system provides a comprehensive shopping experience for optical products:

1. **MM Calibers**: Allow users to select frame sizes with corresponding images
2. **Eye Hygiene Variants**: Offer related products with detailed specifications
3. **Seamless Integration**: Both systems work together in cart and checkout
4. **Responsive Design**: Optimized for all device sizes
5. **Performance**: Lazy loading and efficient API calls
6. **Error Handling**: Graceful fallbacks and loading states

This implementation enhances user experience by providing detailed product information and customization options for optical purchases.
