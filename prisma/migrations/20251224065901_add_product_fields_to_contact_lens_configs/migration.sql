/*
  Warnings:

  - You are about to alter the column `lens_type` on the `contact_lens_configurations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Enum(EnumId(26))`.
  - Made the column `name` on table `contact_lens_configurations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stock_quantity` on table `contact_lens_configurations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stock_status` on table `contact_lens_configurations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `contact_lens_configurations` ADD COLUMN `category_id` INTEGER NULL,
    ADD COLUMN `frame_color` VARCHAR(100) NULL,
    ADD COLUMN `frame_material` ENUM('acetate', 'metal', 'tr90', 'titanium', 'wood', 'mixed') NULL,
    ADD COLUMN `frame_shape` ENUM('round', 'square', 'oval', 'cat_eye', 'aviator', 'rectangle', 'wayfarer', 'geometric') NULL,
    ADD COLUMN `gender` ENUM('men', 'women', 'unisex', 'kids') NOT NULL DEFAULT 'unisex',
    ADD COLUMN `spherical_lens_type` VARCHAR(100) NULL,
    MODIFY `lens_type` ENUM('prescription', 'sunglasses', 'reading', 'computer', 'photochromic', 'plastic', 'glass', 'polycarbonate', 'trivex', 'high_index') NULL,
    MODIFY `name` VARCHAR(255) NOT NULL,
    MODIFY `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    MODIFY `stock_status` ENUM('in_stock', 'out_of_stock', 'backorder') NOT NULL DEFAULT 'in_stock';

-- CreateIndex
CREATE INDEX `contact_lens_configurations_category_id_idx` ON `contact_lens_configurations`(`category_id`);

-- AddForeignKey
ALTER TABLE `contact_lens_configurations` ADD CONSTRAINT `contact_lens_configurations_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
