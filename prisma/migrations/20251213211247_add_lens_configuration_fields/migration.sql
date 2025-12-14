-- AlterTable
ALTER TABLE `cart_items` ADD COLUMN `lens_thickness_material_id` INTEGER NULL,
    ADD COLUMN `lens_thickness_option_id` INTEGER NULL,
    ADD COLUMN `lens_type` VARCHAR(50) NULL,
    ADD COLUMN `photochromic_color_id` INTEGER NULL,
    ADD COLUMN `prescription_data` LONGTEXT NULL,
    ADD COLUMN `prescription_sun_color_id` INTEGER NULL,
    ADD COLUMN `progressive_variant_id` INTEGER NULL,
    ADD COLUMN `treatment_ids` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `lens_thickness_materials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_thickness_materials_name_key`(`name`),
    UNIQUE INDEX `lens_thickness_materials_slug_key`(`slug`),
    INDEX `lens_thickness_materials_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_thickness_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `thickness_value` DECIMAL(5, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_thickness_options_name_key`(`name`),
    UNIQUE INDEX `lens_thickness_options_slug_key`(`slug`),
    INDEX `lens_thickness_options_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `cart_items_progressive_variant_id_idx` ON `cart_items`(`progressive_variant_id`);

-- CreateIndex
CREATE INDEX `cart_items_lens_thickness_material_id_idx` ON `cart_items`(`lens_thickness_material_id`);

-- CreateIndex
CREATE INDEX `cart_items_lens_thickness_option_id_idx` ON `cart_items`(`lens_thickness_option_id`);

-- CreateIndex
CREATE INDEX `cart_items_photochromic_color_id_idx` ON `cart_items`(`photochromic_color_id`);

-- CreateIndex
CREATE INDEX `cart_items_prescription_sun_color_id_idx` ON `cart_items`(`prescription_sun_color_id`);

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_progressive_variant_id_fkey` FOREIGN KEY (`progressive_variant_id`) REFERENCES `prescription_lens_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_lens_thickness_material_id_fkey` FOREIGN KEY (`lens_thickness_material_id`) REFERENCES `lens_thickness_materials`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_lens_thickness_option_id_fkey` FOREIGN KEY (`lens_thickness_option_id`) REFERENCES `lens_thickness_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_photochromic_color_id_fkey` FOREIGN KEY (`photochromic_color_id`) REFERENCES `lens_colors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_prescription_sun_color_id_fkey` FOREIGN KEY (`prescription_sun_color_id`) REFERENCES `lens_colors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
