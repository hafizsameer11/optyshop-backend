-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_number` VARCHAR(50) NOT NULL,
    `order_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('payment', 'refund', 'partial_refund', 'chargeback', 'reversal') NOT NULL DEFAULT 'payment',
    `status` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    `payment_method` ENUM('stripe', 'paypal', 'cod') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `gateway_transaction_id` VARCHAR(255) NULL,
    `gateway_response` LONGTEXT NULL,
    `gateway_fee` DECIMAL(10, 2) NULL,
    `net_amount` DECIMAL(10, 2) NULL,
    `description` TEXT NULL,
    `metadata` LONGTEXT NULL,
    `processed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transactions_transaction_number_key`(`transaction_number`),
    INDEX `transactions_order_id_idx`(`order_id`),
    INDEX `transactions_user_id_idx`(`user_id`),
    INDEX `transactions_transaction_number_idx`(`transaction_number`),
    INDEX `transactions_status_idx`(`status`),
    INDEX `transactions_type_idx`(`type`),
    INDEX `transactions_gateway_transaction_id_idx`(`gateway_transaction_id`),
    INDEX `transactions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
