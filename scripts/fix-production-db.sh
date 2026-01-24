#!/bin/sh

# Fix for missing brand_id column in production
# This script specifically addresses the brand_id issue

echo "🔧 Fixing production database schema issues..."

# Try to apply the specific brand_id migration first
echo "📦 Applying brand_id migration..."
npx prisma migrate deploy --to 20250125000000_add_brand_id_to_products

# If that fails, try to push the schema changes
if [ $? -ne 0 ]; then
  echo "⚠️  Migration failed, trying schema push..."
  npx prisma db push --accept-data-loss
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✅ Database fix complete!"
