#!/bin/sh
# Start script that runs migrations before starting the server
# This is used in Docker containers to ensure migrations run on startup

set -e

echo "🚀 Starting application with migrations..."

# Wait for database to be ready (optional, useful for Docker Compose)
if [ -n "$DB_WAIT_TIMEOUT" ]; then
  echo "⏳ Waiting for database to be ready..."
  timeout=$DB_WAIT_TIMEOUT
  until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -le 0 ]; then
      echo "❌ Database connection timeout"
      exit 1
    fi
    echo "   Waiting for database... ($timeout seconds left)"
    sleep 1
  done
  echo "✅ Database is ready"
fi

# Run database deployment
echo "📦 Running database deployment..."
if ./scripts/deploy-database.sh; then
  echo "✅ Database deployment completed successfully"
else
  echo "❌ Database deployment failed"
  exit 1
fi

# Emergency fix: Ensure banner page_type columns exist
echo "🚨 Applying emergency banner columns fix..."
echo "Checking if page_type column exists..."
COLUMN_EXISTS=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banners' AND COLUMN_NAME = 'page_type'" | grep -o '[0-9]' | head -1)

if [ "$COLUMN_EXISTS" = "0" ]; then
  echo "⚠️ page_type column missing, applying fix..."
  npx prisma db execute --stdin < fix-banner-columns.sql
  echo "✅ Banner columns fix applied"
else
  echo "✅ Banner columns already exist"
fi

# Regenerate Prisma Client (critical - ensures client is up to date)
echo "🔄 Regenerating Prisma Client..."
npx prisma generate --force

# Start the application
echo "🎯 Starting server..."
exec node server.js
