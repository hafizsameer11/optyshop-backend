-- Simple SQL to add image_url and link_url columns to marketing_campaigns table
-- Run this directly on your production database

ALTER TABLE `marketing_campaigns` 
ADD COLUMN `image_url` VARCHAR(500) NULL,
ADD COLUMN `link_url` VARCHAR(500) NULL;

