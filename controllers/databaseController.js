const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

// @desc    Apply database schema fixes for production
// @route   POST /api/admin/database/fix-schema
// @access  Private/Admin (or use a secret key for emergency access)
exports.fixDatabaseSchema = asyncHandler(async (req, res) => {
  console.log('🔧 Applying database schema fixes...');

  try {
    const results = [];

    // 1. Check and create brands table
    console.log('1. Checking brands table...');
    const brandsTableCheck = await prisma.$queryRaw`SHOW TABLES LIKE 'brands'`;
    
    if (brandsTableCheck.length === 0) {
      console.log('Creating brands table...');
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
      results.push('✅ Brands table created');
    } else {
      results.push('✅ Brands table already exists');
    }

    // 2. Check and add brand_id column to products
    console.log('2. Checking brand_id column...');
    const brandIdCheck = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'brand_id'
    `;
    
    if (brandIdCheck.length === 0) {
      console.log('Adding brand_id column...');
      await prisma.$executeRaw`
        ALTER TABLE \`products\` 
        ADD COLUMN \`brand_id\` int(11) DEFAULT NULL 
        AFTER \`sub_category_id\`;
      `;
      
      await prisma.$executeRaw`
        ALTER TABLE \`products\` 
        ADD INDEX \`products_brand_id_idx\` (\`brand_id\`);
      `;
      
      await prisma.$executeRaw`
        ALTER TABLE \`products\` 
        ADD CONSTRAINT \`products_brand_id_fkey\` 
        FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `;
      results.push('✅ brand_id column added to products');
    } else {
      results.push('✅ brand_id column already exists');
    }

    // 3. Check other brand-related columns
    console.log('3. Checking other brand columns...');
    const brandColumns = ['contact_lens_brand', 'contact_lens_color', 'contact_lens_material', 'contact_lens_type'];
    const existingColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME IN (${brandColumns.join(',')})
    `;
    const existingColumnNames = existingColumns.map(col => col.COLUMN_NAME);
    
    for (const column of brandColumns) {
      if (!existingColumnNames.includes(column)) {
        let columnDefinition;
        switch (column) {
          case 'contact_lens_brand':
          case 'contact_lens_color':
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
        results.push(`✅ Added ${column} column`);
      }
    }
    if (brandColumns.every(col => existingColumnNames.includes(col))) {
      results.push('✅ All brand-related columns exist');
    }

    // 4. Check product_size_volumes table
    console.log('4. Checking product_size_volumes table...');
    const sizeVolumeCheck = await prisma.$queryRaw`SHOW TABLES LIKE 'product_size_volumes'`;
    
    if (sizeVolumeCheck.length === 0) {
      console.log('Creating product_size_volumes table...');
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
      results.push('✅ product_size_volumes table created');
    } else {
      results.push('✅ product_size_volumes table already exists');
    }

    // 5. Test the schema
    console.log('5. Testing schema...');
    try {
      await prisma.product.findMany({
        take: 1,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subCategory: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true, logo_url: true } }
        }
      });
      results.push('✅ Schema test passed - brand relationships working');
    } catch (testError) {
      results.push(`❌ Schema test failed: ${testError.message}`);
    }

    console.log('🎉 Database schema fixes completed!');
    
    return success(res, 'Database schema fixes applied successfully', {
      results,
      timestamp: new Date().toISOString(),
      message: 'The brand-related database error should now be resolved. Restart your application if needed.'
    });

  } catch (error) {
    console.error('❌ Database fix failed:', error);
    return error(res, `Database fix failed: ${error.message}`, 500);
  } finally {
    await prisma.$disconnect();
  }
});

// @desc    Get database schema status
// @route   GET /api/admin/database/status
// @access  Private/Admin
exports.getDatabaseStatus = asyncHandler(async (req, res) => {
  try {
    const status = {};

    // Check brands table
    const brandsTable = await prisma.$queryRaw`SHOW TABLES LIKE 'brands'`;
    status.brandsTable = brandsTable.length > 0;

    // Check brand_id column
    const brandIdColumn = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'brand_id'
    `;
    status.brandIdColumn = brandIdColumn.length > 0;

    // Check product_size_volumes table
    const sizeVolumeTable = await prisma.$queryRaw`SHOW TABLES LIKE 'product_size_volumes'`;
    status.sizeVolumeTable = sizeVolumeTable.length > 0;

    // Test query
    try {
      await prisma.product.findMany({
        take: 1,
        include: {
          brand: { select: { id: true, name: true } }
        }
      });
      status.testQuery = true;
    } catch (error) {
      status.testQuery = false;
      status.error = error.message;
    }

    return success(res, 'Database status retrieved', status);
  } catch (error) {
    return error(res, `Failed to get database status: ${error.message}`, 500);
  }
});
