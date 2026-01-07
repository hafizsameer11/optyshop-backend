-- Check which columns exist and add only the missing ones
-- Run this SQL to check the current state

-- Check if image_url exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'image_url EXISTS'
        ELSE 'image_url MISSING'
    END AS image_url_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'optyshop'
  AND TABLE_NAME = 'marketing_campaigns'
  AND COLUMN_NAME = 'image_url';

-- Check if link_url exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'link_url EXISTS'
        ELSE 'link_url MISSING'
    END AS link_url_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'optyshop'
  AND TABLE_NAME = 'marketing_campaigns'
  AND COLUMN_NAME = 'link_url';

-- Add link_url if it doesn't exist (image_url already exists based on error)
ALTER TABLE `marketing_campaigns` 
ADD COLUMN `link_url` VARCHAR(500) NULL;

