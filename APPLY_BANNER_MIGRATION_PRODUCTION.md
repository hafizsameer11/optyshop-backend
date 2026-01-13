# Apply Banner Migration to Production

The error indicates that the `page_type` column doesn't exist in your production database. You need to apply the migration to production.

## Option 1: Run Migration Script on Production Server

1. **SSH into your production server:**
   ```bash
   ssh user@your-production-server
   ```

2. **Navigate to your backend directory:**
   ```bash
   cd /app  # or wherever your backend is located
   ```

3. **Pull the latest code:**
   ```bash
   git pull origin main
   ```

4. **Run the migration script:**
   ```bash
   node scripts/apply_banner_migration.js
   ```

5. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

6. **Restart your application:**
   ```bash
   pm2 restart all
   # OR
   docker-compose restart
   # OR
   sudo systemctl restart your-service
   ```

## Option 2: Run SQL Directly on Production Database

If you have direct database access, run this SQL:

```sql
-- Add columns if they don't exist
ALTER TABLE `banners` 
ADD COLUMN `page_type` ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home',
ADD COLUMN `category_id` INTEGER NULL,
ADD COLUMN `sub_category_id` INTEGER NULL;

-- Create indexes
CREATE INDEX `banners_page_type_idx` ON `banners`(`page_type`);
CREATE INDEX `banners_category_id_idx` ON `banners`(`category_id`);
CREATE INDEX `banners_sub_category_id_idx` ON `banners`(`sub_category_id`);
CREATE INDEX `banners_page_type_category_id_sub_category_id_idx` ON `banners`(`page_type`, `category_id`, `sub_category_id`);

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

Then register the migration:

```sql
INSERT INTO `_prisma_migrations` 
(`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
SELECT 
    UUID() as id,
    'manual_migration_applied' as checksum,
    NOW() as finished_at,
    '20260113015558_add_banner_page_type_and_category_associations' as migration_name,
    NULL as logs,
    NULL as rolled_back_at,
    NOW() as started_at,
    1 as applied_steps_count
WHERE NOT EXISTS (
    SELECT 1 FROM `_prisma_migrations` 
    WHERE `migration_name` = '20260113015558_add_banner_page_type_and_category_associations'
);
```

After running SQL, regenerate Prisma Client:
```bash
npx prisma generate
```

## Option 3: Using Prisma Migrate Deploy

If you have Prisma CLI access on production:

```bash
npx prisma migrate deploy
```

This will apply any pending migrations.

## Option 4: Using Prisma DB Push (Not recommended for production, but works)

```bash
npx prisma db push
npx prisma generate
```

## Verify Migration

After applying, verify the columns exist:

```sql
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'optyshop' 
AND TABLE_NAME = 'banners'
AND COLUMN_NAME IN ('page_type', 'category_id', 'sub_category_id');
```

All three columns should appear in the results.

## Important Notes

- **Always backup your database** before running migrations in production
- After applying the migration, **restart your application** to reload Prisma Client
- The `page_type` column has a default value of `'home'`, so existing banners will automatically be set to home page type