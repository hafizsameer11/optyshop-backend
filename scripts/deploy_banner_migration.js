#!/usr/bin/env node
/**
 * Deploy banner migration to production
 * This script safely applies the banner migration and regenerates Prisma Client
 * 
 * Usage: node scripts/deploy_banner_migration.js
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deployBannerMigration() {
  try {
    console.log('🚀 Deploying banner migration to production...\n');

    // Step 1: Check if migration is needed
    console.log('📊 Checking current database state...');
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND COLUMN_NAME IN ('page_type', 'category_id', 'sub_category_id')
    `;

    const existingColumns = columns.map(c => 
      c.COLUMN_NAME?.toLowerCase() || c.column_name?.toLowerCase() || ''
    );

    const hasPageType = existingColumns.includes('page_type');
    const hasCategoryId = existingColumns.includes('category_id');
    const hasSubCategoryId = existingColumns.includes('sub_category_id');

    if (hasPageType && hasCategoryId && hasSubCategoryId) {
      console.log('✅ All banner columns already exist!');
      console.log('🔄 Regenerating Prisma Client to ensure sync...');
      
      try {
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('✅ Prisma Client regenerated successfully!');
      } catch (error) {
        console.error('⚠️  Error regenerating Prisma Client:', error.message);
        throw error;
      }

      await prisma.$disconnect();
      console.log('\n✅ Migration deployment complete - no changes needed!');
      console.log('💡 Make sure to restart your application to load the updated Prisma Client.');
      return;
    }

    // Step 2: Apply migration using Prisma
    console.log('\n📦 Applying pending migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations applied successfully!');
    } catch (error) {
      console.log('⚠️  Prisma migrate deploy had issues, trying direct fix script...');
      // Fallback to direct fix script
      require('./fix_banner_production.js');
      return;
    }

    // Step 3: Regenerate Prisma Client
    console.log('\n🔄 Regenerating Prisma Client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma Client regenerated successfully!');
    } catch (error) {
      console.error('❌ Error regenerating Prisma Client:', error.message);
      throw error;
    }

    // Step 4: Verify
    console.log('\n🔍 Verifying migration...');
    const verifyColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND COLUMN_NAME IN ('page_type', 'category_id', 'sub_category_id')
    `;

    const verifyExisting = verifyColumns.map(c => 
      c.COLUMN_NAME?.toLowerCase() || c.column_name?.toLowerCase() || ''
    );

    if (verifyExisting.includes('page_type') && 
        verifyExisting.includes('category_id') && 
        verifyExisting.includes('sub_category_id')) {
      console.log('✅ Migration verified successfully!');
    } else {
      console.error('❌ Verification failed - some columns are still missing');
      throw new Error('Migration verification failed');
    }

    await prisma.$disconnect();
    
    console.log('\n🎉 Banner migration deployed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart your application:');
    console.log('      - pm2 restart all');
    console.log('      - docker-compose restart');
    console.log('      - docker restart <container-name>');
    console.log('   2. Test the banners endpoint');
    console.log('   3. Verify the admin panel works correctly');

  } catch (error) {
    console.error('\n❌ Error deploying migration:', error.message);
    console.error('\nStack:', error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

deployBannerMigration();
