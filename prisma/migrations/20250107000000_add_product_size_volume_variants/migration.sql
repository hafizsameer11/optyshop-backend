-- CreateTable
CREATE TABLE `product_size_volumes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `size_volume` VARCHAR(50) NOT NULL,
    `pack_type` VARCHAR(50) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `compare_at_price` DECIMAL(10, 2) NULL,
    `cost_price` DECIMAL(10, 2) NULL,
    `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    `stock_status` ENUM('in_stock', 'out_of_stock', 'backorder') NOT NULL DEFAULT 'in_stock',
    `sku` VARCHAR(100) NULL,
    `expiry_date` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_size_volumes_product_id_idx`(`product_id`),
    INDEX `product_size_volumes_is_active_idx`(`is_active`),
    UNIQUE INDEX `product_size_volumes_product_id_size_volume_pack_type_key`(`product_id`, `size_volume`, `pack_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_size_volumes` ADD CONSTRAINT `product_size_volumes_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

