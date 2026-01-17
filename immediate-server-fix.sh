#!/bin/bash

echo "🚨 IMMEDIATE SERVER FIX - Run this on your production server NOW"

echo "Step 1: SSH into your server"
echo "Step 2: Run these commands:"

cat << 'EOF'
# SSH into your server and run:

# 1. Enter the running container
docker exec -it optyshop-backend bash

# 2. Go to app directory
cd /app

# 3. Set DATABASE_URL (replace with your actual database URL)
export DATABASE_URL="mysql://username:password@host:port/database_name"

# 4. Run the immediate database fix
echo "Checking if page_type column exists..."
npx prisma db execute --stdin << 'SQL'
SELECT COUNT(*) as column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'banners' 
  AND COLUMN_NAME = 'page_type';
SQL

# 5. If column doesn't exist, add it
npx prisma db execute --stdin << 'SQL'
ALTER TABLE banners ADD COLUMN page_type ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home';
ALTER TABLE banners ADD COLUMN category_id INTEGER NULL;
ALTER TABLE banners ADD COLUMN sub_category_id INTEGER NULL;
SQL

# 6. Regenerate Prisma Client
npx prisma generate

# 7. Exit container
exit

# 8. Restart container
docker restart optyshop-backend

echo "✅ Fix completed! Check your admin panel in 2-3 minutes."
EOF

echo ""
echo "⚡ QUICK FIX OPTION:"
echo "If you have direct database access, run this SQL directly:"
echo ""
echo "ALTER TABLE banners ADD COLUMN page_type ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home';"
echo "ALTER TABLE banners ADD COLUMN category_id INTEGER NULL;"
echo "ALTER TABLE banners ADD COLUMN sub_category_id INTEGER NULL;"
