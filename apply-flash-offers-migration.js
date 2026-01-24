const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('📦 Applying flash offers and product gifts migration...');
    
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20250115000000_add_flash_offers_and_product_gifts', 'migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log('✅ Executed SQL statement');
        } catch (error) {
          // Ignore errors for tables/columns that already exist
          if (error.code === 'P2002' || error.message.includes('already exists')) {
            console.log('⚠️  Table/column already exists, skipping...');
          } else {
            console.error('❌ Error executing statement:', error.message);
            throw error;
          }
        }
      }
    }
    
    // Mark migration as applied in Prisma's migration history
    await prisma.$executeRawUnsafe(`
      INSERT INTO _prisma_migrations (migration_name, applied_steps_count)
      VALUES ('20250115000000_add_flash_offers_and_product_gifts', 1)
      ON DUPLICATE KEY UPDATE applied_steps_count = 1
    `);
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
