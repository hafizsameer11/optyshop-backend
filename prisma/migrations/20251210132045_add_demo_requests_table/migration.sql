-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('customer', 'admin', 'staff') NOT NULL DEFAULT 'customer';

-- CreateTable
CREATE TABLE `demo_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `surname` VARCHAR(100) NOT NULL,
    `village` VARCHAR(100) NOT NULL,
    `company_name` VARCHAR(150) NOT NULL,
    `website_url` VARCHAR(500) NULL,
    `frames_in_catalog` VARCHAR(50) NULL,
    `message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
