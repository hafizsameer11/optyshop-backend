#!/bin/bash

echo "🔧 PRODUCTION DATABASE FIX - Adding banner page_type columns..."

# Extract database credentials from environment or use provided DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in environment"
  echo "Usage: DATABASE_URL='mysql://user:pass@host:port/db' ./production-db-fix.sh"
  exit 1
fi

# Parse DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "🔗 Connecting to: $DB_HOST:$DB_PORT/$DB_NAME"

# SQL commands to add missing columns
SQL_COMMANDS="
-- Check and add page_type column
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = '$DB_NAME' 
    AND TABLE_NAME = 'banners' 
    AND COLUMN_NAME = 'page_type'
);

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE banners ADD COLUMN page_type ENUM(\"home\", \"category\", \"subcategory\", \"sub_subcategory\") NOT NULL DEFAULT \"home\"',
  'SELECT \"page_type column already exists\" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add category_id column
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = '$DB_NAME' 
    AND TABLE_NAME = 'banners' 
    AND COLUMN_NAME = 'category_id'
);

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE banners ADD COLUMN category_id INTEGER NULL',
  'SELECT \"category_id column already exists\" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add sub_category_id column
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = '$DB_NAME' 
    AND TABLE_NAME = 'banners' 
    AND COLUMN_NAME = 'sub_category_id'
);

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE banners ADD COLUMN sub_category_id INTEGER NULL',
  'SELECT \"sub_category_id column already exists\" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS banners_page_type_idx ON banners(page_type);
CREATE INDEX IF NOT EXISTS banners_category_id_idx ON banners(category_id);
CREATE INDEX IF NOT EXISTS banners_sub_category_id_idx ON banners(sub_category_id);
CREATE INDEX IF NOT EXISTS banners_page_type_category_id_sub_category_id_idx ON banners(page_type, category_id, sub_category_id);

-- Add foreign key constraints if they don't exist
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = '$DB_NAME' 
    AND TABLE_NAME = 'banners' 
    AND CONSTRAINT_NAME = 'banners_category_id_fkey'
);

SET @sql = IF(@constraint_exists = 0, 
  'ALTER TABLE banners ADD CONSTRAINT banners_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT \"category_id foreign key already exists\" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = '$DB_NAME' 
    AND TABLE_NAME = 'banners' 
    AND CONSTRAINT_NAME = 'banners_sub_category_id_fkey'
);

SET @sql = IF(@constraint_exists = 0, 
  'ALTER TABLE banners ADD CONSTRAINT banners_sub_category_id_fkey FOREIGN KEY (sub_category_id) REFERENCES subcategories(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT \"sub_category_id foreign key already exists\" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Database fix completed successfully!' as status;
"

# Execute SQL commands
echo "$SQL_COMMANDS" | mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME"

if [ $? -eq 0 ]; then
  echo "✅ Production database fix completed successfully!"
  echo "🔄 Please restart your Docker container:"
  echo "   docker restart optyshop-backend"
else
  echo "❌ Database fix failed. Please check your database credentials."
  exit 1
fi
