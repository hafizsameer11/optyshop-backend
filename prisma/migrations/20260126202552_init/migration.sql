-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `role` ENUM('customer', 'admin', 'staff') NOT NULL DEFAULT 'customer',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `avatar` VARCHAR(500) NULL,
    `refresh_token` TEXT NULL,
    `reset_password_token` VARCHAR(255) NULL,
    `reset_password_expires` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subcategories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `parent_id` INTEGER NULL,

    INDEX `subcategories_category_id_idx`(`category_id`),
    INDEX `subcategories_parent_id_idx`(`parent_id`),
    UNIQUE INDEX `subcategories_name_parent_id_key`(`name`, `parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `short_description` VARCHAR(500) NULL,
    `category_id` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `compare_at_price` DECIMAL(10, 2) NULL,
    `cost_price` DECIMAL(10, 2) NULL,
    `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    `stock_status` ENUM('in_stock', 'out_of_stock', 'backorder') NOT NULL DEFAULT 'in_stock',
    `images` LONGTEXT NULL,
    `frame_shape` VARCHAR(255) NULL,
    `frame_material` VARCHAR(255) NULL,
    `frame_color` VARCHAR(100) NULL,
    `gender` ENUM('men', 'women', 'unisex', 'kids') NOT NULL DEFAULT 'unisex',
    `lens_type` VARCHAR(255) NULL,
    `lens_index_options` LONGTEXT NULL,
    `treatment_options` LONGTEXT NULL,
    `model_3d_url` VARCHAR(500) NULL,
    `try_on_image` VARCHAR(500) NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `rating` DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    `review_count` INTEGER NOT NULL DEFAULT 0,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `meta_keywords` VARCHAR(255) NULL,
    `product_type` ENUM('frame', 'sunglasses', 'contact_lens', 'eye_hygiene', 'accessory') NOT NULL DEFAULT 'frame',
    `sub_category_id` INTEGER NULL,
    `base_curve_options` LONGTEXT NULL,
    `can_sleep_with` BOOLEAN NULL DEFAULT false,
    `contact_lens_brand` VARCHAR(100) NULL,
    `contact_lens_color` VARCHAR(100) NULL,
    `contact_lens_material` VARCHAR(100) NULL,
    `contact_lens_type` VARCHAR(50) NULL,
    `diameter_options` LONGTEXT NULL,
    `has_uv_filter` BOOLEAN NULL DEFAULT false,
    `is_medical_device` BOOLEAN NULL DEFAULT true,
    `powers_range` TEXT NULL,
    `replacement_frequency` VARCHAR(50) NULL,
    `water_content` VARCHAR(50) NULL,
    `color_images` LONGTEXT NULL,
    `expiry_date` DATETIME(3) NULL,
    `pack_type` VARCHAR(50) NULL,
    `size_volume` VARCHAR(50) NULL,
    `mm_calibers` LONGTEXT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    UNIQUE INDEX `products_sku_key`(`sku`),
    INDEX `products_category_id_idx`(`category_id`),
    INDEX `products_sub_category_id_idx`(`sub_category_id`),
    INDEX `products_slug_idx`(`slug`),
    INDEX `products_sku_idx`(`sku`),
    INDEX `products_frame_shape_idx`(`frame_shape`),
    INDEX `products_frame_material_idx`(`frame_material`),
    INDEX `products_is_active_is_featured_idx`(`is_active`, `is_featured`),
    INDEX `products_category_id_is_active_idx`(`category_id`, `is_active`),
    INDEX `products_sub_category_id_is_active_idx`(`sub_category_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `frame_sizes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `lens_width` DECIMAL(5, 2) NOT NULL,
    `bridge_width` DECIMAL(5, 2) NOT NULL,
    `temple_length` DECIMAL(5, 2) NOT NULL,
    `frame_width` DECIMAL(5, 2) NULL,
    `frame_height` DECIMAL(5, 2) NULL,
    `size_label` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `frame_sizes_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `index` DECIMAL(3, 2) NOT NULL,
    `thickness_factor` DECIMAL(5, 2) NULL,
    `price_adjustment` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_types_name_key`(`name`),
    UNIQUE INDEX `lens_types_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_coatings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `type` ENUM('ar', 'blue_light', 'uv', 'scratch', 'photochromic', 'polarized') NOT NULL,
    `description` TEXT NULL,
    `price_adjustment` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_coatings_name_key`(`name`),
    UNIQUE INDEX `lens_coatings_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_lens_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `lens_type_id` INTEGER NOT NULL,

    INDEX `product_lens_types_lens_type_id_fkey`(`lens_type_id`),
    UNIQUE INDEX `product_lens_types_product_id_lens_type_id_key`(`product_id`, `lens_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_lens_coatings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `lens_coating_id` INTEGER NOT NULL,

    INDEX `product_lens_coatings_lens_coating_id_fkey`(`lens_coating_id`),
    UNIQUE INDEX `product_lens_coatings_product_id_lens_coating_id_key`(`product_id`, `lens_coating_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `prescription_type` ENUM('single_vision', 'bifocal', 'trifocal', 'progressive') NOT NULL DEFAULT 'single_vision',
    `od_sphere` DECIMAL(5, 2) NULL,
    `od_cylinder` DECIMAL(5, 2) NULL,
    `od_axis` INTEGER NULL,
    `od_add` DECIMAL(5, 2) NULL,
    `os_sphere` DECIMAL(5, 2) NULL,
    `os_cylinder` DECIMAL(5, 2) NULL,
    `os_axis` INTEGER NULL,
    `os_add` DECIMAL(5, 2) NULL,
    `pd_binocular` DECIMAL(5, 2) NULL,
    `pd_monocular_od` DECIMAL(5, 2) NULL,
    `pd_monocular_os` DECIMAL(5, 2) NULL,
    `pd_near` DECIMAL(5, 2) NULL,
    `ph_od` DECIMAL(5, 2) NULL,
    `ph_os` DECIMAL(5, 2) NULL,
    `doctor_name` VARCHAR(255) NULL,
    `doctor_license` VARCHAR(100) NULL,
    `prescription_date` DATETIME(3) NULL,
    `expiry_date` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `prescriptions_user_id_idx`(`user_id`),
    INDEX `prescriptions_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `coupon_code` VARCHAR(50) NULL,
    `payment_info` LONGTEXT NULL,
    `shipping_info` LONGTEXT NULL,

    UNIQUE INDEX `carts_user_id_key`(`user_id`),
    INDEX `carts_user_id_idx`(`user_id`),
    INDEX `carts_coupon_code_idx`(`coupon_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cart_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `lens_index` DECIMAL(3, 2) NULL,
    `lens_coatings` LONGTEXT NULL,
    `frame_size_id` INTEGER NULL,
    `customization` LONGTEXT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `prescription_id` INTEGER NULL,
    `lens_thickness_material_id` INTEGER NULL,
    `lens_thickness_option_id` INTEGER NULL,
    `lens_type` VARCHAR(50) NULL,
    `photochromic_color_id` INTEGER NULL,
    `prescription_data` LONGTEXT NULL,
    `prescription_sun_color_id` INTEGER NULL,
    `progressive_variant_id` INTEGER NULL,
    `treatment_ids` LONGTEXT NULL,
    `contact_lens_left_base_curve` DECIMAL(5, 2) NULL,
    `contact_lens_left_diameter` DECIMAL(5, 2) NULL,
    `contact_lens_left_power` DECIMAL(5, 2) NULL,
    `contact_lens_left_qty` INTEGER NULL,
    `contact_lens_right_base_curve` DECIMAL(5, 2) NULL,
    `contact_lens_right_diameter` DECIMAL(5, 2) NULL,
    `contact_lens_right_power` DECIMAL(5, 2) NULL,
    `contact_lens_right_qty` INTEGER NULL,

    INDEX `cart_items_cart_id_idx`(`cart_id`),
    INDEX `cart_items_product_id_idx`(`product_id`),
    INDEX `cart_items_prescription_id_idx`(`prescription_id`),
    INDEX `cart_items_progressive_variant_id_idx`(`progressive_variant_id`),
    INDEX `cart_items_lens_thickness_material_id_idx`(`lens_thickness_material_id`),
    INDEX `cart_items_lens_thickness_option_id_idx`(`lens_thickness_option_id`),
    INDEX `cart_items_photochromic_color_id_idx`(`photochromic_color_id`),
    INDEX `cart_items_prescription_sun_color_id_idx`(`prescription_sun_color_id`),
    UNIQUE INDEX `cart_items_cart_id_product_id_lens_index_frame_size_id_key`(`cart_id`, `product_id`, `lens_index`, `frame_size_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_number` VARCHAR(50) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `prescription_id` INTEGER NULL,
    `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `payment_method` ENUM('stripe', 'paypal', 'cod') NULL,
    `payment_id` VARCHAR(255) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `shipping` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `shipping_address` LONGTEXT NOT NULL,
    `billing_address` LONGTEXT NULL,
    `notes` TEXT NULL,
    `shipped_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `orders_user_id_idx`(`user_id`),
    INDEX `orders_order_number_idx`(`order_number`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_payment_status_idx`(`payment_status`),
    INDEX `orders_prescription_id_fkey`(`prescription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `product_sku` VARCHAR(100) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    `lens_index` DECIMAL(3, 2) NULL,
    `lens_coatings` LONGTEXT NULL,
    `frame_size_id` INTEGER NULL,
    `customization` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `contact_lens_left_base_curve` DECIMAL(5, 2) NULL,
    `contact_lens_left_diameter` DECIMAL(5, 2) NULL,
    `contact_lens_left_power` DECIMAL(5, 2) NULL,
    `contact_lens_left_qty` INTEGER NULL,
    `contact_lens_right_base_curve` DECIMAL(5, 2) NULL,
    `contact_lens_right_diameter` DECIMAL(5, 2) NULL,
    `contact_lens_right_power` DECIMAL(5, 2) NULL,
    `contact_lens_right_qty` INTEGER NULL,
    `lens_thickness_material_id` INTEGER NULL,
    `lens_thickness_option_id` INTEGER NULL,
    `lens_type` VARCHAR(50) NULL,
    `photochromic_color_id` INTEGER NULL,
    `prescription_data` LONGTEXT NULL,
    `prescription_id` INTEGER NULL,
    `prescription_sun_color_id` INTEGER NULL,
    `progressive_variant_id` INTEGER NULL,
    `treatment_ids` LONGTEXT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_product_id_idx`(`product_id`),
    INDEX `order_items_prescription_id_idx`(`prescription_id`),
    INDEX `order_items_progressive_variant_id_idx`(`progressive_variant_id`),
    INDEX `order_items_lens_thickness_material_id_idx`(`lens_thickness_material_id`),
    INDEX `order_items_lens_thickness_option_id_idx`(`lens_thickness_option_id`),
    INDEX `order_items_photochromic_color_id_idx`(`photochromic_color_id`),
    INDEX `order_items_prescription_sun_color_id_idx`(`prescription_sun_color_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_number` VARCHAR(50) NOT NULL,
    `order_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('payment', 'refund', 'partial_refund', 'chargeback', 'reversal') NOT NULL DEFAULT 'payment',
    `status` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    `payment_method` ENUM('stripe', 'paypal', 'cod') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `gateway_transaction_id` VARCHAR(255) NULL,
    `gateway_response` LONGTEXT NULL,
    `gateway_fee` DECIMAL(10, 2) NULL,
    `net_amount` DECIMAL(10, 2) NULL,
    `description` TEXT NULL,
    `metadata` LONGTEXT NULL,
    `processed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transactions_transaction_number_key`(`transaction_number`),
    INDEX `transactions_order_id_idx`(`order_id`),
    INDEX `transactions_user_id_idx`(`user_id`),
    INDEX `transactions_transaction_number_idx`(`transaction_number`),
    INDEX `transactions_status_idx`(`status`),
    INDEX `transactions_type_idx`(`type`),
    INDEX `transactions_gateway_transaction_id_idx`(`gateway_transaction_id`),
    INDEX `transactions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipping_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `type` ENUM('standard', 'express', 'overnight', 'international', 'free') NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `estimated_days` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `icon` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shipping_methods_slug_key`(`slug`),
    INDEX `shipping_methods_is_active_idx`(`is_active`),
    INDEX `shipping_methods_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `type` ENUM('classic', 'mirror', 'gradient', 'polarized', 'photochromic', 'transitions', 'eyeqlenz', 'standard', 'blokz_photochromic') NOT NULL,
    `description` TEXT NULL,
    `base_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_options_slug_key`(`slug`),
    INDEX `lens_options_is_active_idx`(`is_active`),
    INDEX `lens_options_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_finishes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lens_option_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `price_adjustment` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lens_finishes_lens_option_id_idx`(`lens_option_id`),
    INDEX `lens_finishes_is_active_idx`(`is_active`),
    UNIQUE INDEX `lens_finishes_lens_option_id_slug_key`(`lens_option_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_colors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lens_option_id` INTEGER NULL,
    `lens_finish_id` INTEGER NULL,
    `name` VARCHAR(100) NOT NULL,
    `color_code` VARCHAR(50) NOT NULL,
    `hex_code` VARCHAR(7) NULL,
    `image_url` VARCHAR(500) NULL,
    `price_adjustment` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `prescription_lens_type_id` INTEGER NULL,

    INDEX `lens_colors_lens_option_id_idx`(`lens_option_id`),
    INDEX `lens_colors_lens_finish_id_idx`(`lens_finish_id`),
    INDEX `lens_colors_prescription_lens_type_id_idx`(`prescription_lens_type_id`),
    INDEX `lens_colors_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_treatments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `type` ENUM('scratch_proof', 'anti_glare', 'blue_light_anti_glare', 'uv_protection', 'photochromic', 'polarized', 'anti_reflective') NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `icon` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_treatments_name_key`(`name`),
    UNIQUE INDEX `lens_treatments_slug_key`(`slug`),
    INDEX `lens_treatments_is_active_idx`(`is_active`),
    INDEX `lens_treatments_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_lens_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `prescription_type` ENUM('single_vision', 'bifocal', 'trifocal', 'progressive') NOT NULL,
    `base_price` DECIMAL(10, 2) NOT NULL DEFAULT 60.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prescription_lens_types_name_key`(`name`),
    UNIQUE INDEX `prescription_lens_types_slug_key`(`slug`),
    INDEX `prescription_lens_types_is_active_idx`(`is_active`),
    INDEX `prescription_lens_types_prescription_type_idx`(`prescription_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_lens_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prescription_lens_type_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `is_recommended` BOOLEAN NOT NULL DEFAULT false,
    `viewing_range` VARCHAR(100) NULL,
    `use_cases` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `prescription_lens_variants_prescription_lens_type_id_idx`(`prescription_lens_type_id`),
    INDEX `prescription_lens_variants_is_active_idx`(`is_active`),
    INDEX `prescription_lens_variants_is_recommended_idx`(`is_recommended`),
    UNIQUE INDEX `prescription_lens_variants_prescription_lens_type_id_slug_key`(`prescription_lens_type_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `order_id` INTEGER NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(255) NULL,
    `comment` TEXT NULL,
    `images` LONGTEXT NULL,
    `is_verified_purchase` BOOLEAN NOT NULL DEFAULT false,
    `is_approved` BOOLEAN NOT NULL DEFAULT false,
    `helpful_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reviews_user_id_idx`(`user_id`),
    INDEX `reviews_product_id_idx`(`product_id`),
    INDEX `reviews_rating_idx`(`rating`),
    INDEX `reviews_is_approved_idx`(`is_approved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `simulation_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `config_key` VARCHAR(100) NOT NULL,
    `config_value` LONGTEXT NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `simulation_configs_config_key_key`(`config_key`),
    INDEX `simulation_configs_config_key_idx`(`config_key`),
    INDEX `simulation_configs_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `sku` VARCHAR(100) NULL,
    `size_label` VARCHAR(50) NULL,
    `color` VARCHAR(100) NULL,
    `material` VARCHAR(100) NULL,
    `additional_data` LONGTEXT NULL,
    `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    `price` DECIMAL(10, 2) NULL,
    `images` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_variants_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_size_volumes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `size_volume` VARCHAR(50) NOT NULL,
    `pack_type` VARCHAR(50) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `compare_at_price` DECIMAL(10, 2) NULL,
    `cost_price` DECIMAL(10, 2) NULL,
    `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    `stock_status` ENUM('in_stock', 'out_of_stock', 'backorder') NOT NULL DEFAULT 'in_stock',
    `sku` VARCHAR(100) NULL,
    `expiry_date` DATETIME(3) NULL,
    `image_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_size_volumes_product_id_idx`(`product_id`),
    INDEX `product_size_volumes_is_active_idx`(`is_active`),
    UNIQUE INDEX `product_size_volumes_product_id_size_volume_pack_type_key`(`product_id`, `size_volume`, `pack_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `base_index` DECIMAL(3, 2) NOT NULL,
    `lens_type_id` INTEGER NULL,
    `coatings` LONGTEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `price_rules` LONGTEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_packages_slug_key`(`slug`),
    INDEX `lens_packages_lens_type_id_idx`(`lens_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `discount_type` ENUM('percentage', 'fixed_amount', 'free_shipping', 'bogo') NOT NULL,
    `discount_value` DECIMAL(10, 2) NOT NULL,
    `max_discount` DECIMAL(10, 2) NULL,
    `min_order_amount` DECIMAL(10, 2) NULL,
    `usage_limit` INTEGER NULL,
    `usage_per_user` INTEGER NULL,
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `applicable_to` VARCHAR(50) NULL,
    `conditions` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `coupons_code_key`(`code`),
    INDEX `coupons_code_idx`(`code`),
    INDEX `coupons_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketing_campaigns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `campaign_type` VARCHAR(50) NULL,
    `config` LONGTEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `link_url` VARCHAR(500) NULL,

    UNIQUE INDEX `marketing_campaigns_slug_key`(`slug`),
    INDEX `marketing_campaigns_slug_idx`(`slug`),
    INDEX `marketing_campaigns_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flash_offers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `product_ids` LONGTEXT NULL,
    `discount_type` ENUM('percentage', 'fixed_amount', 'free_shipping', 'bogo') NULL,
    `discount_value` DECIMAL(10, 2) NULL,
    `starts_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ends_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `image_url` VARCHAR(500) NULL,
    `link_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `flash_offers_is_active_idx`(`is_active`),
    INDEX `flash_offers_ends_at_idx`(`ends_at`),
    INDEX `flash_offers_starts_at_ends_at_idx`(`starts_at`, `ends_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_gifts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `gift_product_id` INTEGER NOT NULL,
    `min_quantity` INTEGER NOT NULL DEFAULT 1,
    `max_quantity` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_gifts_product_id_idx`(`product_id`),
    INDEX `product_gifts_gift_product_id_idx`(`gift_product_id`),
    INDEX `product_gifts_is_active_idx`(`is_active`),
    UNIQUE INDEX `product_gifts_product_id_gift_product_id_key`(`product_id`, `gift_product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(150) NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `link_url` VARCHAR(500) NULL,
    `position` VARCHAR(50) NULL,
    `page_type` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home',
    `category_id` INTEGER NULL,
    `sub_category_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `meta` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `banners_position_idx`(`position`),
    INDEX `banners_page_type_idx`(`page_type`),
    INDEX `banners_category_id_idx`(`category_id`),
    INDEX `banners_sub_category_id_idx`(`sub_category_id`),
    INDEX `banners_page_type_category_id_sub_category_id_idx`(`page_type`, `category_id`, `sub_category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eye_hygiene_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `eye_hygiene_variants_product_id_idx`(`product_id`),
    INDEX `eye_hygiene_variants_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `excerpt` VARCHAR(500) NULL,
    `content` TEXT NOT NULL,
    `thumbnail` VARCHAR(500) NULL,
    `tags` LONGTEXT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_posts_slug_key`(`slug`),
    INDEX `blog_posts_slug_idx`(`slug`),
    INDEX `blog_posts_is_published_published_at_idx`(`is_published`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_studies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(150) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `hero_title` VARCHAR(255) NOT NULL,
    `hero_subtitle` VARCHAR(255) NULL,
    `category` VARCHAR(100) NULL,
    `person` LONGTEXT NULL,
    `image_url` VARCHAR(500) NULL,
    `content` TEXT NULL,
    `tags` LONGTEXT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `case_studies_slug_key`(`slug`),
    INDEX `case_studies_is_published_idx`(`is_published`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_articles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NULL,
    `snippet` VARCHAR(500) NULL,
    `summary` VARCHAR(1000) NULL,
    `content` TEXT NOT NULL,
    `read_time` INTEGER NULL,
    `header_image` VARCHAR(500) NULL,
    `key_points` LONGTEXT NULL,
    `published_at` DATETIME(3) NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_articles_slug_key`(`slug`),
    INDEX `blog_articles_slug_idx`(`slug`),
    INDEX `blog_articles_is_published_published_at_idx`(`is_published`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(255) NULL,
    `title` VARCHAR(255) NOT NULL,
    `department` VARCHAR(100) NULL,
    `location` VARCHAR(150) NULL,
    `description` TEXT NULL,
    `requirements` LONGTEXT NULL,
    `apply_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jobs_slug_key`(`slug`),
    INDEX `jobs_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NULL,
    `description` VARCHAR(500) NULL,
    `fields` LONGTEXT NOT NULL,
    `cta_text` VARCHAR(150) NULL,
    `meta` LONGTEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `form_configs_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `form_name` VARCHAR(100) NOT NULL,
    `form_config_id` INTEGER NULL,
    `payload` LONGTEXT NOT NULL,
    `meta` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `form_submissions_form_config_id_idx`(`form_config_id`),
    INDEX `form_submissions_form_name_idx`(`form_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demo_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `surname` VARCHAR(100) NOT NULL,
    `village` VARCHAR(100) NOT NULL,
    `company_name` VARCHAR(150) NOT NULL,
    `website_url` VARCHAR(500) NULL,
    `frames_in_catalog` VARCHAR(50) NULL,
    `message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `company_name` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credentials_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone_number` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone_number` VARCHAR(50) NULL,
    `solutions_concerned` LONGTEXT NULL,
    `message` TEXT NOT NULL,
    `attachments` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `job_id` INTEGER NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(50) NOT NULL,
    `linkedin_profile` VARCHAR(500) NULL,
    `portfolio_website` VARCHAR(500) NULL,
    `resume_cv` VARCHAR(500) NOT NULL,
    `cover_letter_file` VARCHAR(500) NULL,
    `why_join_message` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `reviewed_at` DATETIME(3) NULL,
    `reviewed_by` INTEGER NULL,
    `status` ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `job_applications_job_id_idx`(`job_id`),
    INDEX `job_applications_email_idx`(`email`),
    INDEX `job_applications_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faqs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(500) NOT NULL,
    `answer` TEXT NOT NULL,
    `category` VARCHAR(100) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `faqs_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `page_type` VARCHAR(50) NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pages_slug_key`(`slug`),
    INDEX `pages_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_name` VARCHAR(150) NOT NULL,
    `text` TEXT NOT NULL,
    `rating` INTEGER NULL,
    `avatar_url` VARCHAR(500) NULL,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vto_assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `asset_type` ENUM('frame_3d', 'face_mesh', 'occlusion_mask', 'environment_map') NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `thumbnail_url` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `metadata` LONGTEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vto_assets_asset_type_idx`(`asset_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vto_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `settings` LONGTEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vto_configs_slug_key`(`slug`),
    INDEX `vto_configs_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(100) NULL,
    `resource_id` INTEGER NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `details` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_activity_logs_admin_id_idx`(`admin_id`),
    INDEX `admin_activity_logs_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_error_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `path` VARCHAR(255) NOT NULL,
    `method` VARCHAR(10) NOT NULL,
    `status_code` INTEGER NOT NULL,
    `error_message` TEXT NULL,
    `request_id` VARCHAR(100) NULL,
    `meta` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `api_error_logs_path_idx`(`path`),
    INDEX `api_error_logs_status_code_idx`(`status_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_type` VARCHAR(100) NOT NULL,
    `user_id` INTEGER NULL,
    `session_id` VARCHAR(100) NULL,
    `device` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `data` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `analytics_events_event_type_idx`(`event_type`),
    INDEX `analytics_events_created_at_idx`(`created_at`),
    INDEX `analytics_events_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_thickness_materials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_thickness_materials_name_key`(`name`),
    UNIQUE INDEX `lens_thickness_materials_slug_key`(`slug`),
    INDEX `lens_thickness_materials_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lens_thickness_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `thickness_value` DECIMAL(5, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lens_thickness_options_name_key`(`name`),
    UNIQUE INDEX `lens_thickness_options_slug_key`(`slug`),
    INDEX `lens_thickness_options_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spherical_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `sub_category_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,
    `price` DECIMAL(10, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `right_qty` LONGTEXT NULL,
    `right_base_curve` LONGTEXT NULL,
    `right_diameter` LONGTEXT NULL,
    `right_power` LONGTEXT NULL,
    `left_qty` LONGTEXT NULL,
    `left_base_curve` LONGTEXT NULL,
    `left_diameter` LONGTEXT NULL,
    `left_power` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `productId` INTEGER NULL,

    INDEX `spherical_configurations_category_id_fkey`(`category_id`),
    INDEX `spherical_configurations_productId_fkey`(`productId`),
    INDEX `spherical_configurations_sub_category_id_fkey`(`sub_category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `astigmatism_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `sub_category_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,
    `price` DECIMAL(10, 2) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `right_qty` LONGTEXT NULL,
    `right_base_curve` LONGTEXT NULL,
    `right_diameter` LONGTEXT NULL,
    `right_power` LONGTEXT NULL,
    `right_cylinder` LONGTEXT NULL,
    `right_axis` LONGTEXT NULL,
    `left_qty` LONGTEXT NULL,
    `left_base_curve` LONGTEXT NULL,
    `left_diameter` LONGTEXT NULL,
    `left_power` LONGTEXT NULL,
    `left_cylinder` LONGTEXT NULL,
    `left_axis` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `productId` INTEGER NULL,

    INDEX `astigmatism_configurations_category_id_fkey`(`category_id`),
    INDEX `astigmatism_configurations_productId_fkey`(`productId`),
    INDEX `astigmatism_configurations_sub_category_id_fkey`(`sub_category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contact_lens_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NULL,
    `sub_category_id` INTEGER NULL,
    `configuration_type` ENUM('spherical', 'astigmatism') NOT NULL,
    `lens_type` VARCHAR(255) NULL,
    `right_qty` LONGTEXT NULL,
    `right_base_curve` LONGTEXT NULL,
    `right_diameter` LONGTEXT NULL,
    `right_power` LONGTEXT NULL,
    `right_cylinder` LONGTEXT NULL,
    `right_axis` LONGTEXT NULL,
    `left_qty` LONGTEXT NULL,
    `left_base_curve` LONGTEXT NULL,
    `left_diameter` LONGTEXT NULL,
    `left_power` LONGTEXT NULL,
    `left_cylinder` LONGTEXT NULL,
    `left_axis` LONGTEXT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `color_images` LONGTEXT NULL,
    `compare_at_price` DECIMAL(10, 2) NULL,
    `cost_price` DECIMAL(10, 2) NULL,
    `description` TEXT NULL,
    `images` LONGTEXT NULL,
    `name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NULL,
    `short_description` VARCHAR(500) NULL,
    `sku` VARCHAR(100) NULL,
    `slug` VARCHAR(255) NULL,
    `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    `stock_status` ENUM('in_stock', 'out_of_stock', 'backorder') NOT NULL DEFAULT 'in_stock',
    `category_id` INTEGER NULL,
    `frame_color` VARCHAR(100) NULL,
    `frame_material` VARCHAR(255) NULL,
    `frame_shape` VARCHAR(255) NULL,
    `gender` ENUM('men', 'women', 'unisex', 'kids') NOT NULL DEFAULT 'unisex',
    `spherical_lens_type` VARCHAR(100) NULL,
    `unit_images` LONGTEXT NULL,
    `unit_prices` LONGTEXT NULL,
    `available_units` LONGTEXT NULL,

    INDEX `contact_lens_configurations_product_id_idx`(`product_id`),
    INDEX `contact_lens_configurations_category_id_idx`(`category_id`),
    INDEX `contact_lens_configurations_sub_category_id_idx`(`sub_category_id`),
    INDEX `contact_lens_configurations_configuration_type_idx`(`configuration_type`),
    INDEX `contact_lens_configurations_is_active_idx`(`is_active`),
    INDEX `contact_lens_configurations_slug_idx`(`slug`),
    INDEX `contact_lens_configurations_sku_idx`(`sku`),
    INDEX `contact_lens_configurations_configuration_type_is_active_idx`(`configuration_type`, `is_active`),
    INDEX `contact_lens_configurations_sub_category_id_configuration_ty_idx`(`sub_category_id`, `configuration_type`, `is_active`),
    INDEX `contact_lens_configurations_category_id_is_active_idx`(`category_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `astigmatism_dropdown_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `field_type` ENUM('qty', 'base_curve', 'diameter', 'power', 'cylinder', 'axis') NOT NULL,
    `value` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NULL,
    `eye_type` ENUM('left', 'right', 'both') NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `astigmatism_dropdown_values_field_type_idx`(`field_type`),
    INDEX `astigmatism_dropdown_values_eye_type_idx`(`eye_type`),
    INDEX `astigmatism_dropdown_values_is_active_idx`(`is_active`),
    INDEX `astigmatism_dropdown_values_field_type_is_active_idx`(`field_type`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_form_dropdown_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `field_type` ENUM('pd', 'sph', 'cyl', 'axis', 'h', 'year_of_birth', 'select_option') NOT NULL,
    `value` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NULL,
    `eye_type` ENUM('left', 'right', 'both') NULL,
    `form_type` ENUM('progressive', 'near_vision', 'distance_vision') NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `prescription_form_dropdown_values_field_type_idx`(`field_type`),
    INDEX `prescription_form_dropdown_values_eye_type_idx`(`eye_type`),
    INDEX `prescription_form_dropdown_values_form_type_idx`(`form_type`),
    INDEX `prescription_form_dropdown_values_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `logo_image` VARCHAR(500) NULL,
    `website_url` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `brands_name_key`(`name`),
    UNIQUE INDEX `brands_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `frame_sizes` ADD CONSTRAINT `frame_sizes_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_lens_types` ADD CONSTRAINT `product_lens_types_lens_type_id_fkey` FOREIGN KEY (`lens_type_id`) REFERENCES `lens_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_lens_types` ADD CONSTRAINT `product_lens_types_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_lens_coatings` ADD CONSTRAINT `product_lens_coatings_lens_coating_id_fkey` FOREIGN KEY (`lens_coating_id`) REFERENCES `lens_coatings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_lens_coatings` ADD CONSTRAINT `product_lens_coatings_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_lens_thickness_material_id_fkey` FOREIGN KEY (`lens_thickness_material_id`) REFERENCES `lens_thickness_materials`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_lens_thickness_option_id_fkey` FOREIGN KEY (`lens_thickness_option_id`) REFERENCES `lens_thickness_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_photochromic_color_id_fkey` FOREIGN KEY (`photochromic_color_id`) REFERENCES `lens_colors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_prescription_id_fkey` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_prescription_sun_color_id_fkey` FOREIGN KEY (`prescription_sun_color_id`) REFERENCES `lens_colors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_progressive_variant_id_fkey` FOREIGN KEY (`progressive_variant_id`) REFERENCES `prescription_lens_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_prescription_id_fkey` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_lens_thickness_material_id_fkey` FOREIGN KEY (`lens_thickness_material_id`) REFERENCES `lens_thickness_materials`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_lens_thickness_option_id_fkey` FOREIGN KEY (`lens_thickness_option_id`) REFERENCES `lens_thickness_options`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_photochromic_color_id_fkey` FOREIGN KEY (`photochromic_color_id`) REFERENCES `lens_colors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_prescription_id_fkey` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_prescription_sun_color_id_fkey` FOREIGN KEY (`prescription_sun_color_id`) REFERENCES `lens_colors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_progressive_variant_id_fkey` FOREIGN KEY (`progressive_variant_id`) REFERENCES `prescription_lens_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lens_finishes` ADD CONSTRAINT `lens_finishes_lens_option_id_fkey` FOREIGN KEY (`lens_option_id`) REFERENCES `lens_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lens_colors` ADD CONSTRAINT `lens_colors_lens_finish_id_fkey` FOREIGN KEY (`lens_finish_id`) REFERENCES `lens_finishes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lens_colors` ADD CONSTRAINT `lens_colors_lens_option_id_fkey` FOREIGN KEY (`lens_option_id`) REFERENCES `lens_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lens_colors` ADD CONSTRAINT `lens_colors_prescription_lens_type_id_fkey` FOREIGN KEY (`prescription_lens_type_id`) REFERENCES `prescription_lens_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_lens_variants` ADD CONSTRAINT `prescription_lens_variants_prescription_lens_type_id_fkey` FOREIGN KEY (`prescription_lens_type_id`) REFERENCES `prescription_lens_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_size_volumes` ADD CONSTRAINT `product_size_volumes_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lens_packages` ADD CONSTRAINT `lens_packages_lens_type_id_fkey` FOREIGN KEY (`lens_type_id`) REFERENCES `lens_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_gifts` ADD CONSTRAINT `product_gifts_gift_product_id_fkey` FOREIGN KEY (`gift_product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_gifts` ADD CONSTRAINT `product_gifts_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banners` ADD CONSTRAINT `banners_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banners` ADD CONSTRAINT `banners_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eye_hygiene_variants` ADD CONSTRAINT `eye_hygiene_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_submissions` ADD CONSTRAINT `form_submissions_form_config_id_fkey` FOREIGN KEY (`form_config_id`) REFERENCES `form_configs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_activity_logs` ADD CONSTRAINT `admin_activity_logs_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spherical_configurations` ADD CONSTRAINT `spherical_configurations_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spherical_configurations` ADD CONSTRAINT `spherical_configurations_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spherical_configurations` ADD CONSTRAINT `spherical_configurations_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `astigmatism_configurations` ADD CONSTRAINT `astigmatism_configurations_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `astigmatism_configurations` ADD CONSTRAINT `astigmatism_configurations_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `astigmatism_configurations` ADD CONSTRAINT `astigmatism_configurations_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_lens_configurations` ADD CONSTRAINT `contact_lens_configurations_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_lens_configurations` ADD CONSTRAINT `contact_lens_configurations_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_lens_configurations` ADD CONSTRAINT `contact_lens_configurations_sub_category_id_fkey` FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
