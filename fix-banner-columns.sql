-- SQL script to add missing page_type column to banners table
-- Run this directly on your production database

-- Check if column exists first (optional safety check)
-- SET @column_exists = (
--   SELECT COUNT(*)
--   FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_SCHEMA = 'opty_shop' 
--     AND TABLE_NAME = 'banners' 
--     AND COLUMN_NAME = 'page_type'
-- );

-- Add the page_type column if it doesn't exist
ALTER TABLE `banners` 
ADD COLUMN `page_type` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home';

-- Add the category_id column if it doesn't exist
ALTER TABLE `banners` 
ADD COLUMN `category_id` INTEGER NULL;

-- Add the sub_category_id column if it doesn't exist  
ALTER TABLE `banners` 
ADD COLUMN `sub_category_id` INTEGER NULL;

-- Create indexes for better performance
CREATE INDEX `banners_page_type_idx` ON `banners`(`page_type`);
CREATE INDEX `banners_category_id_idx` ON `banners`(`category_id`);
CREATE INDEX `banners_sub_category_id_idx` ON `banners`(`sub_category_id`);
CREATE INDEX `banners_page_type_category_id_sub_category_id_idx` ON `banners`(`page_type`, `category_id`, `sub_category_id`);

-- Add foreign key constraints
ALTER TABLE `banners` ADD CONSTRAINT `banners_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `banners` ADD CONSTRAINT `banners_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
