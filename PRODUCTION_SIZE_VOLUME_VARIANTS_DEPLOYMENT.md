# 🚀 Production Deployment Guide - Size/Volume Variants Feature

## Overview
This guide ensures the Size/Volume Variants feature is deployed safely to production without causing errors.

## 📋 Pre-Deployment Checklist

### ✅ Environment Verification
- [ ] Database server is running and accessible
- [ ] `DATABASE_URL` is correctly configured in production
- [ ] Sufficient database permissions (CREATE, ALTER, INDEX)
- [ ] Backup strategy in place

### ✅ Code Verification
- [ ] Latest code is pushed to main branch
- [ ] Migration file exists: `prisma/migrations/20250125000000_add_product_size_volume_variants/`
- [ ] Production deployment script is ready

## 🚀 Deployment Steps

### Step 1: Prepare Production Environment
```bash
# SSH into your production server
ssh your-server

# Navigate to application directory
cd /path/to/optyshop/backend

# Pull latest code
git pull origin main

# Set production environment
export NODE_ENV=production
```

### Step 2: Run Production Deployment Script
```bash
# Make script executable
chmod +x deploy-size-volume-variants-production.sh

# Run deployment
./deploy-size-volume-variants-production.sh
```

**What the script does:**
- 🔍 Safety checks (production mode, DB connection)
- 💾 Creates automatic backup
- 📦 Applies migration safely
- 🔄 Regenerates Prisma client
- 🧪 Verifies deployment success

### Step 3: Restart Application
```bash
# Using PM2
pm2 restart all

# Using Docker
docker-compose restart

# Using systemctl
sudo systemctl restart optyshop
```

### Step 4: Verify Deployment
```bash
# Check migration status
npx prisma migrate status

# Test table exists
npx prisma db execute --stdin <<< "DESCRIBE product_size_volumes;"

# Test API endpoint
curl -X GET "https://your-api.com/api/products" | head -20
```

## 🧪 Post-Deployment Testing

### Test 1: Admin API
```bash
# Test creating product with variants
curl -X POST "https://your-api.com/api/admin/products" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Eye Drops",
    "product_type": "eye_hygiene",
    "sizeVolumeVariants": [
      {
        "size_volume": "5ml",
        "price": 8.00,
        "stock_quantity": 50
      }
    ]
  }'
```

### Test 2: Frontend API
```bash
# Test product retrieval includes variants
curl -X GET "https://your-api.com/api/products/YOUR_PRODUCT_ID" | jq '.data.product.size_volume_variants'
```

### Test 3: Database Integrity
```bash
# Verify foreign key constraints
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM product_size_volumes;"

# Check indexes
npx prisma db execute --stdin <<< "SHOW INDEX FROM product_size_volumes;"
```

## 🚨 Emergency Procedures

### If Migration Fails
1. **Check logs**: `tail -f logs/application.log`
2. **Verify backup**: `ls -la production_backup_*.sql`
3. **Manual rollback**: See rollback section below

### If API Errors Occur
1. **Check Prisma client**: `npx prisma generate`
2. **Verify table**: `npx prisma db execute --stdin <<< "DESCRIBE product_size_volumes;"`
3. **Restart application**: `pm2 restart all`

## 🔄 Rollback Plan

### Option 1: SQL Rollback (Fast)
```bash
# Apply rollback script
mysql -hHOST -uUSER -p DB_NAME < rollback-size-volume-variants.sql

# Regenerate client
npx prisma generate

# Restart app
pm2 restart all
```

### Option 2: Backup Restore (Complete)
```bash
# Find latest backup
BACKUP_FILE=$(ls -t production_backup_*.sql | head -1)

# Restore backup
mysql -hHOST -uUSER -p DB_NAME < $BACKUP_FILE

# Regenerate client
npx prisma generate

# Restart app
pm2 restart all
```

## 📊 Monitoring & Verification

### Health Check Endpoints
- **Database Status**: `GET /api/admin/database/status`
- **Product API**: `GET /api/products`
- **Admin Products**: `GET /api/admin/products`

### Key Metrics to Monitor
- ✅ No 500 errors on product endpoints
- ✅ Size/Volume variants appear in API responses
- ✅ Admin panel can create products with variants
- ✅ Frontend displays variant selection

## 🔧 Troubleshooting

### Common Issues

#### Issue: Migration timeout
```bash
# Solution: Increase timeout or run manually
npx prisma migrate deploy --timeout 60000
```

#### Issue: Foreign key constraint fails
```bash
# Solution: Check products table integrity
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM products;"
```

#### Issue: Prisma client outdated
```bash
# Solution: Regenerate client
npx prisma generate
```

## 📝 Deployment Checklist (Copy & Paste)

```
[ ] SSH into production server
[ ] cd /path/to/optyshop/backend
[ ] git pull origin main
[ ] export NODE_ENV=production
[ ] chmod +x deploy-size-volume-variants-production.sh
[ ] ./deploy-size-volume-variants-production.sh
[ ] pm2 restart all
[ ] npx prisma migrate status
[ ] Test: curl -X GET "https://your-api.com/api/products"
[ ] Test admin product creation
[ ] Verify frontend variant display
[ ] Monitor logs for 10 minutes
```

## 🎯 Success Criteria

Deployment is successful when:
- ✅ Migration applied without errors
- ✅ Application starts without database errors
- ✅ Product endpoints return 200 status
- ✅ Size/Volume variants appear in API responses
- ✅ Admin panel can manage variants
- ✅ Frontend shows variant selection

## 📞 Support

If issues occur:
1. Check application logs
2. Verify database connectivity
3. Run rollback if necessary
4. Contact support with error logs

---

**⚠️ Important**: Always test in staging first! Never deploy to production without thorough testing.
