# Production Database Schema Fix

## Problem
The production environment was experiencing a 500 error:
```
The column `opty_shop.banners.page_type` does not exist in the current database.
```

## Root Cause
- Production database was empty (no tables)
- Deployment workflow was using `npx prisma migrate deploy` which expects incremental migrations
- Migrations were failing because prerequisite tables didn't exist

## Solution
Added robust database deployment that handles both scenarios:

### 1. New Script: `scripts/deploy-database.sh`
- Detects if database is empty or has existing tables
- Uses `npx prisma db push` for empty databases
- Uses `npx prisma migrate deploy` for existing databases
- Falls back to `db push` if migrations fail

### 2. Updated Files
- **Docker start script**: Now uses robust deployment
- **CI/CD workflow**: Uses new deployment script instead of just migrations
- **Production deployment**: Handles both fresh and existing databases

## Deployment Process
1. **CI/CD Pipeline**: Runs `scripts/deploy-database.sh` during deployment
2. **Docker Container**: Runs same script on container startup
3. **Fallback Logic**: If migrations fail, automatically tries schema push

## Verification
After deployment, the following should work:
- ✅ `/api/banners` - Public banners endpoint
- ✅ `/api/admin/banners` - Admin banners endpoint (with auth)
- ✅ No more `page_type` column errors

## Commands for Manual Testing
```bash
# Test database connection
npx prisma db execute --stdin <<< "SELECT 1;"

# Check if tables exist
npx prisma db execute --stdin <<< "SHOW TABLES;"

# Manual schema sync (if needed)
npx prisma db push
```

## Notes
- This fix is backward compatible
- Works with both fresh and existing databases
- Automatically handles migration failures
- No data loss during deployment
