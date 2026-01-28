const axios = require('axios');

// Test script for caliber API functionality
const BASE_URL = 'http://localhost:3000/api';

async function testCaliberAPI() {
  console.log('Testing Product Caliber API...\n');

  try {
    // Test 1: Get product with calibers
    console.log('1. Testing GET /api/products/:id (with calibers)');
    const productResponse = await axios.get(`${BASE_URL}/products/1`);
    console.log('✅ Product with calibers:', JSON.stringify(productResponse.data.data.mm_calibers, null, 2));

    // Test 2: Get just the calibers for a product
    console.log('\n2. Testing GET /api/products/:id/calibers');
    const calibersResponse = await axios.get(`${BASE_URL}/products/1/calibers`);
    console.log('✅ Product calibers:', JSON.stringify(calibersResponse.data.data, null, 2));

    // Test 3: Add to cart with caliber selection
    console.log('\n3. Testing POST /api/cart/items (with caliber selection)');
    const cartPayload = {
      product_id: 1,
      quantity: 1,
      selected_mm_caliber: "78"
    };
    
    // Note: This requires authentication, so it will fail without auth token
    // But the structure shows how to send caliber selection
    console.log('📝 Cart payload with caliber:', JSON.stringify(cartPayload, null, 2));
    console.log('ℹ️  Note: Cart endpoint requires authentication token');

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

// Frontend integration example
console.log('Frontend Integration Example:\n');
console.log(`
// 1. Fetch product calibers
const response = await fetch('/api/products/1/calibers');
const { calibers } = await response.json();

// 2. Display caliber selector
calibers.forEach(caliber => {
  const caliberOption = document.createElement('div');
  caliberOption.innerHTML = \`
    <img src="\${caliber.image_url}" alt="\${caliber.mm}mm" />
    <span>\${caliber.mm}mm</span>
  \`;
  caliberOption.onclick = () => addToCartWithCaliber(caliber.mm);
  document.querySelector('.caliber-selector').appendChild(caliberOption);
});

// 3. Add to cart with selected caliber
async function addToCartWithCaliber(mm) {
  const response = await fetch('/api/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      product_id: 1,
      quantity: 1,
      selected_mm_caliber: mm
    })
  });
  
  const result = await response.json();
  console.log('Added to cart:', result);
}
`);

if (require.main === module) {
  testCaliberAPI();
}

module.exports = { testCaliberAPI };
