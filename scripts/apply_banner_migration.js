const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyBannerMigration() {
  try {
    console.log('🔄 Applying banner migration...');

    // Check which columns already exist
    const existingColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND COLUMN_NAME IN ('page_type', 'category_id', 'sub_category_id')
    `;

    const columnNames = existingColumns.map(col => col.COLUMN_NAME);
    console.log(`📊 Existing columns: ${columnNames.length > 0 ? columnNames.join(', ') : 'none'}`);

    // Check and add page_type column
    if (!columnNames.includes('page_type')) {
      console.log('📝 Adding page_type column...');
      try {
        await prisma.$executeRaw`
          ALTER TABLE \`banners\` 
          ADD COLUMN \`page_type\` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home'
        `;
        console.log('✅ page_type column added');
      } catch (e) {
        if (e.message.includes('Duplicate column name')) {
          console.log('⚠️  page_type column already exists');
        } else {
          throw e;
        }
      }
    } else {
      console.log('✅ page_type column already exists');
    }

    // Check and add category_id column
    if (!columnNames.includes('category_id')) {
      console.log('📝 Adding category_id column...');
      try {
        await prisma.$executeRaw`
          ALTER TABLE \`banners\` 
          ADD COLUMN \`category_id\` INTEGER NULL
        `;
        console.log('✅ category_id column added');
      } catch (e) {
        if (e.message.includes('Duplicate column name')) {
          console.log('⚠️  category_id column already exists');
        } else {
          throw e;
        }
      }
    } else {
      console.log('✅ category_id column already exists');
    }

    // Check and add sub_category_id column
    if (!columnNames.includes('sub_category_id')) {
      console.log('📝 Adding sub_category_id column...');
      try {
        await prisma.$executeRaw`
          ALTER TABLE \`banners\` 
          ADD COLUMN \`sub_category_id\` INTEGER NULL
        `;
        console.log('✅ sub_category_id column added');
      } catch (e) {
        if (e.message.includes('Duplicate column name')) {
          console.log('⚠️  sub_category_id column already exists');
        } else {
          throw e;
        }
      }
    } else {
      console.log('✅ sub_category_id column already exists');
    }

    // Create indexes (check if they exist first)
    console.log('📝 Creating/verifying indexes...');
    const existingIndexes = await prisma.$queryRaw`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND INDEX_NAME IN ('banners_page_type_idx', 'banners_category_id_idx', 'banners_sub_category_id_idx', 'banners_page_type_category_id_sub_category_id_idx')
    `;
    const indexNames = existingIndexes.map(idx => idx.INDEX_NAME);

    if (!indexNames.includes('banners_page_type_idx')) {
      try {
        await prisma.$executeRaw`CREATE INDEX \`banners_page_type_idx\` ON \`banners\`(\`page_type\`)`;
        console.log('✅ Created banners_page_type_idx');
      } catch (e) {
        console.log(`⚠️  Could not create banners_page_type_idx: ${e.message}`);
      }
    }

    if (!indexNames.includes('banners_category_id_idx')) {
      try {
        await prisma.$executeRaw`CREATE INDEX \`banners_category_id_idx\` ON \`banners\`(\`category_id\`)`;
        console.log('✅ Created banners_category_id_idx');
      } catch (e) {
        console.log(`⚠️  Could not create banners_category_id_idx: ${e.message}`);
      }
    }

    if (!indexNames.includes('banners_sub_category_id_idx')) {
      try {
        await prisma.$executeRaw`CREATE INDEX \`banners_sub_category_id_idx\` ON \`banners\`(\`sub_category_id\`)`;
        console.log('✅ Created banners_sub_category_id_idx');
      } catch (e) {
        console.log(`⚠️  Could not create banners_sub_category_id_idx: ${e.message}`);
      }
    }

    if (!indexNames.includes('banners_page_type_category_id_sub_category_id_idx')) {
      try {
        await prisma.$executeRaw`CREATE INDEX \`banners_page_type_category_id_sub_category_id_idx\` ON \`banners\`(\`page_type\`, \`category_id\`, \`sub_category_id\`)`;
        console.log('✅ Created banners_page_type_category_id_sub_category_id_idx');
      } catch (e) {
        console.log(`⚠️  Could not create composite index: ${e.message}`);
      }
    }

    // Add foreign keys
    console.log('📝 Adding/verifying foreign keys...');
    const existingForeignKeys = await prisma.$queryRaw`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND CONSTRAINT_NAME IN ('banners_category_id_fkey', 'banners_sub_category_id_fkey')
    `;
    const fkNames = existingForeignKeys.map(fk => fk.CONSTRAINT_NAME);

    if (!fkNames.includes('banners_category_id_fkey')) {
      try {
        await prisma.$executeRaw`
          ALTER TABLE \`banners\` 
          ADD CONSTRAINT \`banners_category_id_fkey\` 
          FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `;
        console.log('✅ Created banners_category_id_fkey');
      } catch (e) {
        if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
          console.log('⚠️  Foreign key banners_category_id_fkey already exists');
        } else {
          console.log(`⚠️  Could not create banners_category_id_fkey: ${e.message}`);
        }
      }
    } else {
      console.log('✅ banners_category_id_fkey already exists');
    }

    if (!fkNames.includes('banners_sub_category_id_fkey')) {
      try {
        await prisma.$executeRaw`
          ALTER TABLE \`banners\` 
          ADD CONSTRAINT \`banners_sub_category_id_fkey\` 
          FOREIGN KEY (\`sub_category_id\`) REFERENCES \`subcategories\`(\`id\`) 
          ON DELETE CASCADE ON UPDATE CASCADE
        `;
        console.log('✅ Created banners_sub_category_id_fkey');
      } catch (e) {
        if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
          console.log('⚠️  Foreign key banners_sub_category_id_fkey already exists');
        } else {
          console.log(`⚠️  Could not create banners_sub_category_id_fkey: ${e.message}`);
        }
      }
    } else {
      console.log('✅ banners_sub_category_id_fkey already exists');
    }

    console.log('✅ Column migration completed!');

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