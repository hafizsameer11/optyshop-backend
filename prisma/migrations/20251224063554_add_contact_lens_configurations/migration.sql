-- CreateTable
CREATE TABLE `contact_lens_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NULL,
    `sub_category_id` INTEGER NULL,
    `configuration_type` ENUM('spherical', 'astigmatism') NOT NULL,
    `lens_type` VARCHAR(100) NULL,
    `right_qty` INTEGER NULL DEFAULT 1,
    `right_base_curve` DECIMAL(5, 2) NULL,
    `right_diameter` DECIMAL(5, 2) NULL,
    `right_power` DECIMAL(5, 2) NULL,
    `right_cylinder` DECIMAL(5, 2) NULL,
    `right_axis` INTEGER NULL,
    `left_qty` INTEGER NULL DEFAULT 1,
    `left_base_curve` DECIMAL(5, 2) NULL,
    `left_diameter` DECIMAL(5, 2) NULL,
    `left_power` DECIMAL(5, 2) NULL,
    `left_cylinder` DECIMAL(5, 2) NULL,
    `left_axis` INTEGER NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `contact_lens_configurations_product_id_idx`(`product_id`),
    INDEX `contact_lens_configurations_sub_category_id_idx`(`sub_category_id`),
    INDEX `contact_lens_configurations_configuration_type_idx`(`configuration_type`),
    INDEX `contact_lens_configurations_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contact_lens_configurations` ADD CONSTRAINT `contact_lens_configurations_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_lens_configurations` ADD CONSTRAINT `contact_lens_configurations_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
