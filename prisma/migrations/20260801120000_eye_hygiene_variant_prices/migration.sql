-- AlterTable
ALTER TABLE `eye_hygiene_variants`
  ADD COLUMN `compare_at_price` DECIMAL(10, 2) NULL,
  ADD COLUMN `cost_price` DECIMAL(10, 2) NULL;
