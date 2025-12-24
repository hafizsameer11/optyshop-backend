-- AlterTable
ALTER TABLE `contact_lens_configurations` ADD COLUMN `color_images` LONGTEXT NULL,
    ADD COLUMN `compare_at_price` DECIMAL(10, 2) NULL,
    ADD COLUMN `cost_price` DECIMAL(10, 2) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `images` LONGTEXT NULL,
    ADD COLUMN `name` VARCHAR(255) NULL,
    ADD COLUMN `price` DECIMAL(10, 2) NULL,
    ADD COLUMN `short_description` VARCHAR(500) NULL,
    ADD COLUMN `sku` VARCHAR(100) NULL,
    ADD COLUMN `slug` VARCHAR(255) NULL,
    ADD COLUMN `stock_quantity` INTEGER NULL DEFAULT 0,
    ADD COLUMN `stock_status` ENUM('in_stock', 'out_of_stock', 'backorder') NULL DEFAULT 'in_stock';

-- CreateIndex
CREATE INDEX `contact_lens_configurations_slug_idx` ON `contact_lens_configurations`(`slug`);

-- CreateIndex
CREATE INDEX `contact_lens_configurations_sku_idx` ON `contact_lens_configurations`(`sku`);
