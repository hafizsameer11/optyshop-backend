-- Fix marketing_campaigns table - Add image_url and link_url columns if they don't exist
-- Run this SQL directly on your database if the migration fails

-- Check and add image_url column
SET @dbname = DATABASE();
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = @dbname 
               AND TABLE_NAME = 'marketing_campaigns' 
               AND COLUMN_NAME = 'image_url');

SET @sql = IF(@exists = 0, 
    'ALTER TABLE `marketing_campaigns` ADD COLUMN `image_url` VARCHAR(500) NULL',
    'SELECT "Column image_url already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add link_url column
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = @dbname 
               AND TABLE_NAME = 'marketing_campaigns' 
               AND COLUMN_NAME = 'link_url');

SET @sql = IF(@exists = 0, 
    'ALTER TABLE `marketing_campaigns` ADD COLUMN `link_url` VARCHAR(500) NULL',
    'SELECT "Column link_url already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

