/**
 * Setup Prescription Lens Types
 * 
 * This script ensures that the required prescription lens types exist in the database.
 * Run this script if you see the error: "Please add prescription lens types in admin panel"
 * 
 * Usage:
 *   node scripts/setup-prescription-lens-types.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPrescriptionLensTypes() {
  console.log('🔧 Setting up prescription lens types...\n');

  try {
    // Check if types already exist
    const existingTypes = await prisma.prescriptionLensType.findMany();
    
    if (existingTypes.length > 0) {
      console.log(`✅ Found ${existingTypes.length} existing prescription lens type(s):`);
      existingTypes.forEach(type => {
        console.log(`   - ${type.name} (${type.prescription_type})`);
      });
      
      // Check if progressive exists
      const hasProgressive = existingTypes.some(t => t.prescription_type === 'progressive');
      if (!hasProgressive) {
        console.log('\n⚠️  WARNING: No progressive type found. Creating Progressive type...');
      } else {
        console.log('\n✅ All required types exist. No changes needed.');
        return;
      }
    }

    // Required types to create
    const requiredTypes = [
      {
        name: 'Distance Vision',
        slug: 'distance-vision',
        description: 'For distance (Thin, anti-glare, blue-cut options)',
        prescription_type: 'single_vision',
        base_price: 60.00,
        is_active: true,
        sort_order: 1
      },
      {
        name: 'Near Vision',
        slug: 'near-vision',
        description: 'For near/reading (Thin, anti-glare, blue-cut options)',
        prescription_type: 'single_vision',
        base_price: 60.00,
        is_active: true,
        sort_order: 2
      },
      {
        name: 'Progressive',
        slug: 'progressive',
        description: 'Progressives (For two powers in same lenses)',
        prescription_type: 'progressive',
        base_price: 60.00,
        is_active: true,
        sort_order: 3
      }
    ];

    const createdTypes = [];

    for (const typeData of requiredTypes) {
      // Check if type already exists
      const existing = await prisma.prescriptionLensType.findUnique({
        where: { slug: typeData.slug }
      });

      if (existing) {
        console.log(`⏭️  Skipping "${typeData.name}" - already exists`);
        createdTypes.push(existing);
      } else {
        const created = await prisma.prescriptionLensType.create({
          data: typeData
        });
        console.log(`✅ Created "${created.name}" (${created.prescription_type})`);
        createdTypes.push(created);
      }
    }

    // Create progressive variants if progressive type was created or exists
    const progressiveType = createdTypes.find(t => t.prescription_type === 'progressive') ||
                           await prisma.prescriptionLensType.findFirst({
                             where: { prescription_type: 'progressive' }
                           });

    if (progressiveType) {
      const existingVariants = await prisma.prescriptionLensVariant.findMany({
        where: { prescription_lens_type_id: progressiveType.id }
      });

      if (existingVariants.length === 0) {
        console.log('\n📦 Creating progressive variants...');
        
        const variants = [
          {
            prescription_lens_type_id: progressiveType.id,
            name: 'Premium Progressive',
            slug: 'premium-progressive',
            description: 'High-quality progressive lenses with advanced technology',
            price: 150.00,
            is_recommended: true,
            viewing_range: 'Wide',
            use_cases: 'Maximum comfort & balanced vision',
            is_active: true,
            sort_order: 1
          },
          {
            prescription_lens_type_id: progressiveType.id,
            name: 'Standard Progressive',
            slug: 'standard-progressive',
            description: 'Standard progressive lenses for everyday use',
            price: 100.00,
            is_recommended: false,
            viewing_range: 'Standard',
            use_cases: 'Perfect for everyday tasks',
            is_active: true,
            sort_order: 2
          },
          {
            prescription_lens_type_id: progressiveType.id,
            name: 'Basic Progressive',
            slug: 'basic-progressive',
            description: 'Affordable progressive lens option',
            price: 75.00,
            is_recommended: false,
            viewing_range: 'Basic',
            use_cases: 'Budget-friendly option',
            is_active: true,
            sort_order: 3
          }
        ];

        for (const variantData of variants) {
          const existing = await prisma.prescriptionLensVariant.findFirst({
            where: {
              prescription_lens_type_id: variantData.prescription_lens_type_id,
              slug: variantData.slug
            }
          });

          if (!existing) {
            await prisma.prescriptionLensVariant.create({ data: variantData });
            console.log(`   ✅ Created variant: "${variantData.name}"`);
          } else {
            console.log(`   ⏭️  Skipping variant: "${variantData.name}" - already exists`);
          }
        }
      } else {
        console.log(`\n✅ Progressive type already has ${existingVariants.length} variant(s)`);
      }
    }

    console.log('\n✅ Setup complete!');
    console.log('\n📋 Summary:');
    const allTypes = await prisma.prescriptionLensType.findMany({
      where: { is_active: true },
      include: {
        variants: {
          where: { is_active: true }
        }
      }
    });

    allTypes.forEach(type => {
      console.log(`\n   ${type.name} (${type.prescription_type}):`);
      console.log(`   - Base Price: $${type.base_price}`);
      if (type.variants.length > 0) {
        console.log(`   - Variants: ${type.variants.length}`);
        type.variants.forEach(v => {
          console.log(`     • ${v.name} - $${v.price}${v.is_recommended ? ' (Recommended)' : ''}`);
        });
      }
    });

  } catch (error) {
    console.error('❌ Error setting up prescription lens types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupPrescriptionLensTypes()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });

