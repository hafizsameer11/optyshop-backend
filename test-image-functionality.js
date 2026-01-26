const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testImageFunctionality() {
  try {
    console.log('Testing ProductSizeVolume image_url functionality...');
    
    // Test 1: Check if the image_url column exists in the database
    console.log('\n1. Testing database schema...');
    const sampleVariant = await prisma.productSizeVolume.findFirst();
    if (sampleVariant) {
      console.log('✅ Sample variant found:', {
        id: sampleVariant.id,
        size_volume: sampleVariant.size_volume,
        image_url: sampleVariant.image_url
      });
    } else {
      console.log('ℹ️  No existing variants found, will test creation...');
    }
    
    // Test 2: Create a test variant with image_url
    console.log('\n2. Testing variant creation with image_url...');
    const testProduct = await prisma.product.findFirst();
    if (testProduct) {
      const newVariant = await prisma.productSizeVolume.create({
        data: {
          product_id: testProduct.id,
          size_volume: 'Test Volume',
          pack_type: 'Test Pack',
          price: 10.99,
          image_url: 'https://example.com/test-image.jpg',
          is_active: true,
          sort_order: 0
        }
      });
      
      console.log('✅ Variant created with image_url:', {
        id: newVariant.id,
        size_volume: newVariant.size_volume,
        image_url: newVariant.image_url
      });
      
      // Test 3: Update the variant with a new image_url
      console.log('\n3. Testing variant update with new image_url...');
      const updatedVariant = await prisma.productSizeVolume.update({
        where: { id: newVariant.id },
        data: {
          image_url: 'https://example.com/updated-test-image.jpg'
        }
      });
      
      console.log('✅ Variant updated with new image_url:', {
        id: updatedVariant.id,
        image_url: updatedVariant.image_url
      });
      
      // Test 4: Clean up - delete the test variant
      console.log('\n4. Cleaning up test variant...');
      await prisma.productSizeVolume.delete({
        where: { id: newVariant.id }
      });
      
      console.log('✅ Test variant deleted successfully');
    } else {
      console.log('ℹ️  No products found to test with');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImageFunctionality();
