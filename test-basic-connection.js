const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBasicConnection() {
  try {
    console.log('Testing basic database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if we can query the product_size_volumes table structure
    console.log('\nTesting product_size_volumes table...');
    const tableInfo = await prisma.$queryRaw`DESCRIBE product_size_volumes`;
    console.log('✅ Table structure:', tableInfo);
    
    // Check if image_url column exists
    const hasImageUrl = tableInfo.some(column => column.Field === 'image_url');
    if (hasImageUrl) {
      console.log('✅ image_url column exists in product_size_volumes table');
    } else {
      console.log('❌ image_url column not found in product_size_volumes table');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBasicConnection();
