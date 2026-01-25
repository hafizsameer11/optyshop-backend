-- Size/Volume Variants Migration Rollback Script
-- Use this if the migration causes issues in production

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the table if it exists
DROP TABLE IF EXISTS `product_size_volumes`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Remove migration record from _prisma_migrations if it exists
DELETE FROM `_prisma_migrations` WHERE `migration_name` = '20250125000000_add_product_size_volume_variants';

-- Note: This will delete all size/volume variant data
-- Use with caution in production!
