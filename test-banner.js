const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBanner() {
  try {
    const banners = await prisma.banner.findMany();
    console.log('✅ Banners table accessible, count:', banners.length);
    
    // Check if banner columns exist
    if (banners.length > 0) {
      const firstBanner = banners[0];
      console.log('✅ Banner columns:', Object.keys(firstBanner));
    }
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Banner error:', error.message);
    process.exit(1);
  }
}

testBanner();
