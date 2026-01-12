const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyBannerMigration() {
  try {
    console.log('🔄 Applying banner migration...');

    // Check if columns already exist
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND COLUMN_NAME IN ('page_type', 'category_id', 'sub_category_id')
    `;

    if (columns.length === 3) {
      console.log('✅ Banner columns already exist');
    } else {
      // Apply the migration
      console.log('📝 Adding page_type column...');
      await prisma.$executeRaw`
        ALTER TABLE \`banners\` 
        ADD COLUMN \`page_type\` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home'
      `;

      console.log('📝 Adding category_id column...');
      await prisma.$executeRaw`
        ALTER TABLE \`banners\` 
        ADD COLUMN \`category_id\` INTEGER NULL
      `;

      console.log('📝 Adding sub_category_id column...');
      await prisma.$executeRaw`
        ALTER TABLE \`banners\` 
        ADD COLUMN \`sub_category_id\` INTEGER NULL
      `;

      console.log('📝 Creating indexes...');
      await prisma.$executeRaw`CREATE INDEX \`banners_page_type_idx\` ON \`banners\`(\`page_type\`)`;
      await prisma.$executeRaw`CREATE INDEX \`banners_category_id_idx\` ON \`banners\`(\`category_id\`)`;
      await prisma.$executeRaw`CREATE INDEX \`banners_sub_category_id_idx\` ON \`banners\`(\`sub_category_id\`)`;
      await prisma.$executeRaw`CREATE INDEX \`banners_page_type_category_id_sub_category_id_idx\` ON \`banners\`(\`page_type\`, \`category_id\`, \`sub_category_id\`)`;

      console.log('📝 Adding foreign keys...');
      try {
        await prisma.$executeRaw`
          ALTER TABLE \`banners\` 
          ADD CONSTRAINT \`banners_category_id_fkey\` 
          FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `;
      } catch (e) {
        if (!e.message.includes('Duplicate key name')) {
          throw e;
        }
        console.log('⚠️  Foreign key banners_category_id_fkey already exists');
      }

      try {
        await prisma.$executeRaw`
          ALTER TABLE \`banners\` 
          ADD CONSTRAINT \`banners_sub_category_id_fkey\` 
          FOREIGN KEY (\`sub_category_id\`) REFERENCES \`subcategories\`(\`id\`) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `;
      } catch (e) {
        if (!e.message.includes('Duplicate key name')) {
          throw e;
        }
        console.log('⚠️  Foreign key banners_sub_category_id_fkey already exists');
      }

      console.log('✅ Migration applied successfully!');
    }

    // Register migration in _prisma_migrations table
    const migrationExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM \`_prisma_migrations\` 
      WHERE \`migration_name\` = '20260113015558_add_banner_page_type_and_category_associations'
    `;

    if (migrationExists[0].count === 0) {
      console.log('📝 Registering migration in _prisma_migrations...');
      await prisma.$executeRaw`
        INSERT INTO \`_prisma_migrations\` 
        (\`id\`, \`checksum\`, \`finished_at\`, \`migration_name\`, \`logs\`, \`rolled_back_at\`, \`started_at\`, \`applied_steps_count\`)
        VALUES (
          UUID(),
          'manual_migration_applied',
          NOW(),
          '20260113015558_add_banner_page_type_and_category_associations',
          NULL,
          NULL,
          NOW(),
          1
        )
      `;
      console.log('✅ Migration registered successfully!');
    } else {
      console.log('✅ Migration already registered');
    }

    console.log('\n🎉 Banner migration completed successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyBannerMigration();