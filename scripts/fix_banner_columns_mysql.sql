-- MySQL-compatible script to add missing banner columns
-- This version works with MySQL which doesn't support IF NOT EXISTS for ALTER TABLE

-- Check and add page_type column
SET @dbname = DATABASE();
SET @tablename = "banners";
SET @columnname = "page_type";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 'Column page_type already exists.' AS message",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add category_id column
SET @columnname = "category_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 'Column category_id already exists.' AS message",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INTEGER NULL")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add sub_category_id column
SET @columnname = "sub_category_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 'Column sub_category_id already exists.' AS message",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INTEGER NULL")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create indexes (safe - will fail silently if they exist)
CREATE INDEX `banners_page_type_idx` ON `banners`(`page_type`);
CREATE INDEX `banners_category_id_idx` ON `banners`(`category_id`);
CREATE INDEX `banners_sub_category_id_idx` ON `banners`(`sub_category_id`);
CREATE INDEX `banners_page_type_category_id_sub_category_id_idx` ON `banners`(`page_type`, `category_id`, `sub_category_id`);

-- Add foreign keys (check first, then add)
SET @fk_name = "banners_category_id_fkey";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (CONSTRAINT_NAME = @fk_name)
  ) > 0,
  "SELECT 'Foreign key banners_category_id_fkey already exists.' AS message",
  CONCAT("ALTER TABLE ", @tablename, " ADD CONSTRAINT ", @fk_name, " FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @fk_name = "banners_sub_category_id_fkey";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (CONSTRAINT_NAME = @fk_name)
  ) > 0,
  "SELECT 'Foreign key banners_sub_category_id_fkey already exists.' AS message",
  CONCAT("ALTER TABLE ", @tablename, " ADD CONSTRAINT ", @fk_name, " FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SELECT 'Banner columns migration completed successfully!' AS message;
