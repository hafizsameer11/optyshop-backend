-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `lens_thickness_material_id` INTEGER NULL,
    ADD COLUMN `lens_thickness_option_id` INTEGER NULL,
    ADD COLUMN `lens_type` VARCHAR(50) NULL,
    ADD COLUMN `photochromic_color_id` INTEGER NULL,
    ADD COLUMN `prescription_data` LONGTEXT NULL,
    ADD COLUMN `prescription_id` INTEGER NULL,
    ADD COLUMN `prescription_sun_color_id` INTEGER NULL,
    ADD COLUMN `progressive_variant_id` INTEGER NULL,
    ADD COLUMN `treatment_ids` LONGTEXT NULL;

-- CreateIndex
CREATE INDEX `order_items_prescription_id_idx` ON `order_items`(`prescription_id`);

-- CreateIndex
CREATE INDEX `order_items_progressive_variant_id_idx` ON `order_items`(`progressive_variant_id`);

-- CreateIndex
CREATE INDEX `order_items_lens_thickness_material_id_idx` ON `order_items`(`lens_thickness_material_id`);

-- CreateIndex
CREATE INDEX `order_items_lens_thickness_option_id_idx` ON `order_items`(`lens_thickness_option_id`);

-- CreateIndex
CREATE INDEX `order_items_photochromic_color_id_idx` ON `order_items`(`photochromic_color_id`);

-- CreateIndex
CREATE INDEX `order_items_prescription_sun_color_id_idx` ON `order_items`(`prescription_sun_color_id`);

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_prescription_id_fkey` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_progressive_variant_id_fkey` FOREIGN KEY (`progressive_variant_id`) REFERENCES `prescription_lens_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_lens_thickness_material_id_fkey` FOREIGN KEY (`lens_thickness_material_id`) REFERENCES `lens_thickness_materials`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_lens_thickness_option_id_fkey` FOREIGN KEY (`lens_thickness_option_id`) REFERENCES `lens_thickness_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_photochromic_color_id_fkey` FOREIGN KEY (`photochromic_color_id`) REFERENCES `lens_colors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_prescription_sun_color_id_fkey` FOREIGN KEY (`prescription_sun_color_id`) REFERENCES `lens_colors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
