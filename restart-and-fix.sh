#!/bin/bash
# Emergency restart script that applies banner fix and restarts server

echo "🚨 EMERGENCY: Applying banner fix and restarting server..."

# Apply banner column fix
echo "📋 Applying banner column fix..."
npx prisma db execute --stdin << 'EOF'
ALTER TABLE banners ADD COLUMN page_type ENUM('home', 'category', 'subcategory', 'sub_subcategory') NOT NULL DEFAULT 'home';
ALTER TABLE banners ADD COLUMN category_id INTEGER NULL;
ALTER TABLE banners ADD COLUMN sub_category_id INTEGER NULL;
EOF

# Force regenerate Prisma Client
echo "🔄 Regenerating Prisma Client..."
npx prisma generate --force

# Find and kill the server process
echo "🔄 Restarting server..."
pkill -f "node server.js" || echo "No server process found"

# Wait a moment
sleep 2

# Start server
echo "🎯 Starting server..."
nohup node server.js > server.log 2>&1 &

echo "✅ Emergency fix applied and server restarted!"
echo "📋 Check server.log for startup details"
