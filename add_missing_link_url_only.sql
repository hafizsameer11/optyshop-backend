-- Add only link_url column (image_url already exists)
-- Run this SQL directly on your database

ALTER TABLE `marketing_campaigns` 
ADD COLUMN `link_url` VARCHAR(500) NULL;

