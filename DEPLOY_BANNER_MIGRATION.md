# Deploy Banner Migration to Production

## Quick Fix for Missing `page_type` Column

The banners table needs the `page_type`, `category_id`, and `sub_category_id` columns added. Here's how to fix it on your production server.

## Method 1: Using the Deployment Script (Recommended)

SSH into your production server and run:

```bash
# Navigate to your backend directory
cd /app

# Run the deployment script
npm run deploy-banner-migration

# Restart your application
pm2 restart all
# OR if using Docker:
docker-compose restart
# OR:
docker restart your-container-name
```

## Method 2: Using Prisma Migrate Deploy

```bash
cd /app
npx prisma migrate deploy
npx prisma generate
# Restart application
```

## Method 3: Using the Fix Script

```bash
cd /app
npm run fix-banner-columns
npx prisma generate
# Restart application
```

## Method 4: If Using Docker Container

```bash
# Execute inside the running container
docker exec -it your-container-name npm run deploy-banner-migration

# Or run commands individually
docker exec -it your-container-name npx prisma migrate deploy
docker exec -it your-container-name npx prisma generate

# Restart container
docker restart your-container-name
```

## Method 5: Direct SQL (If you have database access)

Connect to your MySQL database and run:

```sql
-- Add columns if they don't exist
ALTER TABLE `banners` 
ADD COLUMN IF NOT EXISTS `page_type` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home',
ADD COLUMN IF NOT EXISTS `category_id` INTEGER NULL,
ADD COLUMN IF NOT EXISTS `sub_category_id` INTEGER NULL;

-- Create indexes (will fail gracefully if they exist)
CREATE INDEX IF NOT EXISTS `banners_page_type_idx` ON `banners`(`page_type`);
CREATE INDEX IF NOT EXISTS `banners_category_id_idx` ON `banners`(`category_id`);
CREATE INDEX IF NOT EXISTS `banners_sub_category_id_idx` ON `banners`(`sub_category_id`);
CREATE INDEX IF NOT EXISTS `banners_page_type_category_id_sub_category_id_idx` ON `banners`(`page_type`, `category_id`, `sub_category_id`);

-- Add foreign keys (will fail gracefully if they exist)
ALTER TABLE `banners` 
ADD CONSTRAINT `banners_category_id_fkey` 
FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `banners` 
ADD CONSTRAINT `banners_sub_category_id_fkey` 
FOREIGN KEY (`sub_category_id`) REFERENCES `subcategories`(`id`) 
ON DELETE CASCADE ON UPDATE CASCADE;
```

**Note:** MySQL doesn't support `IF NOT EXISTS` for ALTER TABLE, so you may need to check first or handle errors.

After running SQL manually:
```bash
cd /app
npx prisma generate
# Restart application
```

## Verify the Fix

After applying the migration and restarting:

1. **Check the logs** - The error should be gone
2. **Test the API endpoint:**
   ```bash
   curl https://your-api.com/api/banners
   ```
3. **Check the admin panel** - Banners should load without errors

## Troubleshooting

### Migration Already Applied But Still Getting Errors

If the migration shows as applied but you still get errors:

1. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Restart the application** (this is critical!)

3. **Check Prisma Client cache:**
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

### Migration Fails with Permission Errors

Make sure your database user has the following permissions:
- `ALTER` on the `banners` table
- `CREATE INDEX`
- `REFERENCES` for foreign keys

### Docker: Migration Not Running on Startup

Your Dockerfile should have this in the CMD:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'Migrations skipped or already applied' && node server.js"]
```

Make sure:
- Migration files are copied into the Docker image
- `DATABASE_URL` environment variable is set correctly
- Database is accessible from the container

## What This Migration Does

This migration adds:
- `page_type` - ENUM field to specify which page the banner appears on (home, category, subcategory, sub_subcategory)
- `category_id` - Foreign key to categories table
- `sub_category_id` - Foreign key to subcategories table
- Indexes for better query performance
- Foreign key constraints for data integrity

Existing banners will automatically get `page_type = 'home'` as the default value.
