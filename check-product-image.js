const { prisma } = require('./config/database');

(async () => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: 40 },
      select: { 
        id: true, 
        name: true, 
        images: true,
        slug: true
      }
    });
    
    console.log('\n📦 Product 40 Data:');
    console.log(JSON.stringify(product, null, 2));
    
    if (product && product.images) {
      let images = product.images;
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images);
        } catch (e) {
          console.log('\n⚠️  Error parsing images JSON:', e.message);
        }
      }
      console.log('\n🖼️  Parsed Images:');
      console.log(Array.isArray(images) ? images : [images]);
    } else {
      console.log('\n⚠️  No images found for this product');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
})();

