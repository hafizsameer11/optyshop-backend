-- AlterTable
ALTER TABLE `products` ADD COLUMN `expiry_date` DATETIME(3) NULL,
    ADD COLUMN `pack_type` VARCHAR(50) NULL,
    ADD COLUMN `size_volume` VARCHAR(50) NULL;
