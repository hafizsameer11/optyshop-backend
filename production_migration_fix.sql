-- Production Migration Script for Missing Schema Elements
-- This script adds missing columns and tables that exist in schema but not in production

-- 1. Add brand_id column to products table if it doesn't exist
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `brand_id` INTEGER NULL;

-- 2. Add foreign key constraint for brand_id
ALTER TABLE `products` ADD CONSTRAINT IF NOT EXISTS `products_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Add index for brand_id if it doesn't exist
CREATE INDEX IF NOT EXISTS `products_brand_id_idx` ON `products`(`brand_id`);

-- 4. Ensure brands table exists
CREATE TABLE IF NOT EXISTS `brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `logo_url` VARCHAR(500) NULL,
    `website_url` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `brands_slug_key`(`slug`),
    INDEX `brands_slug_idx`(`slug`),
    INDEX `brands_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
