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

# Emergency fix: Ensure banner page_type columns exist BEFORE anything else
echo "🚨 CRITICAL: Checking banner page_type columns..."
npx prisma db execute --stdin << 'EOF'
ALTER TABLE banners ADD COLUMN page_type ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home';
ALTER TABLE banners ADD COLUMN category_id INTEGER NULL;
ALTER TABLE banners ADD COLUMN sub_category_id INTEGER NULL;
EOF 2>/dev/null || echo "✅ Banner columns already exist"

echo "✅ Banner columns check completed"

# Run database deployment
echo "📦 Running database deployment..."
if ./scripts/deploy-database.sh; then
  echo "✅ Database deployment completed successfully"
else
  echo "❌ Database deployment failed"
  exit 1
fi

# Regenerate Prisma Client (critical - ensures client is up to date)
echo "🔄 Regenerating Prisma Client..."
npx prisma generate --force

# Start the application
echo "🎯 Starting server..."
exec node server.js
