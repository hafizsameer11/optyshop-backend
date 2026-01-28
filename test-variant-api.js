const express = require('express');
const app = express();
const port = 3001;

// Test data for variant API
const testProduct = {
  id: 1,
  name: 'Test Product',
  slug: 'test-product',
  base_price: 29.99,
  images: ['https://example.com/image1.jpg'],
  variants: [
    {
      id: 'caliber_78',
      type: 'mm_caliber',
      name: '78mm',
      display_name: '78mm Caliber',
      price: 29.99,
      image_url: 'https://example.com/caliber-78.jpg',
      stock_quantity: 10,
      stock_status: 'in_stock',
      sort_order: 0,
      metadata: {
        mm: '78',
        image_url: 'https://example.com/caliber-78.jpg'
      }
    },
    {
      id: 'size_volume_1',
      type: 'size_volume',
      name: '15ml Pack',
      display_name: '15ml Pack',
      price: 29.99,
      compare_at_price: 39.99,
      image_url: 'https://example.com/15ml-pack.jpg',
      stock_quantity: 5,
      stock_status: 'in_stock',
      sku: 'TEST-15ML',
      sort_order: 1,
      metadata: {
        variant_id: 1,
        size_volume: '15ml',
        pack_type: 'Pack',
        sku: 'TEST-15ML',
        image_url: 'https://example.com/15ml-pack.jpg'
      }
    },
    {
      id: 'eye_hygiene_1',
      type: 'eye_hygiene',
      name: 'Premium Eye Care',
      display_name: 'Premium Eye Care',
      description: 'Advanced eye hygiene solution',
      price: 34.99,
      image_url: 'https://example.com/eye-care.jpg',
      stock_quantity: 8,
      stock_status: 'in_stock',
      sort_order: 2,
      metadata: {
        variant_id: 1,
        image_url: 'https://example.com/eye-care.jpg'
      }
    }
  ]
};

// Mock API endpoints for testing
app.get('/api/products/:id/variants', (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === testProduct.id) {
    res.json({
      success: true,
      message: 'Product variants retrieved successfully',
      data: {
        product: {
          id: testProduct.id,
          name: testProduct.name,
          slug: testProduct.slug,
          base_price: testProduct.base_price,
          images: testProduct.images,
          color_images: []
        },
        variants: testProduct.variants
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
});

app.get('/api/products/:id/variants/:variantId', (req, res) => {
  const { id, variantId } = req.params;
  if (parseInt(id) === testProduct.id) {
    const variant = testProduct.variants.find(v => v.id === variantId);
    if (variant) {
      res.json({
        success: true,
        message: 'Variant details retrieved successfully',
        data: {
          product: {
            id: testProduct.id,
            name: testProduct.name,
            slug: testProduct.slug,
            base_price: testProduct.base_price,
            images: testProduct.images,
            color_images: []
          },
          variant
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }
  } else {
    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
});

// Mock cart endpoint
app.post('/api/cart/items', (req, res) => {
  const { product_id, selected_variant_id, variant_type, quantity = 1 } = req.body;
  
  console.log('Cart addition request:', {
    product_id,
    selected_variant_id,
    variant_type,
    quantity
  });
  
  // Find the variant
  const variant = testProduct.variants.find(v => v.id === selected_variant_id);
  
  if (variant) {
    const cartItem = {
      id: Math.floor(Math.random() * 1000),
      product_id,
      quantity,
      unit_price: variant.price,
      customization: {
        selected_variant_id,
        variant_type,
        variant_name: variant.name,
        variant_display_name: variant.display_name,
        variant_price: variant.price,
        variant_image_url: variant.image_url,
        variant_metadata: variant.metadata
      },
      display_image: variant.image_url,
      display_images: [variant.image_url]
    };
    
    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        item: cartItem
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Variant not found'
    });
  }
});

// Serve test HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Variant API Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .variant { border: 1px solid #ccc; margin: 10px; padding: 10px; cursor: pointer; }
        .variant:hover { background-color: #f5f5f5; }
        .variant.selected { background-color: #e6f7ff; border-color: #1890ff; }
        .variant-image { width: 100px; height: 100px; object-fit: cover; margin-right: 10px; }
        .variant-info { display: flex; align-items: center; }
        .variant-details { flex: 1; }
        .price { font-weight: bold; color: #1890ff; }
        .compare-price { text-decoration: line-through; color: #999; }
        .stock { color: #52c41a; }
        .add-to-cart { margin-top: 20px; padding: 10px 20px; background: #1890ff; color: white; border: none; cursor: pointer; }
        .add-to-cart:hover { background: #40a9ff; }
        .add-to-cart:disabled { background: #ccc; cursor: not-allowed; }
        .result { margin-top: 20px; padding: 10px; background: #f6ffed; border: 1px solid #b7eb8f; }
        .error { background: #fff2f0; border-color: #ffccc7; }
      </style>
    </head>
    <body>
      <h1>Product Variant Selection Test</h1>
      <div id="variants-container">
        <h2>Select a Variant:</h2>
        <div id="variants-list"></div>
        <button id="add-to-cart" class="add-to-cart" disabled>Add Selected Variant to Cart</button>
        <div id="result"></div>
      </div>

      <script>
        let selectedVariant = null;
        const productId = 1;

        // Load variants
        fetch('/api/products/' + productId + '/variants')
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              displayVariants(data.data.variants);
            } else {
              showError('Failed to load variants');
            }
          })
          .catch(error => showError('Error loading variants: ' + error.message));

        function displayVariants(variants) {
          const container = document.getElementById('variants-list');
          container.innerHTML = '';

          variants.forEach(variant => {
            const variantDiv = document.createElement('div');
            variantDiv.className = 'variant';
            variantDiv.onclick = function() { selectVariant(variant, variantDiv); };
            
            variantDiv.innerHTML = 
              '<div class="variant-info">' +
                '<img src="' + (variant.image_url || 'https://via.placeholder.com/100') + '" alt="' + variant.display_name + '" class="variant-image">' +
                '<div class="variant-details">' +
                  '<h3>' + variant.display_name + '</h3>' +
                  (variant.description ? '<p>' + variant.description + '</p>' : '') +
                  '<div class="price">$' + variant.price.toFixed(2) + '</div>' +
                  (variant.compare_at_price ? '<span class="compare-price">$' + variant.compare_at_price.toFixed(2) + '</span>' : '') +
                  '<div class="stock">Stock: ' + variant.stock_quantity + ' (' + variant.stock_status + ')</div>' +
                  (variant.sku ? '<div>SKU: ' + variant.sku + '</div>' : '') +
                '</div>' +
              '</div>';
            
            container.appendChild(variantDiv);
          });
        }

        function selectVariant(variant, element) {
          // Remove previous selection
          document.querySelectorAll('.variant').forEach(function(el) { el.classList.remove('selected'); });
          
          // Add selection to clicked variant
          element.classList.add('selected');
          selectedVariant = variant;
          
          // Enable add to cart button
          document.getElementById('add-to-cart').disabled = false;
          
          // Show variant details
          console.log('Selected variant:', variant);
        }

        document.getElementById('add-to-cart').onclick = function() {
          if (!selectedVariant) return;

          this.disabled = true;
          this.textContent = 'Adding to cart...';

          fetch('/api/cart/items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: productId,
              selected_variant_id: selectedVariant.id,
              variant_type: selectedVariant.type,
              quantity: 1
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              showResult('Successfully added ' + selectedVariant.display_name + ' to cart!');
            } else {
              showError('Failed to add to cart: ' + data.message);
            }
          })
          .catch(error => showError('Error adding to cart: ' + error.message))
          .finally(() => {
            this.disabled = false;
            this.textContent = 'Add Selected Variant to Cart';
          });
        };

        function showResult(message) {
          const resultDiv = document.getElementById('result');
          resultDiv.className = 'result';
          resultDiv.textContent = message;
        }

        function showError(message) {
          const resultDiv = document.getElementById('result');
          resultDiv.className = 'result error';
          resultDiv.textContent = message;
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Variant API test server running at http://localhost:${port}`);
  console.log('Test endpoints:');
  console.log(`  GET /api/products/1/variants - Get all variants`);
  console.log(`  GET /api/products/1/variants/caliber_78 - Get specific variant`);
  console.log(`  POST /api/cart/items - Add variant to cart`);
  console.log(`  GET / - Interactive test page`);
});
