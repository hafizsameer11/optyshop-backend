-- CreateTable
CREATE TABLE `astigmatism_dropdown_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `field_type` ENUM('power', 'cylinder', 'axis') NOT NULL,
    `value` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NULL,
    `eye_type` ENUM('left', 'right', 'both') NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `astigmatism_dropdown_values_field_type_idx`(`field_type`),
    INDEX `astigmatism_dropdown_values_eye_type_idx`(`eye_type`),
    INDEX `astigmatism_dropdown_values_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

