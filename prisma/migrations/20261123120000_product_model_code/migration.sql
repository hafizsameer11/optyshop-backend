-- AlterTable
ALTER TABLE `products` ADD COLUMN `model_code` VARCHAR(100) NULL;

-- CreateIndex
CREATE INDEX `products_model_code_idx` ON `products`(`model_code`);
