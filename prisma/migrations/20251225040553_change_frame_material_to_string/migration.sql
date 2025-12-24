-- AlterTable: Change frame_material from ENUM to VARCHAR(255) in products table
ALTER TABLE `products` MODIFY COLUMN `frame_material` VARCHAR(255) NULL;

-- AlterTable: Change frame_material from ENUM to VARCHAR(255) in contact_lens_configurations table
ALTER TABLE `contact_lens_configurations` MODIFY COLUMN `frame_material` VARCHAR(255) NULL;

