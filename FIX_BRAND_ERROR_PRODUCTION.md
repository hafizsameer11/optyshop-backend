# 🔥 URGENT: Fix Brand Error in Production

## The Problem
Your production API is returning a 500 error:
```
Invalid `prisma.product.findMany()` invocation in…brand_id` does not exist in the current database.
```

This happens when the frontend at `https://optyshop-frontend.hmstech.org` tries to fetch products from `/api/admin/products`.

## Root Cause
The production database is missing the `brands` table and the `brand_id` column in the `products` table. These were added in recent migrations but haven't been applied to production.

## Quick Fix (Choose One Method)

### Method 1: Run the Automated Fix Script (Recommended)

```bash
# SSH into your production server
ssh user@your-server

# Navigate to your app directory (usually /app)
cd /app

# Run the brand fix script
node fix_brand_production.js

# Restart your application
pm2 restart all
# OR
docker-compose restart
# OR  
docker restart your-container-name
```

### Method 2: Use the Database Deployment Script

```bash
cd /app
# Run the robust deployment script
chmod +x scripts/deploy-database.sh
./scripts/deploy-database.sh

# Restart application
pm2 restart all
```

### Method 3: Manual Prisma Commands

```bash
cd /app

# Try migrations first
npx prisma migrate deploy

# If that fails, sync the schema
npx prisma db push

# Regenerate Prisma Client
npx prisma generate

# Restart application
pm2 restart all
```

### Method 4: Direct SQL (If you have database access)

Connect to your MySQL database and run:

```sql
-- 1. Create brands table
CREATE TABLE IF NOT EXISTS `brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `website_url` varchar(500) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_slug_key` (`slug`),
  KEY `brands_slug_idx` (`slug`),
  KEY `brands_is_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add brand_id column to products table
ALTER TABLE `products` 
ADD COLUMN IF NOT EXISTS `brand_id` int(11) DEFAULT NULL AFTER `sub_category_id`;

-- 3. Add index for brand_id
ALTER TABLE `products` 
ADD INDEX IF NOT EXISTS `products_brand_id_idx` (`brand_id`);

-- 4. Add foreign key constraint
ALTER TABLE `products` 
ADD CONSTRAINT IF NOT EXISTS `products_brand_id_fkey` 
FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Add other missing brand-related columns (if needed)
ALTER TABLE `products` 
ADD COLUMN IF NOT EXISTS `contact_lens_brand` varchar(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `contact_lens_color` varchar(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `contact_lens_material` varchar(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `contact_lens_type` varchar(50) DEFAULT NULL;

-- 6. Create product_size_volumes table (for eye hygiene products)
CREATE TABLE IF NOT EXISTS `product_size_volumes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `size_volume` varchar(50) NOT NULL,
  `pack_type` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `compare_at_price` decimal(10,2) DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT '0',
  `stock_status` enum('in_stock','out_of_stock','on_backorder') NOT NULL DEFAULT 'in_stock',
  `sku` varchar(100) DEFAULT NULL,
  `expiry_date` datetime(3) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_size_volumes_product_id_size_volume_pack_type_key` (`product_id`,`size_volume`,`pack_type`),
  KEY `product_size_volumes_product_id_idx` (`product_id`),
  KEY `product_size_volumes_is_active_idx` (`is_active`),
  CONSTRAINT `product_size_volumes_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Then restart your application.

### Method 5: If Using Docker

```bash
# Execute command inside running container
docker exec -it your-container-name node fix_brand_production.js

# Then restart
docker restart your-container-name

# OR rebuild and restart
docker-compose down
docker-compose up --build -d
```

## Verify Fix

After applying the fix, test the endpoint:

```bash
# Test the products endpoint (should work without auth errors)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     https://your-api.com/api/admin/products?page=1&limit=12

# Or check in your browser/Postman
# The 500 error should be gone!
```

## What This Fix Does

The fix applies these missing migrations:

1. **20250105000000_add_brands_table** - Creates the `brands` table
2. **Brand relationship** - Adds `brand_id` column to `products` table
3. **Contact lens fields** - Adds brand-related columns for contact lenses
4. **20250107000000_add_product_size_volume_variants** - Creates size/variant table

## Why This Happened

- The Prisma schema was updated to include brand relationships
- Migration files exist in `prisma/migrations/` but weren't applied to production
- The deployment process may have skipped migrations or failed silently
- Production database schema is out of sync with the code

## Prevention

Ensure migrations run automatically on every deployment:

### 1. Update Dockerfile
```dockerfile
# Add this to your Dockerfile
COPY prisma ./prisma
COPY scripts ./scripts

# Run database deployment before starting the app
RUN chmod +x scripts/deploy-database.sh
CMD ["sh", "-c", "./scripts/deploy-database.sh && node server.js"]
```

### 2. Update CI/CD Pipeline
Add database deployment step:
```yaml
- name: Deploy Database
  run: |
    chmod +x scripts/deploy-database.sh
    ./scripts/deploy-database.sh
```

### 3. Health Check
Add a database schema health check:
```javascript
// Add to your server startup
const checkDatabaseSchema = async () => {
  try {
    await prisma.product.findMany({ take: 1, include: { brand: true } });
    console.log('✅ Database schema is up to date');
  } catch (error) {
    console.error('❌ Database schema is outdated:', error.message);
    console.log('💡 Run: npx prisma migrate deploy');
  }
};
```

## Testing After Fix

1. **Admin Products API**: Should return products without 500 error
2. **Product Creation**: Should allow selecting brands
3. **Product Management**: Brand relationships should work properly
4. **Frontend**: Product listing should load without errors

## Emergency Contact

If all methods fail, you can:
1. Temporarily remove brand includes from the admin products query
2. Use `npx prisma db push --force-reset` (⚠️ This will reset data!)
3. Contact your database administrator for manual schema updates

---

**⚠️ Important**: Always backup your production database before running schema changes!
