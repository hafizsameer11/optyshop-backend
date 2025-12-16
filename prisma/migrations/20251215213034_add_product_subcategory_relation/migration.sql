-- AlterTable
ALTER TABLE `products` ADD COLUMN `sub_category_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `products_sub_category_id_idx` ON `products`(`sub_category_id`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
