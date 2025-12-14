-- AlterTable
ALTER TABLE `lens_colors` ADD COLUMN `prescription_lens_type_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `prescription_lens_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `prescription_type` ENUM('single_vision', 'bifocal', 'trifocal', 'progressive') NOT NULL,
    `base_price` DECIMAL(10, 2) NOT NULL DEFAULT 60.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prescription_lens_types_name_key`(`name`),
    UNIQUE INDEX `prescription_lens_types_slug_key`(`slug`),
    INDEX `prescription_lens_types_is_active_idx`(`is_active`),
    INDEX `prescription_lens_types_prescription_type_idx`(`prescription_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `lens_colors_prescription_lens_type_id_idx` ON `lens_colors`(`prescription_lens_type_id`);

-- AddForeignKey
ALTER TABLE `lens_colors` ADD CONSTRAINT `lens_colors_prescription_lens_type_id_fkey` FOREIGN KEY (`prescription_lens_type_id`) REFERENCES `prescription_lens_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
