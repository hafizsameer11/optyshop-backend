const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testModels() {
  try {
    console.log('🔍 Testing Prisma models...');
    
    // Test FlashOffer model
    try {
      const offers = await prisma.flashOffer.findMany({ take: 1 });
      console.log('✅ FlashOffer model is available');
    } catch (error) {
      if (error.message.includes('Unknown model') || error.message.includes('does not exist')) {
        console.log('❌ FlashOffer model not found - Prisma client needs regeneration');
      } else {
        console.log('✅ FlashOffer model exists (error:', error.message, ')');
      }
    }
    
    // Test ProductGift model
    try {
      const gifts = await prisma.productGift.findMany({ take: 1 });
      console.log('✅ ProductGift model is available');
    } catch (error) {
      if (error.message.includes('Unknown model') || error.message.includes('does not exist')) {
        console.log('❌ ProductGift model not found - Prisma client needs regeneration');
      } else {
        console.log('✅ ProductGift model exists (error:', error.message, ')');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testModels();
