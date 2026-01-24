const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../middleware/asyncHandler');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

// @desc    Emergency database fix - no auth required (use secret key)
// @route   POST /api/emergency/fix-database
// @access  Public (with secret key protection)
exports.emergencyFixDatabase = asyncHandler(async (req, res) => {
  const { secret_key } = req.body;
  
  // Simple secret key protection - replace with your own secret
  const EMERGENCY_SECRET = process.env.EMERGENCY_FIX_SECRET || 'optyshop_emergency_fix_2024';
  
  if (secret_key !== EMERGENCY_SECRET) {
    return error(res, 'Invalid secret key', 401);
  }

  console.log('🚨 EMERGENCY: Applying database schema fixes...');

  try {
    const results = [];

    // 1. Create brands table
    const brandsTableCheck = await prisma.$queryRaw`SHOW TABLES LIKE 'brands'`;
    if (brandsTableCheck.length === 0) {
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
      results.push('✅ Brands table exists');
    }

    // 2. Add brand_id column
    const brandIdCheck = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'brand_id'
    `;
    
    if (brandIdCheck.length === 0) {
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
      results.push('✅ brand_id column added');
    } else {
      results.push('✅ brand_id column exists');
    }

    // 3. Add other brand columns
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
        const columnDefinition = column === 'contact_lens_type' ? 'varchar(50) DEFAULT NULL' : 'varchar(100) DEFAULT NULL';
        await prisma.$executeRaw`
          ALTER TABLE \`products\` 
          ADD COLUMN \`${prisma.$escapeString(column)}\` ${columnDefinition};
        `;
        results.push(`✅ Added ${column} column`);
      }
    }

    // 4. Create product_size_volumes table
    const sizeVolumeCheck = await prisma.$queryRaw`SHOW TABLES LIKE 'product_size_volumes'`;
    if (sizeVolumeCheck.length === 0) {
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
      results.push('✅ product_size_volumes table exists');
    }

    // 5. Test the schema
    try {
      await prisma.product.findMany({
        take: 1,
        include: {
          brand: { select: { id: true, name: true } }
        }
      });
      results.push('✅ Schema test passed');
    } catch (testError) {
      results.push(`❌ Schema test failed: ${testError.message}`);
    }

    console.log('🎉 EMERGENCY FIX COMPLETED!');
    
    return success(res, 'Emergency database fix completed', {
      results,
      message: 'Brand-related database error should be resolved. Restart application if needed.',
      next_steps: [
        '1. Restart your application: pm2 restart all',
        '2. Test the admin products endpoint',
        '3. Verify frontend is working'
      ]
    });

  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    return error(res, `Emergency fix failed: ${error.message}`, 500);
  } finally {
    await prisma.$disconnect();
  }
});
