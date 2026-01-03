-- CreateIndex
CREATE INDEX `astigmatism_dropdown_values_field_type_is_active_idx` ON `astigmatism_dropdown_values`(`field_type`, `is_active`);

-- CreateIndex
CREATE INDEX `contact_lens_configurations_configuration_type_is_active_idx` ON `contact_lens_configurations`(`configuration_type`, `is_active`);

-- CreateIndex
CREATE INDEX `contact_lens_configurations_sub_category_id_configuration_ty_idx` ON `contact_lens_configurations`(`sub_category_id`, `configuration_type`, `is_active`);

-- CreateIndex
CREATE INDEX `contact_lens_configurations_category_id_is_active_idx` ON `contact_lens_configurations`(`category_id`, `is_active`);

-- CreateIndex
CREATE INDEX `products_category_id_is_active_idx` ON `products`(`category_id`, `is_active`);

-- CreateIndex
CREATE INDEX `products_sub_category_id_is_active_idx` ON `products`(`sub_category_id`, `is_active`);
