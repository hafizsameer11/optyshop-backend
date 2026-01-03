-- AlterEnum
-- This migration adds 'eye_hygiene' to the ProductType enum
-- MySQL allows modifying ENUM columns directly using MODIFY COLUMN

-- AlterTable
ALTER TABLE `products` 
MODIFY COLUMN `product_type` ENUM('frame', 'sunglasses', 'contact_lens', 'eye_hygiene', 'accessory') NOT NULL DEFAULT 'frame';

