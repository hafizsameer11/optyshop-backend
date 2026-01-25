# Size/Volume Variants Database Migration

## Issue Identified
The Size/Volume Variants feature requires a database migration that hasn't been applied yet. The `ProductSizeVolume` model exists in the Prisma schema but the corresponding database table `product_size_volumes` is missing.

## Solution Applied

### 1. Migration Created
- **File**: `prisma/migrations/20250125000000_add_product_size_volume_variants/migration.sql`
- **Purpose**: Creates the `product_size_volumes` table with all required fields

### 2. Migration Script
- **File**: `apply-size-volume-variants-migration.sh`
- **Purpose**: Automated script to apply the migration when database is available

## Required Actions

### Step 1: Start Database Server
Ensure your MySQL database server is running at `localhost:3306` (or as configured in your `.env` file).

### Step 2: Apply Migration
Run the migration script:
```bash
cd d:\OPTshop\backend
bash apply-size-volume-variants-migration.sh
```

Or manually apply the migration:
```bash
npx prisma migrate deploy
npx prisma generate
```

### Step 3: Verify Migration
Check if the migration was applied successfully:
```bash
npx prisma migrate status
```

## Database Schema
The migration creates the `product_size_volumes` table with the following structure:

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `product_id` | INTEGER | Foreign key to products table |
| `size_volume` | VARCHAR(50) | Size/volume (e.g., "5ml", "10ml") |
| `pack_type` | VARCHAR(50) | Pack type (e.g., "Single", "Pack of 2") |
| `price` | DECIMAL(10,2) | Price for this variant |
| `compare_at_price` | DECIMAL(10,2) | Compare at price (optional) |
| `cost_price` | DECIMAL(10,2) | Cost price (optional) |
| `stock_quantity` | INTEGER | Available quantity |
| `stock_status` | ENUM | Stock status (in_stock/out_of_stock/backorder) |
| `sku` | VARCHAR(100) | SKU for variant (optional) |
| `expiry_date` | DATETIME | Expiry date (optional) |
| `is_active` | BOOLEAN | Active status |
| `sort_order` | INTEGER | Display order |

## Features Enabled After Migration
- ✅ Create products with size/volume variants
- ✅ Update product variants
- ✅ Manage individual pricing and stock per variant
- ✅ Frontend variant selection
- ✅ Cart integration with variant tracking

## Testing
After applying the migration, test the feature by:
1. Creating an Eye Hygiene product with variants via admin API
2. Verifying variants appear in frontend API responses
3. Adding variant products to cart

## Troubleshooting
If you encounter issues:
1. Ensure database server is running
2. Check database connection in `.env` file
3. Verify migration was applied: `npx prisma migrate status`
4. Regenerate Prisma client: `npx prisma generate`
