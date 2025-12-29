-- CreateTable
CREATE TABLE `prescription_form_dropdown_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `field_type` ENUM('pd', 'sph', 'cyl', 'axis', 'h', 'year_of_birth', 'select_option') NOT NULL,
    `value` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NULL,
    `eye_type` ENUM('left', 'right', 'both') NULL,
    `form_type` ENUM('progressive', 'near_vision', 'distance_vision') NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `prescription_form_dropdown_values_field_type_idx`(`field_type`),
    INDEX `prescription_form_dropdown_values_eye_type_idx`(`eye_type`),
    INDEX `prescription_form_dropdown_values_form_type_idx`(`form_type`),
    INDEX `prescription_form_dropdown_values_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
