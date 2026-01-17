#!/usr/bin/env node
/**
 * Fix banner columns - adds missing columns if they don't exist
 * This script can be run manually or on container startup
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBannerColumns() {
  try {
    console.log('🔧 Checking banner table columns...');

    // Check if page_type column exists by trying to query it
    const checkColumn = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND COLUMN_NAME = 'page_type'
    `;

    if (checkColumn.length === 0) {
      console.log('⚠️  Missing columns detected. Adding them...');

      // Check each column individually and add if missing
      const columns = await prisma.$queryRaw`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'banners'
      `;
      const existingColumns = columns.map(c => c.COLUMN_NAME);

      if (!existingColumns.includes('page_type')) {
        await prisma.$executeRaw`
          ALTER TABLE banners 
          ADD COLUMN page_type ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home'
        `;
        console.log('✅ Added page_type column');
      } else {
        console.log('✅ page_type column already exists');
      }

      if (!existingColumns.includes('category_id')) {
        await prisma.$executeRaw`
          ALTER TABLE banners 
          ADD COLUMN category_id INTEGER NULL
        `;
        console.log('✅ Added category_id column');
      } else {
        console.log('✅ category_id column already exists');
      }

      if (!existingColumns.includes('sub_category_id')) {
        await prisma.$executeRaw`
          ALTER TABLE banners 
          ADD COLUMN sub_category_id INTEGER NULL
        `;
        console.log('✅ Added sub_category_id column');
      } else {
        console.log('✅ sub_category_id column already exists');
      }

      // Add indexes (MySQL doesn't support IF NOT EXISTS, so catch errors)
      const indexes = ['banners_page_type_idx', 'banners_category_id_idx', 'banners_sub_category_id_idx'];
      for (const indexName of indexes) {
        try {
          const column = indexName.replace('banners_', '').replace('_idx', '');
          await prisma.$executeRawUnsafe(`CREATE INDEX ${indexName} ON banners(${column})`);
          console.log(`✅ Added index ${indexName}`);
        } catch (e) {
          if (e.message.includes('Duplicate key name')) {
            console.log(`✅ Index ${indexName} already exists`);
          } else {
            console.log(`⚠️  Could not create index ${indexName}: ${e.message}`);
          }
        }
      }

      console.log('✅ Banner columns fixed successfully!');
    } else {
      console.log('✅ All banner columns exist');
    }
  } catch (error) {
    console.error('❌ Error fixing banner columns:', error.message);
    // Don't throw - allow server to start even if this fails
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixBannerColumns()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { fixBannerColumns };
