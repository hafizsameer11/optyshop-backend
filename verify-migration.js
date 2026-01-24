const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('🔍 Verifying migration...');
    
    // Check if flash_offers table exists
    const flashOffers = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'flash_offers'
    `;
    console.log('Flash offers table:', flashOffers[0].count > 0 ? '✅ Exists' : '❌ Missing');
    
    // Check if product_gifts table exists
    const productGifts = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'product_gifts'
    `;
    console.log('Product gifts table:', productGifts[0].count > 0 ? '✅ Exists' : '❌ Missing');
    
    // Try to query the tables
    try {
      const offers = await prisma.$queryRaw`SELECT COUNT(*) as count FROM flash_offers`;
      console.log('✅ Flash offers table is accessible');
    } catch (e) {
      console.log('❌ Flash offers table error:', e.message);
    }
    
    try {
      const gifts = await prisma.$queryRaw`SELECT COUNT(*) as count FROM product_gifts`;
      console.log('✅ Product gifts table is accessible');
    } catch (e) {
      console.log('❌ Product gifts table error:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
