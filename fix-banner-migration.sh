#!/bin/bash

echo "🔧 Deploying banner page_type migration to fix production issue..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set!"
    echo "Please run: export DATABASE_URL='your_database_url'"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Apply the specific migration that adds page_type to banners
echo "📦 Applying banner page_type migration..."
npx prisma migrate deploy --name 20260113015558_add_banner_page_type_and_category_associations

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    
    # Regenerate Prisma Client to ensure it's up to date
    echo "🔄 Regenerating Prisma Client..."
    npx prisma generate --force
    
    if [ $? -eq 0 ]; then
        echo "✅ Prisma Client regenerated successfully!"
        echo "🎉 Production database is now up to date!"
        echo "📝 The banner page_type error should now be resolved."
    else
        echo "❌ Failed to regenerate Prisma Client"
        exit 1
    fi
else
    echo "❌ Failed to apply migration"
    exit 1
fi
