#!/usr/bin/env node
/**
 * Verification script to check if banner columns are properly set up
 * 
 * Usage: node scripts/verify_banner_fix.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyBannerFix() {
  try {
    console.log('🔍 Verifying banner columns setup...\n');

    // Check database columns
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND COLUMN_NAME IN ('page_type', 'category_id', 'sub_category_id')
      ORDER BY COLUMN_NAME
    `;

    console.log('📊 Database Columns:');
    if (columns.length === 0) {
      console.log('❌ No banner columns found!');
      return false;
    }

    columns.forEach(col => {
      const name = col.COLUMN_NAME || col.column_name;
      const type = col.DATA_TYPE || col.data_type;
      const nullable = col.IS_NULLABLE || col.is_nullable;
      const defaultValue = col.COLUMN_DEFAULT || col.column_default;
      console.log(`  ✅ ${name}: ${type} (nullable: ${nullable}, default: ${defaultValue || 'none'})`);
    });

    // Test Prisma query
    console.log('\n🧪 Testing Prisma query...');
    try {
      const testQuery = await prisma.banner.findMany({
        take: 1,
        select: {
          id: true,
          page_type: true,
          category_id: true,
          sub_category_id: true,
        }
      });
      console.log('✅ Prisma Client can query banner columns successfully!');
      if (testQuery.length > 0) {
        console.log(`   Sample banner:`, testQuery[0]);
      }
      return true;
    } catch (error) {
      console.log('❌ Prisma Client query failed:');
      console.log(`   Error: ${error.message}`);
      if (error.message.includes('does not exist')) {
        console.log('\n💡 Solution: Run "npx prisma generate" to regenerate Prisma Client');
      }
      return false;
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

verifyBannerFix().then(success => {
  if (success) {
    console.log('\n✅ All checks passed! Banner setup is correct.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some issues detected. Please check the output above.');
    process.exit(1);
  }
});
