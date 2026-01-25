const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');

  try {
    // Test 1: Get products (should work)
    console.log('1. Testing GET /products...');
    const productsRes = await axios.get(`${API_BASE}/products`);
    console.log('✅ Products endpoint works:', productsRes.data.products?.length || 0, 'products found\n');

    // Test 2: Get categories (should work)
    console.log('2. Testing GET /categories...');
    const categoriesRes = await axios.get(`${API_BASE}/categories`);
    console.log('✅ Categories endpoint works:', categoriesRes.data.categories?.length || 0, 'categories found\n');

    // Test 3: Try to get product with calibers (will need a real product ID)
    console.log('3. Testing GET /products/:id/calibers...');
    if (productsRes.data.products && productsRes.data.products.length > 0) {
      const firstProduct = productsRes.data.products[0];
      try {
        const productWithCalibers = await axios.get(`${API_BASE}/products/${firstProduct.id}/calibers`);
        console.log('✅ Product with calibers endpoint works');
        console.log('   MM Calibers:', productWithCalibers.data.data.mm_calibers || []);
        console.log('   Eye Hygiene Variants:', productWithCalibers.data.data.eyeHygieneVariants || []);
      } catch (err) {
        console.log('❌ Product calibers endpoint failed:', err.response?.data?.message || err.message);
      }
    } else {
      console.log('⚠️  No products found to test calibers endpoint');
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testAPI();
