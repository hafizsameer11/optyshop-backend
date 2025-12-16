-- AlterTable
ALTER TABLE `subcategories` ADD COLUMN `parent_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `subcategories_parent_id_idx` ON `subcategories`(`parent_id`);

-- AddForeignKey
ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
