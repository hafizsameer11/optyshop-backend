#!/bin/bash

echo "🚨 EMERGENCY FIX: Applying banner page_type columns immediately..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set!"
    echo "Please run: export DATABASE_URL='your_database_url'"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Extract database connection details from DATABASE_URL
# Expected format: mysql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "🔧 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"

# Apply the SQL fix directly
echo "📦 Applying banner columns fix..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < fix-banner-columns.sql

if [ $? -eq 0 ]; then
    echo "✅ Database columns added successfully!"
    
    # Regenerate Prisma Client
    echo "🔄 Regenerating Prisma Client..."
    npx prisma generate --force
    
    if [ $? -eq 0 ]; then
        echo "✅ Prisma Client regenerated successfully!"
        echo "🎉 Emergency fix completed!"
        echo "📝 The banner page_type error should now be resolved."
        echo "🔄 Please restart your Docker container to apply changes:"
        echo "   docker stop optyshop-backend"
        echo "   docker rm optyshop-backend" 
        echo "   docker run -d --name optyshop-backend --restart unless-stopped -p 5000:5000 -v /app/uploads:/app/uploads -e DATABASE_URL=\"$DATABASE_URL\" -e NODE_ENV=production your-image-name:latest"
    else
        echo "❌ Failed to regenerate Prisma Client"
        exit 1
    fi
else
    echo "❌ Failed to apply database changes"
    echo "Please run the SQL manually on your database:"
    echo "mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD $DB_NAME < fix-banner-columns.sql"
    exit 1
fi
