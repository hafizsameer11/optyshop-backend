#!/bin/sh
# Robust database deployment script
# Handles both fresh databases and existing databases with migrations

set -e

echo "🚀 Starting database deployment..."

# Check if database has any tables
echo "🔍 Checking database state..."
if npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SHOW TABLES;" 2>/dev/null | grep -q "banners\|users\|products"; then
  echo "📊 Database has existing tables, attempting migrations..."
  
  # Try to run migrations first
  if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully"
  else
    echo "⚠️  Migrations failed, trying schema sync..."
    # Fallback to schema push if migrations fail
    if npx prisma db push; then
      echo "✅ Schema synchronized successfully"
    else
      echo "❌ Both migrations and schema push failed"
      exit 1
    fi
  fi
else
  echo "🆕 Database is empty, using schema push..."
  # For empty databases, use db push to create full schema
  if npx prisma db push; then
    echo "✅ Database schema created successfully"
  else
    echo "❌ Schema push failed"
    exit 1
  fi
fi

# Regenerate Prisma Client
echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo "✅ Database deployment completed"
