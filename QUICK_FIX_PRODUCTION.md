# Quick Fix: Apply Banner Migration to Production

The error indicates your production database is missing the `page_type` column. Run these commands on your **production server**:

## Quick Fix (Copy & Paste)

```bash
# 1. SSH into production server
ssh user@your-server

# 2. Navigate to backend directory
cd /app  # or your backend path

# 3. Pull latest code (if needed)
git pull origin main

# 4. Run the fix script
node scripts/fix_banner_migration.js

# 5. Regenerate Prisma Client
npx prisma generate

# 6. Restart application
# Choose one based on your setup:
pm2 restart all
# OR
docker-compose restart
# OR  
docker restart your-container-name
# OR
sudo systemctl restart your-service
```

## Alternative: Use Prisma DB Push

If the script doesn't work, try:

```bash
npx prisma db push
npx prisma generate
# Restart application
```

## Alternative: Direct SQL

If you have direct database access, connect to MySQL and run:

```sql
-- Add columns
ALTER TABLE `banners` 
ADD COLUMN `page_type` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home',
ADD COLUMN `category_id` INTEGER NULL,
ADD COLUMN `sub_category_id` INTEGER NULL;

-- Create indexes
CREATE INDEX `banners_page_type_idx` ON `banners`(`page_type`);
CREATE INDEX `banners_category_id_idx` ON `banners`(`category_id`);
CREATE INDEX `banners_sub_category_id_idx` ON `banners`(`sub_category_id`);

-- Add foreign keys
ALTER TABLE `banners` 
ADD CONSTRAINT `banners_category_id_fkey` 
FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `banners` 
ADD CONSTRAINT `banners_sub_category_id_fkey` 
FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;
```

Then regenerate Prisma Client:
```bash
npx prisma generate
```

## Verify

After applying, test the banners endpoint:
```bash
curl https://your-api.com/api/banners
```

The error should be gone!