/*
  Warnings:

  - You are about to alter the column `lens_type` on the `contact_lens_configurations` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(10))` to `VarChar(255)`.
  - You are about to alter the column `frame_shape` on the `contact_lens_configurations` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(26))` to `VarChar(255)`.
  - You are about to alter the column `frame_shape` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(20))` to `VarChar(255)`.
  - You are about to alter the column `lens_type` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(23))` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE `contact_lens_configurations` MODIFY `lens_type` VARCHAR(255) NULL,
    MODIFY `frame_shape` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `products` MODIFY `frame_shape` VARCHAR(255) NULL,
    MODIFY `lens_type` VARCHAR(255) NULL;
