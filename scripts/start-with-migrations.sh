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

# Run migrations
echo "📦 Running database migrations..."
if npx prisma migrate deploy; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migration failed or already applied"
  # Don't exit - some migrations might already be applied
fi

# Regenerate Prisma Client (in case schema changed)
echo "🔄 Regenerating Prisma Client..."
npx prisma generate

# Start the application
echo "🎯 Starting server..."
exec node server.js
