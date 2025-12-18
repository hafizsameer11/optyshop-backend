/*
  Warnings:

  - You are about to drop the column `parent_id` on the `subcategories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `subcategories` DROP FOREIGN KEY `subcategories_parent_id_fkey`;

-- DropIndex
DROP INDEX `subcategories_parent_id_idx` ON `subcategories`;

-- AlterTable
ALTER TABLE `cart_items` ADD COLUMN `contact_lens_left_base_curve` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_left_diameter` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_left_power` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_left_qty` INTEGER NULL,
    ADD COLUMN `contact_lens_right_base_curve` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_right_diameter` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_right_power` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_right_qty` INTEGER NULL;

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `contact_lens_left_base_curve` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_left_diameter` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_left_power` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_left_qty` INTEGER NULL,
    ADD COLUMN `contact_lens_right_base_curve` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_right_diameter` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_right_power` DECIMAL(5, 2) NULL,
    ADD COLUMN `contact_lens_right_qty` INTEGER NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `base_curve_options` LONGTEXT NULL,
    ADD COLUMN `can_sleep_with` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `contact_lens_brand` VARCHAR(100) NULL,
    ADD COLUMN `contact_lens_color` VARCHAR(100) NULL,
    ADD COLUMN `contact_lens_material` VARCHAR(100) NULL,
    ADD COLUMN `contact_lens_type` VARCHAR(50) NULL,
    ADD COLUMN `diameter_options` LONGTEXT NULL,
    ADD COLUMN `has_uv_filter` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `is_medical_device` BOOLEAN NULL DEFAULT true,
    ADD COLUMN `powers_range` TEXT NULL,
    ADD COLUMN `replacement_frequency` VARCHAR(50) NULL,
    ADD COLUMN `water_content` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `subcategories` DROP COLUMN `parent_id`;
