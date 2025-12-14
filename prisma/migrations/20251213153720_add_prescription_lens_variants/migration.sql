-- CreateTable
CREATE TABLE `prescription_lens_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prescription_lens_type_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `is_recommended` BOOLEAN NOT NULL DEFAULT false,
    `viewing_range` VARCHAR(100) NULL,
    `use_cases` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `prescription_lens_variants_prescription_lens_type_id_idx`(`prescription_lens_type_id`),
    INDEX `prescription_lens_variants_is_active_idx`(`is_active`),
    INDEX `prescription_lens_variants_is_recommended_idx`(`is_recommended`),
    UNIQUE INDEX `prescription_lens_variants_prescription_lens_type_id_slug_key`(`prescription_lens_type_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `prescription_lens_variants` ADD CONSTRAINT `prescription_lens_variants_prescription_lens_type_id_fkey` FOREIGN KEY (`prescription_lens_type_id`) REFERENCES `prescription_lens_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
