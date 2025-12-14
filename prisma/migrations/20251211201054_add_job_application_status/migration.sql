/*
  Warnings:

  - Added the required column `updated_at` to the `job_applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `job_applications` ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `reviewed_at` DATETIME(3) NULL,
    ADD COLUMN `reviewed_by` INTEGER NULL,
    ADD COLUMN `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    ADD COLUMN `updated_at` DATETIME(3) NULL;

-- Update existing rows to set updated_at to created_at
UPDATE `job_applications` SET `updated_at` = `created_at` WHERE `updated_at` IS NULL;

-- Make updated_at NOT NULL after setting values
ALTER TABLE `job_applications` MODIFY COLUMN `updated_at` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `job_applications_status_idx` ON `job_applications`(`status`);
