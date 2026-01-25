#!/bin/bash

# Production Size/Volume Variants Deployment Script
# This script safely deploys the Size/Volume Variants migration to production

set -e  # Exit on any error

echo "🚀 Starting Size/Volume Variants Production Deployment..."

# Configuration
MIGRATION_NAME="20250125000000_add_product_size_volume_variants"
BACKUP_FILE="production_backup_$(date +%Y%m%d_%H%M%S).sql"

# Safety checks
echo "🔍 Running safety checks..."

# Check if we're in production
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  WARNING: NODE_ENV is not set to 'production'"
    echo "❌ This script should only be run in production"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Deployment cancelled"
        exit 1
    fi
fi

# Check database connection
echo "📡 Testing database connection..."
if ! npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT 1;" >/dev/null 2>&1; then
    echo "❌ Database connection failed"
    echo "💡 Please check your DATABASE_URL and ensure database is running"
    exit 1
fi
echo "✅ Database connection successful"

# Check if migration already exists
echo "🔍 Checking if migration already applied..."
if npx prisma migrate status | grep -q "$MIGRATION_NAME"; then
    echo "✅ Migration already applied"
    echo "🎉 Size/Volume Variants feature is already available"
    exit 0
fi

# Create backup
echo "💾 Creating database backup..."
if command -v mysqldump >/dev/null 2>&1; then
    # Extract database info from DATABASE_URL
    DB_URL="$DATABASE_URL"
    DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DB_URL" | sed -n 's/.*://\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
else
    echo "⚠️  mysqldump not found, skipping backup"
fi

# Check if table already exists (manual deployment)
echo "🔍 Checking if product_size_volumes table exists..."
if npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "DESCRIBE product_size_volumes;" >/dev/null 2>&1; then
    echo "✅ Table already exists, skipping migration"
    echo "🎉 Size/Volume Variants feature is already available"
    exit 0
fi

# Apply migration
echo "📦 Applying Size/Volume Variants migration..."
if npx prisma migrate deploy; then
    echo "✅ Migration applied successfully"
else
    echo "❌ Migration failed, trying manual table creation..."
    
    # Fallback: Create table manually
    echo "🔧 Creating table manually..."
    npx prisma db execute --stdin --schema=prisma/schema.prisma << 'EOF'
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
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

    # Create indexes
    echo "🔧 Creating indexes..."
    npx prisma db execute --stdin --schema=prisma/schema.prisma << 'EOF'
CREATE INDEX `product_size_volumes_product_id_idx` ON `product_size_volumes`(`product_id`);
CREATE INDEX `product_size_volumes_is_active_idx` ON `product_size_volumes`(`is_active`);
CREATE UNIQUE INDEX `product_size_volumes_product_id_size_volume_pack_type_key` ON `product_size_volumes`(`product_id`, `size_volume`, `pack_type`);
EOF

    # Add foreign key
    echo "🔧 Adding foreign key..."
    npx prisma db execute --stdin --schema=prisma/schema.prisma << 'EOF'
ALTER TABLE `product_size_volumes` ADD CONSTRAINT `product_size_volumes_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
EOF

    echo "✅ Manual table creation completed"
fi

# Regenerate Prisma Client
echo "🔄 Regenerating Prisma Client..."
npx prisma generate

# Verify deployment
echo "🔍 Verifying deployment..."
if npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "DESCRIBE product_size_volumes;" >/dev/null 2>&1; then
    echo "✅ Table created successfully"
    
    # Test basic functionality
    echo "🧪 Testing basic functionality..."
    TEST_RESULT=$(npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT COUNT(*) as count FROM product_size_volumes;" 2>/dev/null | tail -1)
    echo "✅ Table is accessible (current records: $TEST_RESULT)"
else
    echo "❌ Table verification failed"
    echo "🚨 DEPLOYMENT FAILED - Please check database logs"
    exit 1
fi

# Clean up
if [ -f "$BACKUP_FILE" ]; then
    echo "💡 Backup file: $BACKUP_FILE"
    echo "🔄 To restore: mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASS $DB_NAME < $BACKUP_FILE"
fi

echo ""
echo "🎉 Size/Volume Variants deployment completed successfully!"
echo ""
echo "✅ Features now available:"
echo "   • Product size/volume variants"
echo "   • Individual pricing per variant"
echo "   • Stock management per variant"
echo "   • Frontend variant selection"
echo "   • Cart integration with variants"
echo ""
echo "🧪 Test the feature:"
echo "   1. Create an Eye Hygiene product with variants"
echo "   2. Check API: GET /api/products/:id"
echo "   3. Verify size_volume_variants array is returned"
echo ""
echo "📝 Next steps:"
echo "   • Restart your application server"
echo "   • Test the admin panel product creation"
echo "   • Verify frontend functionality"
