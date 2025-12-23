-- Drop existing unique constraints on name and slug
DROP INDEX `subcategories_name_key` ON `subcategories`;
DROP INDEX `subcategories_slug_key` ON `subcategories`;

-- Add composite unique constraints that allow duplicates under different parents
-- This allows the same name/slug to exist under different parent subcategories
CREATE UNIQUE INDEX `subcategories_name_parent_id_key` ON `subcategories`(`name`, `parent_id`);
CREATE UNIQUE INDEX `subcategories_slug_parent_id_key` ON `subcategories`(`slug`, `parent_id`);

