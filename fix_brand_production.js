// 🔥 URGENT: Fix Brand Error in Production
// This script applies the missing brand-related migrations to fix the production database

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBrandProduction() {
  console.log('🔧 Fixing brand-related database schema in production...');

  try {
    // Check if brands table exists
    console.log('1. Checking if brands table exists...');
    const brandsTableCheck = await prisma.$queryRaw`SHOW TABLES LIKE 'brands'`;
    
    if (brandsTableCheck.length === 0) {
      console.log('❌ Brands table does not exist. Creating it...');
      
      // Create brands table
      await prisma.$executeRaw`
        CREATE TABLE \`brands\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`name\` varchar(150) NOT NULL,
          \`slug\` varchar(150) NOT NULL,
          \`description\` text DEFAULT NULL,
          \`logo_url\` varchar(500) DEFAULT NULL,
          \`website_url\` varchar(500) DEFAULT NULL,
          \`sort_order\` int(11) NOT NULL DEFAULT '0',
          \`is_active\` tinyint(1) NOT NULL DEFAULT '1',
          \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updated_at\` datetime(3) NOT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`brands_slug_key\` (\`slug\`),
          KEY \`brands_slug_idx\` (\`slug\`),
          KEY \`brands_is_active_idx\` (\`is_active\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      console.log('✅ Brands table created successfully');
    } else {
      console.log('✅ Brands table already exists');
    }

    // Check if brand_id column exists in products table
    console.log('2. Checking if brand_id column exists in products table...');
    const brandIdCheck = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'brand_id'
    `;
    
    if (brandIdCheck.length === 0) {
      console.log('❌ brand_id column does not exist in products table. Adding it...');
      
      // Add brand_id column to products table
      await prisma.$executeRaw`
        ALTER TABLE \`products\` 
        ADD COLUMN \`brand_id\` int(11) DEFAULT NULL 
        AFTER \`sub_category_id\`;
      `;
      
      // Add index for brand_id
      await prisma.$executeRaw`
        ALTER TABLE \`products\` 
        ADD INDEX \`products_brand_id_idx\` (\`brand_id\`);
      `;
      
      // Add foreign key constraint
      await prisma.$executeRaw`
        ALTER TABLE \`products\` 
        ADD CONSTRAINT \`products_brand_id_fkey\` 
        FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `;
      
      console.log('✅ brand_id column added to products table successfully');
    } else {
      console.log('✅ brand_id column already exists in products table');
    }

    // Check if other missing brand-related columns exist
    console.log('3. Checking for other brand-related columns...');
    const brandColumnsCheck = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME IN ('contact_lens_brand', 'contact_lens_color', 'contact_lens_material', 'contact_lens_type')
    `;
    
    const existingColumns = brandColumnsCheck.map(col => col.COLUMN_NAME);
    const missingColumns = ['contact_lens_brand', 'contact_lens_color', 'contact_lens_material', 'contact_lens_type']
      .filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log(`❌ Missing brand-related columns: ${missingColumns.join(', ')}`);
      
      for (const column of missingColumns) {
        let columnDefinition;
        switch (column) {
          case 'contact_lens_brand':
            columnDefinition = 'varchar(100) DEFAULT NULL';
            break;
          case 'contact_lens_color':
            columnDefinition = 'varchar(100) DEFAULT NULL';
            break;
          case 'contact_lens_material':
            columnDefinition = 'varchar(100) DEFAULT NULL';
            break;
          case 'contact_lens_type':
            columnDefinition = 'varchar(50) DEFAULT NULL';
            break;
        }
        
        await prisma.$executeRaw`
          ALTER TABLE \`products\` 
          ADD COLUMN \`${prisma.$escapeString(column)}\` ${columnDefinition};
        `;
        console.log(`✅ Added ${column} column`);
      }
    } else {
      console.log('✅ All brand-related columns exist');
    }

    // Check if product_size_volumes table exists (for eye hygiene products)
    console.log('4. Checking if product_size_volumes table exists...');
    const sizeVolumeTableCheck = await prisma.$queryRaw`SHOW TABLES LIKE 'product_size_volumes'`;
    
    if (sizeVolumeTableCheck.length === 0) {
      console.log('❌ product_size_volumes table does not exist. Creating it...');
      
      // Create product_size_volumes table
      await prisma.$executeRaw`
        CREATE TABLE \`product_size_volumes\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`product_id\` int(11) NOT NULL,
          \`size_volume\` varchar(50) NOT NULL,
          \`pack_type\` varchar(50) DEFAULT NULL,
          \`price\` decimal(10,2) NOT NULL,
          \`compare_at_price\` decimal(10,2) DEFAULT NULL,
          \`cost_price\` decimal(10,2) DEFAULT NULL,
          \`stock_quantity\` int(11) NOT NULL DEFAULT '0',
          \`stock_status\` enum('in_stock','out_of_stock','on_backorder') NOT NULL DEFAULT 'in_stock',
          \`sku\` varchar(100) DEFAULT NULL,
          \`expiry_date\` datetime(3) DEFAULT NULL,
          \`is_active\` tinyint(1) NOT NULL DEFAULT '1',
          \`sort_order\` int(11) NOT NULL DEFAULT '0',
          \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updated_at\` datetime(3) NOT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`product_size_volumes_product_id_size_volume_pack_type_key\` (\`product_id\`,\`size_volume\`,\`pack_type\`),
          KEY \`product_size_volumes_product_id_idx\` (\`product_id\`),
          KEY \`product_size_volumes_is_active_idx\` (\`is_active\`),
          CONSTRAINT \`product_size_volumes_product_id_fkey\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      console.log('✅ product_size_volumes table created successfully');
    } else {
      console.log('✅ product_size_volumes table already exists');
    }

    // Test the fixed schema
    console.log('5. Testing the fixed schema...');
    try {
      const testQuery = await prisma.product.findMany({
        take: 1,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subCategory: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true, logo_url: true } },
          sizeVolumeVariants: {
            where: { is_active: true },
            orderBy: [{ sort_order: 'asc' }, { size_volume: 'asc' }, { pack_type: 'asc' }]
          }
        }
      });
      console.log('✅ Schema test passed! The brand-related error should be fixed.');
    } catch (testError) {
      console.log('❌ Schema test failed:', testError.message);
      
      // If sizeVolumeVariants still fails, try without it
      if (testError.message?.includes('sizeVolumeVariants') || testError.message?.includes('product_size_volumes')) {
        console.log('⚠️  Trying without sizeVolumeVariants...');
        const testQuery2 = await prisma.product.findMany({
          take: 1,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            subCategory: { select: { id: true, name: true, slug: true } },
            brand: { select: { id: true, name: true, slug: true, logo_url: true } }
          }
        });
        console.log('✅ Basic brand query works! sizeVolumeVariants might need separate handling.');
      }
    }

    console.log('\n🎉 Brand-related database fix completed successfully!');
    console.log('🔄 Please restart your application now:');
    console.log('   pm2 restart all');
    console.log('   OR docker-compose restart');
    console.log('   OR docker restart your-container-name');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Full error:', error);
    
    // Provide manual SQL fallback
    console.log('\n🔧 Manual SQL fallback:');
    console.log(`
-- Connect to your MySQL database and run:

-- 1. Create brands table if it doesn't exist
CREATE TABLE IF NOT EXISTS \`brands\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(150) NOT NULL,
  \`slug\` varchar(150) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`logo_url\` varchar(500) DEFAULT NULL,
  \`website_url\` varchar(500) DEFAULT NULL,
  \`sort_order\` int(11) NOT NULL DEFAULT '0',
  \`is_active\` tinyint(1) NOT NULL DEFAULT '1',
  \`created_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updated_at\` datetime(3) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`brands_slug_key\` (\`slug\`),
  KEY \`brands_slug_idx\` (\`slug\`),
  KEY \`brands_is_active_idx\` (\`is_active\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add brand_id to products table if it doesn't exist
ALTER TABLE \`products\` 
ADD COLUMN IF NOT EXISTS \`brand_id\` int(11) DEFAULT NULL;

-- 3. Add index if it doesn't exist
ALTER TABLE \`products\` 
ADD INDEX IF NOT EXISTS \`products_brand_id_idx\` (\`brand_id\`);

-- 4. Add foreign key if it doesn't exist
ALTER TABLE \`products\` 
ADD CONSTRAINT IF NOT EXISTS \`products_brand_id_fkey\` 
FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) 
ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixBrandProduction();
