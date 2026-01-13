#!/usr/bin/env node
/**
 * Quick fix script for production banner migration issue
 * This script adds missing banner columns safely
 * 
 * Usage: node scripts/fix_banner_production.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBannerProduction() {
  try {
    console.log('🔧 Fixing banner columns in production...\n');

    // Check current state
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND COLUMN_NAME IN ('page_type', 'category_id', 'sub_category_id')
    `;

    const existingColumns = columns.map(c => c.COLUMN_NAME?.toLowerCase() || c.column_name?.toLowerCase() || '');
    console.log('📊 Current state:', existingColumns.length > 0 ? existingColumns.join(', ') : 'No columns found');

    let changesMade = false;

    // Add page_type
    if (!existingColumns.includes('page_type')) {
      console.log('➕ Adding page_type column...');
      await prisma.$executeRaw`
        ALTER TABLE \`banners\` 
        ADD COLUMN \`page_type\` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home'
      `;
      console.log('✅ Added page_type');
      changesMade = true;
    }

    // Add category_id
    if (!existingColumns.includes('category_id')) {
      console.log('➕ Adding category_id column...');
      await prisma.$executeRaw`
        ALTER TABLE \`banners\` 
        ADD COLUMN \`category_id\` INTEGER NULL
      `;
      console.log('✅ Added category_id');
      changesMade = true;
    }

    // Add sub_category_id
    if (!existingColumns.includes('sub_category_id')) {
      console.log('➕ Adding sub_category_id column...');
      await prisma.$executeRaw`
        ALTER TABLE \`banners\` 
        ADD COLUMN \`sub_category_id\` INTEGER NULL
      `;
      console.log('✅ Added sub_category_id');
      changesMade = true;
    }

    // Create indexes (ignore errors if they exist)
    console.log('\n📇 Creating indexes...');
    const indexes = [
      'banners_page_type_idx',
      'banners_category_id_idx',
      'banners_sub_category_id_idx',
      'banners_page_type_category_id_sub_category_id_idx'
    ];

    for (const indexName of indexes) {
      try {
        if (indexName === 'banners_page_type_idx') {
          await prisma.$executeRaw`CREATE INDEX \`banners_page_type_idx\` ON \`banners\`(\`page_type\`)`;
        } else if (indexName === 'banners_category_id_idx') {
          await prisma.$executeRaw`CREATE INDEX \`banners_category_id_idx\` ON \`banners\`(\`category_id\`)`;
        } else if (indexName === 'banners_sub_category_id_idx') {
          await prisma.$executeRaw`CREATE INDEX \`banners_sub_category_id_idx\` ON \`banners\`(\`sub_category_id\`)`;
        } else {
          await prisma.$executeRaw`CREATE INDEX \`banners_page_type_category_id_sub_category_id_idx\` ON \`banners\`(\`page_type\`, \`category_id\`, \`sub_category_id\`)`;
        }
        console.log(`✅ Created ${indexName}`);
        changesMade = true;
      } catch (e) {
        if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
          console.log(`⏭️  ${indexName} already exists`);
        } else {
          console.log(`⚠️  Could not create ${indexName}: ${e.message}`);
        }
      }
    }

    // Add foreign keys
    console.log('\n🔗 Checking foreign keys...');
    
    // Check for existing foreign keys on these columns
    const categoryFKs = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'banners'
      AND COLUMN_NAME = 'category_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `;
    
    const subCategoryFKs = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'banners'
      AND COLUMN_NAME = 'sub_category_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `;
    
    const hasCategoryFK = Array.isArray(categoryFKs) && categoryFKs.length > 0;
    const hasSubCategoryFK = Array.isArray(subCategoryFKs) && subCategoryFKs.length > 0;
    
    if (hasCategoryFK) {
      console.log('⏭️  Foreign key for category_id already exists');
    } else {
      try {
        await prisma.$executeRaw`
          ALTER TABLE \`banners\` 
          ADD CONSTRAINT \`banners_category_id_fkey\` 
          FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `;
        console.log('✅ Added banners_category_id_fkey');
        changesMade = true;
      } catch (e) {
        if (e.message.includes('Duplicate key') || e.message.includes('errno: 121') || e.message.includes('already exists')) {
          console.log('⏭️  Foreign key for category_id already exists (detected via error)');
        } else {
          console.log(`⚠️  Could not add banners_category_id_fkey: ${e.message}`);
        }
      }
    }
    
    if (hasSubCategoryFK) {
      console.log('⏭️  Foreign key for sub_category_id already exists');
    } else {
      try {
        await prisma.$executeRaw`
          ALTER TABLE \`banners\` 
          ADD CONSTRAINT \`banners_sub_category_id_fkey\` 
          FOREIGN KEY (\`sub_category_id\`) REFERENCES \`subcategories\`(\`id\`) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `;
        console.log('✅ Added banners_sub_category_id_fkey');
        changesMade = true;
      } catch (e) {
        if (e.message.includes('Duplicate key') || e.message.includes('errno: 121') || e.message.includes('already exists')) {
          console.log('⏭️  Foreign key for sub_category_id already exists (detected via error)');
        } else {
          console.log(`⚠️  Could not add banners_sub_category_id_fkey: ${e.message}`);
        }
      }
    }

    if (changesMade) {
      console.log('\n✅ Fix applied successfully!');
      console.log('🔄 Next steps:');
      console.log('   1. Restart your application');
      console.log('   2. Test the banners endpoint');
    } else {
      console.log('\n✅ All columns already exist - no changes needed!');
    }

  } catch (error) {
    console.error('\n❌ Error applying fix:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixBannerProduction();
