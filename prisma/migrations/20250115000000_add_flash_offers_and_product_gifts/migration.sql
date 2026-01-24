-- CreateTable
CREATE TABLE `flash_offers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `product_ids` LONGTEXT NULL,
    `discount_type` ENUM('percentage', 'fixed_amount', 'free_shipping', 'bogo') NULL,
    `discount_value` DECIMAL(10, 2) NULL,
    `starts_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ends_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `image_url` VARCHAR(500) NULL,
    `link_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `flash_offers_is_active_idx`(`is_active`),
    INDEX `flash_offers_ends_at_idx`(`ends_at`),
    INDEX `flash_offers_starts_at_ends_at_idx`(`starts_at`, `ends_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_gifts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `gift_product_id` INTEGER NOT NULL,
    `min_quantity` INTEGER NOT NULL DEFAULT 1,
    `max_quantity` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_gifts_product_id_gift_product_id_key`(`product_id`, `gift_product_id`),
    INDEX `product_gifts_product_id_idx`(`product_id`),
    INDEX `product_gifts_gift_product_id_idx`(`gift_product_id`),
    INDEX `product_gifts_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_gifts` ADD CONSTRAINT `product_gifts_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_gifts` ADD CONSTRAINT `product_gifts_gift_product_id_fkey` FOREIGN KEY (`gift_product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
