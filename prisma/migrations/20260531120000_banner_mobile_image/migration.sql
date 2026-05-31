-- Add optional mobile-specific banner image (falls back to desktop image on frontend when null)
ALTER TABLE `banners` ADD COLUMN `mobile_image_url` VARCHAR(500) NULL;
