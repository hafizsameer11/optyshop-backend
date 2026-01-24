# 🚀 Quick Server Fix for Brand Error

## Problem
Production server shows: `brand_id does not exist in the current database` when accessing `/api/admin/products`

## Solution Options

### Option 1: Use Emergency Fix Endpoint (Recommended)

1. **Deploy the updated code** to your production server
2. **Open the emergency fix page**: `https://your-api.com/emergency-fix.html`
3. **Enter the secret key**: `optyshop_emergency_fix_2024`
4. **Click "Fix Database"**
5. **Restart your application**: `pm2 restart all`

### Option 2: Use API Directly

```bash
curl -X POST https://your-api.com/api/emergency/fix-database \
  -H "Content-Type: application/json" \
  -d '{"secret_key": "optyshop_emergency_fix_2024"}'
```

### Option 3: Use Admin Endpoint (Requires Auth)

```bash
curl -X POST https://your-api.com/api/admin/database/fix-schema \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Option 4: Manual Database Access

If you have direct database access, run:

```sql
-- Create brands table
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

-- Add brand_id to products
ALTER TABLE `products` 
ADD COLUMN IF NOT EXISTS `brand_id` int(11) DEFAULT NULL;

-- Add index and foreign key
ALTER TABLE `products` 
ADD INDEX IF NOT EXISTS `products_brand_id_idx` (`brand_id`);

ALTER TABLE `products` 
ADD CONSTRAINT IF NOT EXISTS `products_brand_id_fkey` 
FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;
```

## What the Fix Does

✅ Creates the `brands` table if it doesn't exist  
✅ Adds the `brand_id` column to the `products` table  
✅ Creates proper foreign key relationships  
✅ Adds brand-related columns for contact lenses  
✅ Creates the `product_size_volumes` table  
✅ Tests the schema to ensure it works  

## After Fix

1. **Restart your application**: `pm2 restart all` or `docker restart container`
2. **Test the endpoint**: Visit `https://your-api.com/api/admin/products?page=1&limit=12`
3. **Check frontend**: The products should load without 500 errors

## Verification

The fix should resolve these errors:
- ❌ `brand_id does not exist in the current database`
- ❌ `Invalid prisma.product.findMany() invocation`
- ❌ 500 Internal Server Error on `/api/admin/products`

## Security Notes

- The emergency endpoint requires a secret key
- Change the default secret key in production by setting `EMERGENCY_FIX_SECRET` environment variable
- The emergency fix page should be removed from production after use

## Prevention

To prevent this in future deployments:

1. **Ensure migrations run**: `npx prisma migrate deploy`
2. **Use the deployment script**: `./scripts/deploy-database.sh`
3. **Add health checks** to verify schema on startup
4. **Test in staging** before deploying to production

---

**⚠️ Important**: Always backup your database before running schema changes!
