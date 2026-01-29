// Test script to verify frame sizes API response format
const axios = require('axios');

async function testFrameSizesAPI() {
  try {
    console.log('🧪 Testing Frame Sizes API...');
    
    // Test the getAllFrameSizes endpoint
    const response = await axios.get('http://localhost:3000/api/admin/frame-sizes', {
      headers: {
        'Authorization': 'Bearer your-token-here' // You'll need to add actual auth
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data Structure:');
    
    if (response.data.success && response.data.data.frameSizes) {
      const frameSizes = response.data.data.frameSizes;
      
      if (frameSizes.length > 0) {
        console.log('🔍 First frame size sample:');
        const sample = frameSizes[0];
        console.log('  - ID:', sample.id);
        console.log('  - Name:', sample.name);
        console.log('  - Slug:', sample.slug);
        console.log('  - Width:', sample.width);
        console.log('  - Bridge:', sample.bridge);
        console.log('  - Temple:', sample.temple);
        console.log('  - Status:', sample.status);
        
        // Check if fields are no longer "N/A"
        const hasValidData = sample.name !== 'N/A' || 
                           sample.width !== 'N/A' || 
                           sample.bridge !== 'N/A' || 
                           sample.temple !== 'N/A';
        
        if (hasValidData) {
          console.log('✅ Frame size data is properly populated!');
        } else {
          console.log('❌ Frame size data still shows "N/A"');
        }
      } else {
        console.log('ℹ️  No frame sizes found in database');
      }
    } else {
      console.log('❌ Unexpected response structure');
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

// Run the test
testFrameSizesAPI();
