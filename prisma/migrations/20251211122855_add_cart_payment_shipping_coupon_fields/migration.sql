-- AlterTable
ALTER TABLE `cart_items` ADD COLUMN `prescription_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `carts` ADD COLUMN `coupon_code` VARCHAR(50) NULL,
    ADD COLUMN `payment_info` LONGTEXT NULL,
    ADD COLUMN `shipping_info` LONGTEXT NULL;

-- CreateIndex
CREATE INDEX `cart_items_prescription_id_idx` ON `cart_items`(`prescription_id`);

-- CreateIndex
CREATE INDEX `carts_coupon_code_idx` ON `carts`(`coupon_code`);

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_prescription_id_fkey` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
