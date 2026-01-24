# 🚀 Deploy Instructions - Fix Brand Error

## Current Status
✅ All fixes have been pushed to GitHub (commit: 53f0dbc)  
✅ Server-side endpoints are ready  
✅ Emergency fix tools are available  

## What You Need to Do

### Step 1: Deploy Latest Code
Deploy the latest code from the `main` branch to your production server.

### Step 2: Fix the Database (Choose ONE method)

#### Method A: Web Interface (Easiest)
1. Open: `https://your-api.com/emergency-fix.html`
2. Enter secret key: `optyshop_emergency_fix_2024`
3. Click "Fix Database"
4. Wait for completion

#### Method B: API Call
```bash
curl -X POST https://your-api.com/api/emergency/fix-database \
  -H "Content-Type: application/json" \
  -d '{"secret_key": "optyshop_emergency_fix_2024"}'
```

#### Method C: Admin Endpoint (if you have admin token)
```bash
curl -X POST https://your-api.com/api/admin/database/fix-schema \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Step 3: Restart Application
```bash
pm2 restart all
# OR
docker-compose restart
# OR
docker restart your-container-name
```

### Step 4: Verify Fix
1. Test: `https://your-api.com/api/admin/products?page=1&limit=12`
2. Check: `https://optyshop-frontend.hmstech.org` should load products
3. No more 500 errors!

## What Gets Fixed

✅ **brands table** - Created if missing  
✅ **brand_id column** - Added to products table  
✅ **Foreign keys** - Proper relationships established  
✅ **Contact lens fields** - Brand-related columns added  
✅ **Product variants** - Size/volume table created  
✅ **Schema validation** - Tests ensure everything works  

## Emergency Information

- **Secret Key**: `optyshop_emergency_fix_2024`
- **Emergency URL**: `/api/emergency/fix-database`
- **Admin URL**: `/api/admin/database/fix-schema`
- **Status Check**: `/api/admin/database/status`

## Security Notes

- Change the default secret key by setting `EMERGENCY_FIX_SECRET` environment variable
- Remove `emergency-fix.html` from production after use
- The emergency endpoint is rate-limited and logged

## Troubleshooting

If the fix doesn't work:

1. **Check the logs**: Look for database connection errors
2. **Verify permissions**: Ensure database user has ALTER TABLE permissions
3. **Manual SQL**: Use the SQL commands in `QUICK_SERVER_FIX.md`
4. **Contact support**: If all else fails, run the manual database fixes

## Prevention

To avoid this in the future:

1. **Use deployment script**: `./scripts/deploy-database.sh`
2. **Test migrations**: `npx prisma migrate deploy`
3. **Health checks**: Add schema validation to startup
4. **Staging testing**: Test schema changes in staging first

---

**🎯 Expected Result**: The admin products API will work without 500 errors and the frontend will load successfully!
