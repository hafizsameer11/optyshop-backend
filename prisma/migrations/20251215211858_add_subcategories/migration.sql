/*
  Warnings:

  - You are about to drop the `navigation_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `navigation_menus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `navigation_items` DROP FOREIGN KEY `navigation_items_menu_id_fkey`;

-- DropForeignKey
ALTER TABLE `navigation_items` DROP FOREIGN KEY `navigation_items_parent_id_fkey`;

-- DropTable
DROP TABLE `navigation_items`;

-- DropTable
DROP TABLE `navigation_menus`;

-- CreateTable
CREATE TABLE `subcategories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subcategories_name_key`(`name`),
    UNIQUE INDEX `subcategories_slug_key`(`slug`),
    INDEX `subcategories_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
