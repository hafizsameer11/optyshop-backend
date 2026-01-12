-- AlterTable
ALTER TABLE `banners` 
ADD COLUMN `page_type` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home',
ADD COLUMN `category_id` INTEGER NULL,
ADD COLUMN `sub_category_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `banners_page_type_idx` ON `banners`(`page_type`);

-- CreateIndex
CREATE INDEX `banners_category_id_idx` ON `banners`(`category_id`);

-- CreateIndex
CREATE INDEX `banners_sub_category_id_idx` ON `banners`(`sub_category_id`);

-- CreateIndex
CREATE INDEX `banners_page_type_category_id_sub_category_id_idx` ON `banners`(`page_type`, `category_id`, `sub_category_id`);

-- AddForeignKey
ALTER TABLE `banners` ADD CONSTRAINT `banners_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banners` ADD CONSTRAINT `banners_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;