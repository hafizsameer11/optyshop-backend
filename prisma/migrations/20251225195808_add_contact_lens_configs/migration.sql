-- CreateTable
CREATE TABLE `spherical_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `sub_category_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,
    `price` DECIMAL(10, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `right_qty` LONGTEXT NULL,
    `right_base_curve` LONGTEXT NULL,
    `right_diameter` LONGTEXT NULL,
    `right_power` LONGTEXT NULL,
    `left_qty` LONGTEXT NULL,
    `left_base_curve` LONGTEXT NULL,
    `left_diameter` LONGTEXT NULL,
    `left_power` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `productId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `astigmatism_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `sub_category_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,
    `price` DECIMAL(10, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `right_qty` LONGTEXT NULL,
    `right_base_curve` LONGTEXT NULL,
    `right_diameter` LONGTEXT NULL,
    `right_power` LONGTEXT NULL,
    `right_cylinder` LONGTEXT NULL,
    `right_axis` LONGTEXT NULL,
    `left_qty` LONGTEXT NULL,
    `left_base_curve` LONGTEXT NULL,
    `left_diameter` LONGTEXT NULL,
    `left_power` LONGTEXT NULL,
    `left_cylinder` LONGTEXT NULL,
    `left_axis` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `productId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `spherical_configurations` ADD CONSTRAINT `spherical_configurations_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spherical_configurations` ADD CONSTRAINT `spherical_configurations_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spherical_configurations` ADD CONSTRAINT `spherical_configurations_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `astigmatism_configurations` ADD CONSTRAINT `astigmatism_configurations_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `astigmatism_configurations` ADD CONSTRAINT `astigmatism_configurations_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `astigmatism_configurations` ADD CONSTRAINT `astigmatism_configurations_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
