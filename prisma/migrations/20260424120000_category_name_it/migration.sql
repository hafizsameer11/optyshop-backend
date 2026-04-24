-- Optional Italian display titles for shop menu (categories / subcategories)
ALTER TABLE `categories` ADD COLUMN `name_it` VARCHAR(100) NULL;
ALTER TABLE `subcategories` ADD COLUMN `name_it` VARCHAR(100) NULL;
