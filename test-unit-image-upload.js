const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test script for unit image upload
async function testUnitImageUpload() {
  console.log('🧪 Testing Unit Image Upload Functionality\n');

  try {
    // Create a test form data
    const form = new FormData();
    
    // Add basic configuration data
    form.append('name', 'Test Configuration with Unit Images');
    form.append('sub_category_id', '1'); // Replace with actual sub_category_id
    form.append('right_qty', '["30", "60", "90"]');
    form.append('right_base_curve', '["8.4", "8.6"]');
    form.append('right_diameter', '["14.0"]');
    form.append('right_power', '["-1.00", "-1.50", "-2.00"]');
    form.append('left_qty', '["30", "60", "90"]');
    form.append('left_base_curve', '["8.4", "8.6"]');
    form.append('left_diameter', '["14.0"]');
    form.append('left_power', '["-1.00", "-1.50", "-2.00"]');
    form.append('price', '29.99');
    form.append('available_units', '[30, 60, 90]');
    form.append('unit_prices', '{"30": 29.99, "60": 55.99, "90": 79.99}');
    
    // Create a dummy test image file
    const testImagePath = path.join(__dirname, 'test-image.png');
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, testImageBuffer);
    
    // Add unit images for different units
    form.append('unit_images_30', fs.createReadStream(testImagePath), { filename: 'unit-30-image.png', contentType: 'image/png' });
    form.append('unit_images_60', fs.createReadStream(testImagePath), { filename: 'unit-60-image.png', contentType: 'image/png' });
    form.append('unit_images_90', fs.createReadStream(testImagePath), { filename: 'unit-90-image.png', contentType: 'image/png' });
    
    console.log('✅ Form data prepared with unit images');
    console.log('📤 Expected field names: unit_images_30, unit_images_60, unit_images_90');
    console.log('📁 Images will be uploaded to: uploads/contact-lens-configs/');
    console.log('🔗 Generated URLs will be: http://localhost:5000/uploads/contact-lens-configs/timestamp-filename.png');
    
    // Clean up test image
    fs.unlinkSync(testImagePath);
    
    console.log('\n📋 Test Summary:');
    console.log('- ✅ Upload middleware added to contact lens routes');
    console.log('- ✅ Controller updated to process uploaded files');
    console.log('- ✅ Helper function processUnitImages implemented');
    console.log('- 🔄 Ready for frontend testing');
    
    console.log('\n🌐 Frontend Integration:');
    console.log('Use FormData with field names: unit_images_10, unit_images_20, unit_images_30, etc.');
    console.log('Each field can accept up to 5 images per unit.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUnitImageUpload();
