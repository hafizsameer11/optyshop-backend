-- CreateTable
CREATE TABLE IF NOT EXISTS `social_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `platform` VARCHAR(50) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `label` VARCHAR(100) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `social_links_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
