# 🔥 URGENT: Fix Banner Error in Production

## The Problem
Your production database is missing the `page_type` column in the `banners` table.

## Quick Fix (Choose One Method)

### Method 1: Run the Fix Script (Easiest)

```bash
# SSH into your production server
ssh user@your-server

# Navigate to your app directory (usually /app)
cd /app

# Run the fix script
node scripts/fix_banner_production.js

# Restart your application
pm2 restart all
# OR
docker-compose restart
# OR  
docker restart your-container-name
```

### Method 2: Use Prisma Migrate Deploy

```bash
cd /app
npx prisma migrate deploy
npx prisma generate
# Restart application
```

### Method 3: Direct SQL (If you have database access)

Connect to your MySQL database and run:

```sql
ALTER TABLE `banners` 
ADD COLUMN `page_type` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home',
ADD COLUMN `category_id` INTEGER NULL,
ADD COLUMN `sub_category_id` INTEGER NULL;

CREATE INDEX `banners_page_type_idx` ON `banners`(`page_type`);
CREATE INDEX `banners_category_id_idx` ON `banners`(`category_id`);
CREATE INDEX `banners_sub_category_id_idx` ON `banners`(`sub_category_id`);
CREATE INDEX `banners_page_type_category_id_sub_category_id_idx` ON `banners`(`page_type`, `category_id`, `sub_category_id`);

ALTER TABLE `banners` 
ADD CONSTRAINT `banners_category_id_fkey` 
FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `banners` 
ADD CONSTRAINT `banners_sub_category_id_fkey` 
FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;
```

Then restart your application.

### Method 4: If Using Docker

```bash
# Execute command inside running container
docker exec -it your-container-name node scripts/fix_banner_production.js

# Then restart
docker restart your-container-name
```

## Verify Fix

After applying the fix, test the endpoint:
```bash
curl https://your-api.com/api/banners
```

Or check in your browser/Postman. The error should be gone!

## Why This Happened

The Prisma schema was updated to include `page_type`, but the database migration wasn't applied to production. The migration exists in `prisma/migrations/20260113015558_add_banner_page_type_and_category_associations/` but needs to be executed.

## Prevention

Make sure migrations run automatically on deployment. Your Dockerfile already has:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'Migrations skipped or already applied' && node server.js"]
```

If migrations aren't running, check:
1. Migration files are included in the Docker image
2. DATABASE_URL is correctly set in production
3. Database user has ALTER TABLE permissions
