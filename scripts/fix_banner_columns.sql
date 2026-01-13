-- Quick fix SQL script to add missing banner columns
-- Run this directly on your production database if needed

-- Add page_type column (if it doesn't exist)
ALTER TABLE `banners` 
ADD COLUMN IF NOT EXISTS `page_type` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home';

-- Add category_id column (if it doesn't exist)
ALTER TABLE `banners` 
ADD COLUMN IF NOT EXISTS `category_id` INTEGER NULL;

-- Add sub_category_id column (if it doesn't exist)
ALTER TABLE `banners` 
ADD COLUMN IF NOT EXISTS `sub_category_id` INTEGER NULL;

-- Create indexes (ignore errors if they already exist)
CREATE INDEX IF NOT EXISTS `banners_page_type_idx` ON `banners`(`page_type`);
CREATE INDEX IF NOT EXISTS `banners_category_id_idx` ON `banners`(`category_id`);
CREATE INDEX IF NOT EXISTS `banners_sub_category_id_idx` ON `banners`(`sub_category_id`);
CREATE INDEX IF NOT EXISTS `banners_page_type_category_id_sub_category_id_idx` ON `banners`(`page_type`, `category_id`, `sub_category_id`);

-- Add foreign keys (check if they exist first)
-- Note: MySQL doesn't support IF NOT EXISTS for foreign keys, so wrap in error handling
-- Or add them manually only if they don't exist

-- For category_id foreign key:
-- ALTER TABLE `banners` 
-- ADD CONSTRAINT `banners_category_id_fkey` 
-- FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) 
-- ON DELETE CASCADE ON UPDATE CASCADE;

-- For sub_category_id foreign key:
-- ALTER TABLE `banners` 
-- ADD CONSTRAINT `banners_sub_category_id_fkey` 
-- FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) 
-- ON DELETE CASCADE ON UPDATE CASCADE;
