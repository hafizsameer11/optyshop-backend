-- Remove unique constraint on slug and parent_id
-- This allows duplicate slugs under the same parent subcategory
DROP INDEX `subcategories_slug_parent_id_key` ON `subcategories`;

