const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBannerMigration() {
  try {
    console.log('🔧 Fixing banner migration...\n');

    // Check current columns
    const existingColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND COLUMN_NAME IN ('page_type', 'category_id', 'sub_category_id')
    `;

    const existingNames = existingColumns.map(c => c.COLUMN_NAME);
    console.log('Existing columns:', existingNames.length > 0 ? existingNames.join(', ') : 'none');

    // Add page_type if missing
    if (!existingNames.includes('page_type')) {
      console.log('➕ Adding page_type column...');
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE \`banners\` 
          ADD COLUMN \`page_type\` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home'
        `);
        console.log('✅ page_type column added');
      } catch (error) {
        console.error('❌ Error adding page_type:', error.message);
        throw error;
      }
    } else {
      console.log('✅ page_type column already exists');
    }

    // Add category_id if missing
    if (!existingNames.includes('category_id')) {
      console.log('➕ Adding category_id column...');
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE \`banners\` 
          ADD COLUMN \`category_id\` INTEGER NULL
        `);
        console.log('✅ category_id column added');
      } catch (error) {
        console.error('❌ Error adding category_id:', error.message);
        throw error;
      }
    } else {
      console.log('✅ category_id column already exists');
    }

    // Add sub_category_id if missing
    if (!existingNames.includes('sub_category_id')) {
      console.log('➕ Adding sub_category_id column...');
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE \`banners\` 
          ADD COLUMN \`sub_category_id\` INTEGER NULL
        `);
        console.log('✅ sub_category_id column added');
      } catch (error) {
        console.error('❌ Error adding sub_category_id:', error.message);
        throw error;
      }
    } else {
      console.log('✅ sub_category_id column already exists');
    }

    // Check and create indexes
    console.log('\n📋 Creating indexes...');
    const indexes = [
      { name: 'banners_page_type_idx', sql: 'CREATE INDEX `banners_page_type_idx` ON `banners`(`page_type`)' },
      { name: 'banners_category_id_idx', sql: 'CREATE INDEX `banners_category_id_idx` ON `banners`(`category_id`)' },
      { name: 'banners_sub_category_id_idx', sql: 'CREATE INDEX `banners_sub_category_id_idx` ON `banners`(`sub_category_id`)' },
      { name: 'banners_page_type_category_id_sub_category_id_idx', sql: 'CREATE INDEX `banners_page_type_category_id_sub_category_id_idx` ON `banners`(`page_type`, `category_id`, `sub_category_id`)' }
    ];

    for (const idx of indexes) {
      try {
        await prisma.$executeRawUnsafe(idx.sql);
        console.log(`✅ Index ${idx.name} created`);
      } catch (error) {
        if (error.message.includes('Duplicate key name') || error.message.includes('already exists')) {
          console.log(`⚠️  Index ${idx.name} already exists`);
        } else {
          console.error(`❌ Error creating index ${idx.name}:`, error.message);
        }
      }
    }

    // Check and create foreign keys
    console.log('\n🔗 Creating foreign keys...');
    
    // Check if foreign key exists
    const fkCategory = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND CONSTRAINT_NAME = 'banners_category_id_fkey'
    `;

    if (fkCategory.length === 0) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE \`banners\` 
          ADD CONSTRAINT \`banners_category_id_fkey\` 
          FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `);
        console.log('✅ Foreign key banners_category_id_fkey created');
      } catch (error) {
        console.error('❌ Error creating foreign key banners_category_id_fkey:', error.message);
      }
    } else {
      console.log('✅ Foreign key banners_category_id_fkey already exists');
    }

    const fkSubCategory = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND CONSTRAINT_NAME = 'banners_sub_category_id_fkey'
    `;

    if (fkSubCategory.length === 0) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE \`banners\` 
          ADD CONSTRAINT \`banners_sub_category_id_fkey\` 
          FOREIGN KEY (\`sub_category_id\`) REFERENCES \`subcategories\`(\`id\`) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `);
        console.log('✅ Foreign key banners_sub_category_id_fkey created');
      } catch (error) {
        console.error('❌ Error creating foreign key banners_sub_category_id_fkey:', error.message);
      }
    } else {
      console.log('✅ Foreign key banners_sub_category_id_fkey already exists');
    }

    // Register migration if not registered
    console.log('\n📝 Registering migration...');
    const migrationExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM \`_prisma_migrations\` 
      WHERE \`migration_name\` = '20260113015558_add_banner_page_type_and_category_associations'
    `;

    if (migrationExists[0].count === 0) {
      try {
        await prisma.$executeRawUnsafe(`
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
        `);
        console.log('✅ Migration registered');
      } catch (error) {
        console.error('⚠️  Error registering migration:', error.message);
      }
    } else {
      console.log('✅ Migration already registered');
    }

    console.log('\n🎉 Banner migration fix completed!');
    console.log('\n📌 Next steps:');
    console.log('   1. Regenerate Prisma Client: npx prisma generate');
    console.log('   2. Restart your application');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixBannerMigration();