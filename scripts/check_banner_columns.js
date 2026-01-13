const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBannerColumns() {
  try {
    console.log('🔍 Checking banner table columns...\n');

    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners'
      ORDER BY ORDINAL_POSITION
    `;

    console.log('Current banner table columns:');
    console.table(columns);

    // Check specifically for our new columns
    const newColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'banners' 
      AND COLUMN_NAME IN ('page_type', 'category_id', 'sub_category_id')
    `;

    console.log('\nChecking for new columns:');
    console.log('page_type exists:', newColumns.some(c => c.COLUMN_NAME === 'page_type'));
    console.log('category_id exists:', newColumns.some(c => c.COLUMN_NAME === 'category_id'));
    console.log('sub_category_id exists:', newColumns.some(c => c.COLUMN_NAME === 'sub_category_id'));

    if (newColumns.length < 3) {
      console.log('\n⚠️  Missing columns detected. Applying migration...\n');
      
      // Apply migration
      try {
        if (!newColumns.some(c => c.COLUMN_NAME === 'page_type')) {
          console.log('Adding page_type column...');
          await prisma.$executeRaw`
            ALTER TABLE \`banners\` 
            ADD COLUMN \`page_type\` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home'
          `;
        }

        if (!newColumns.some(c => c.COLUMN_NAME === 'category_id')) {
          console.log('Adding category_id column...');
          await prisma.$executeRaw`
            ALTER TABLE \`banners\` 
            ADD COLUMN \`category_id\` INTEGER NULL
          `;
        }

        if (!newColumns.some(c => c.COLUMN_NAME === 'sub_category_id')) {
          console.log('Adding sub_category_id column...');
          await prisma.$executeRaw`
            ALTER TABLE \`banners\` 
            ADD COLUMN \`sub_category_id\` INTEGER NULL
          `;
        }

        console.log('✅ Columns added successfully!');

        // Create indexes
        console.log('Creating indexes...');
        try {
          await prisma.$executeRaw`CREATE INDEX \`banners_page_type_idx\` ON \`banners\`(\`page_type\`)`;
        } catch (e) {
          if (!e.message.includes('Duplicate key name')) console.log('Index already exists or error:', e.message);
        }

        try {
          await prisma.$executeRaw`CREATE INDEX \`banners_category_id_idx\` ON \`banners\`(\`category_id\`)`;
        } catch (e) {
          if (!e.message.includes('Duplicate key name')) console.log('Index already exists or error:', e.message);
        }

        try {
          await prisma.$executeRaw`CREATE INDEX \`banners_sub_category_id_idx\` ON \`banners\`(\`sub_category_id\`)`;
        } catch (e) {
          if (!e.message.includes('Duplicate key name')) console.log('Index already exists or error:', e.message);
        }

        try {
          await prisma.$executeRaw`CREATE INDEX \`banners_page_type_category_id_sub_category_id_idx\` ON \`banners\`(\`page_type\`, \`category_id\`, \`sub_category_id\`)`;
        } catch (e) {
          if (!e.message.includes('Duplicate key name')) console.log('Index already exists or error:', e.message);
        }

        // Add foreign keys
        console.log('Adding foreign keys...');
        try {
          await prisma.$executeRaw`
            ALTER TABLE \`banners\` 
            ADD CONSTRAINT \`banners_category_id_fkey\` 
            FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE CASCADE
          `;
        } catch (e) {
          if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
            console.log('Foreign key banners_category_id_fkey already exists');
          } else {
            throw e;
          }
        }

        try {
          await prisma.$executeRaw`
            ALTER TABLE \`banners\` 
            ADD CONSTRAINT \`banners_sub_category_id_fkey\` 
            FOREIGN KEY (\`sub_category_id\`) REFERENCES \`subcategories\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE CASCADE
          `;
        } catch (e) {
          if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
            console.log('Foreign key banners_sub_category_id_fkey already exists');
          } else {
            throw e;
          }
        }

        console.log('\n✅ Migration completed successfully!');
      } catch (error) {
        console.error('❌ Error applying migration:', error.message);
        throw error;
      }
    } else {
      console.log('\n✅ All columns exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkBannerColumns();