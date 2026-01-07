# Fix: Prisma Client Out of Sync Error

## Problem
Error: `The column 'opty_shop.marketing_campaigns.image_url' does not exist in the current database.`

**Root Cause:** Prisma Client was generated before the `image_url` and `link_url` columns were added to the database. Even though the columns now exist in the database, Prisma Client still has the old schema cached.

## Solution

### Step 1: Verify Columns Exist in Database
Run this SQL to confirm:
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'optyshop'
  AND TABLE_NAME = 'marketing_campaigns'
  AND COLUMN_NAME IN ('image_url', 'link_url');
```

Both columns should show up. ✅ (Already verified)

### Step 2: Regenerate Prisma Client on Production

**Option A: SSH into Production Server**
```bash
# SSH into your server
ssh user@your-server

# Navigate to backend directory
cd /app  # or your backend path

# Regenerate Prisma Client
npx prisma generate

# Restart application
pm2 restart all
# OR
docker-compose restart
# OR
sudo systemctl restart your-service
```

**Option B: Docker Container**
```bash
# If using Docker, exec into the container
docker exec -it your-container-name bash

# Inside container:
cd /app
npx prisma generate

# Exit and restart container
exit
docker restart your-container-name
```

**Option C: Docker Compose**
```bash
# If using docker-compose
docker-compose exec backend npx prisma generate
docker-compose restart backend
```

**Option D: Rebuild Docker Image (if Prisma generates during build)**
```bash
# If Prisma Client is generated during Docker build
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Step 3: Verify Fix
After regenerating and restarting, the error should be resolved. Test by:
- Calling `GET /api/admin/campaigns` - should work without errors
- Calling `GET /api/campaigns` - should work without errors

## Quick Fix Script

If you have shell access, you can run this one-liner:

```bash
cd /app && npx prisma generate && pm2 restart all
```

Or for Docker:
```bash
docker exec -it your-container sh -c "cd /app && npx prisma generate" && docker restart your-container
```

## Why This Happens

1. Database schema was updated (columns added)
2. Prisma schema file (`schema.prisma`) was updated
3. But Prisma Client (generated code in `node_modules/@prisma/client`) wasn't regenerated
4. Prisma Client still thinks the old schema is correct

## Prevention

Always regenerate Prisma Client after:
- Running migrations
- Manually adding columns to database
- Updating `schema.prisma` file

```bash
npx prisma generate
```

