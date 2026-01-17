-- Emergency banner column fix - run this directly on production database
-- This will add the missing page_type, category_id, and sub_category_id columns

ALTER TABLE banners ADD COLUMN page_type ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home';
ALTER TABLE banners ADD COLUMN category_id INTEGER NULL;
ALTER TABLE banners ADD COLUMN sub_category_id INTEGER NULL;

-- Create indexes for performance
CREATE INDEX banners_page_type_idx ON banners(page_type);
CREATE INDEX banners_category_id_idx ON banners(category_id);
CREATE INDEX banners_sub_category_id_idx ON banners(sub_category_id);

-- Add foreign key constraints (will fail if categories don't exist, but that's OK)
ALTER TABLE banners ADD CONSTRAINT banners_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE banners ADD CONSTRAINT banners_sub_category_id_fkey FOREIGN KEY (sub_category_id) REFERENCES subcategories(id) ON DELETE CASCADE ON UPDATE CASCADE;
