-- CreateTable
CREATE TABLE `shipping_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `type` ENUM('standard', 'express', 'overnight', 'international', 'free') NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `estimated_days` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `icon` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shipping_methods_slug_key`(`slug`),
    INDEX `shipping_methods_is_active_idx`(`is_active`),
    INDEX `shipping_methods_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `type` ENUM('classic', 'mirror', 'gradient', 'polarized', 'photochromic', 'transitions', 'eyeqlenz', 'standard', 'blokz_photochromic') NOT NULL,
    `description` TEXT NULL,
    `base_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_options_slug_key`(`slug`),
    INDEX `lens_options_is_active_idx`(`is_active`),
    INDEX `lens_options_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_finishes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lens_option_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `price_adjustment` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lens_finishes_lens_option_id_idx`(`lens_option_id`),
    INDEX `lens_finishes_is_active_idx`(`is_active`),
    UNIQUE INDEX `lens_finishes_lens_option_id_slug_key`(`lens_option_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_colors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lens_option_id` INTEGER NULL,
    `lens_finish_id` INTEGER NULL,
    `name` VARCHAR(100) NOT NULL,
    `color_code` VARCHAR(50) NOT NULL,
    `hex_code` VARCHAR(7) NULL,
    `image_url` VARCHAR(500) NULL,
    `price_adjustment` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lens_colors_lens_option_id_idx`(`lens_option_id`),
    INDEX `lens_colors_lens_finish_id_idx`(`lens_finish_id`),
    INDEX `lens_colors_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_treatments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `type` ENUM('scratch_proof', 'anti_glare', 'blue_light_anti_glare', 'uv_protection', 'photochromic', 'polarized', 'anti_reflective') NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `icon` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_treatments_name_key`(`name`),
    UNIQUE INDEX `lens_treatments_slug_key`(`slug`),
    INDEX `lens_treatments_is_active_idx`(`is_active`),
    INDEX `lens_treatments_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lens_finishes` ADD CONSTRAINT `lens_finishes_lens_option_id_fkey` FOREIGN KEY (`lens_option_id`) REFERENCES `lens_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lens_colors` ADD CONSTRAINT `lens_colors_lens_option_id_fkey` FOREIGN KEY (`lens_option_id`) REFERENCES `lens_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lens_colors` ADD CONSTRAINT `lens_colors_lens_finish_id_fkey` FOREIGN KEY (`lens_finish_id`) REFERENCES `lens_finishes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
