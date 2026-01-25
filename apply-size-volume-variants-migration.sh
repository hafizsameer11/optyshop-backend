#!/bin/bash

# Size/Volume Variants Database Migration Script
# This script applies the required migration for the Size/Volume Variants feature

echo "🚀 Applying Size/Volume Variants migration..."

# Check if database is running
echo "📡 Checking database connection..."
npx prisma db pull --skip-generate

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
    
    # Apply the migration
    echo "📦 Applying migration..."
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration applied successfully!"
        
        # Regenerate Prisma client
        echo "🔄 Regenerating Prisma client..."
        npx prisma generate
        
        echo "🎉 Size/Volume Variants feature is now ready!"
    else
        echo "❌ Migration failed. Please check the error above."
        exit 1
    fi
else
    echo "❌ Database connection failed. Please ensure your database server is running."
    echo "💡 Start your database server and run this script again."
    exit 1
fi
