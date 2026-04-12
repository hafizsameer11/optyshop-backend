-- Allow the same subcategory name under the same parent in different categories (e.g. "men" top-level in category A vs B).
DROP INDEX `subcategories_name_parent_id_key` ON `subcategories`;

CREATE UNIQUE INDEX `subcategories_category_id_name_parent_id_key` ON `subcategories` (`category_id`, `name`, `parent_id`);
