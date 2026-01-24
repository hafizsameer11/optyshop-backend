#!/bin/sh

# Production Database Migration Script
# This script runs automatically when Docker container starts

echo "🚀 Starting production database migration process..."

# Wait for database to be ready (important for container startup)
echo "⏳ Waiting for database connection..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "🔄 Database not ready, waiting 5 seconds..."
  sleep 5
done

echo "✅ Database is ready!"

# Apply any pending migrations
echo "📦 Applying pending migrations..."
if npx prisma migrate deploy; then
  echo "✅ Migrations applied successfully!"
else
  echo "⚠️  Migration deployment failed, trying schema push..."
  # If migrate deploy fails, try db push as fallback
  if npx prisma db push --accept-data-loss; then
    echo "✅ Schema pushed successfully!"
  else
    echo "❌ Both migration and schema push failed!"
    exit 1
  fi
fi

# Generate Prisma Client to ensure it matches the database
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "🎉 Database setup complete! Starting application..."
