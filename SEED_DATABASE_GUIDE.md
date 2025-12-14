# Seed Database - Fix "No prescription lens types found"

## 🎯 Problem

You're seeing this error:
```
⚠️ [API] No prescription lens types found in database.
→ Please add prescription lens types in admin panel
```

This happens because the database doesn't have any prescription lens types yet.

---

## ✅ Solution: Run Database Seed

The seed script has been updated to automatically create:
- ✅ Distance Vision (single_vision)
- ✅ Near Vision (single_vision)
- ✅ Progressive (progressive) with 3 variants:
  - Premium Progressive ($150, recommended)
  - Standard Progressive ($100)
  - Basic Progressive ($75)

---

## 🚀 Quick Fix - Run Seed Script

### Option 1: Using Prisma (Recommended)

```bash
npx prisma db seed
```

### Option 2: Using Node Directly

```bash
node prisma/seed.js
```

### Option 3: Using npm script (if configured)

```bash
npm run seed
```

---

## 📋 What the Seed Script Does

1. **Cleans existing data** (optional - can be commented out)
2. **Creates admin user:**
   - Email: `admin@optyshop.com`
   - Password: `admin123`

3. **Creates test customer:**
   - Email: `customer@test.com`
   - Password: `customer123`

4. **Creates Prescription Lens Types:**
   - Distance Vision
   - Near Vision
   - Progressive

5. **Creates Progressive Variants:**
   - Premium Progressive ($150, recommended)
   - Standard Progressive ($100)
   - Basic Progressive ($75)

6. **Creates other data:**
   - Categories
   - Products
   - Lens types
   - Lens coatings
   - Frame sizes
   - And more...

---

## 🔍 Verify Seed Worked

After running the seed, test the API:

### Test 1: Get All Lens Types

```bash
GET http://localhost:5000/api/products/configuration/lens-types
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "lensTypes": [
      {
        "id": 1,
        "name": "Distance Vision",
        "slug": "distance-vision",
        "prescriptionType": "single_vision"
      },
      {
        "id": 2,
        "name": "Near Vision",
        "slug": "near-vision",
        "prescriptionType": "single_vision"
      },
      {
        "id": 3,
        "name": "Progressive",
        "slug": "progressive",
        "prescriptionType": "progressive",
        "variants": [
          {
            "id": 1,
            "name": "Premium Progressive",
            "price": 150.00,
            "isRecommended": true
          },
          {
            "id": 2,
            "name": "Standard Progressive",
            "price": 100.00,
            "isRecommended": false
          },
          {
            "id": 3,
            "name": "Basic Progressive",
            "price": 75.00,
            "isRecommended": false
          }
        ]
      }
    ]
  }
}
```

### Test 2: Get Product Configuration

```bash
GET http://localhost:5000/api/products/89/configuration
```

Should now return prescription lens types with variants!

---

## 🛠️ Troubleshooting

### Error: "Cannot find module '@prisma/client'"

**Fix:**
```bash
npm install
npx prisma generate
```

### Error: "Database connection failed"

**Fix:**
1. Check your `.env` file has correct `DATABASE_URL`
2. Make sure your database is running
3. Run migrations first: `npx prisma migrate dev`

### Error: "Table doesn't exist"

**Fix:**
Run migrations first:
```bash
npx prisma migrate dev
```

Then run seed:
```bash
npx prisma db seed
```

---

## 📝 Manual Alternative (If Seed Doesn't Work)

If you prefer to add data manually via API:

### Step 1: Login as Admin

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@optyshop.com",
  "password": "admin123"
}
```

Save the `token` from response.

### Step 2: Create Prescription Lens Types

Use the Postman collection:
- `Admin > Prescription Lens Types (Admin) > Create Prescription Lens Type`

Create:
1. Distance Vision
2. Near Vision
3. Progressive

### Step 3: Create Progressive Variants

Use the Postman collection:
- `Admin > Prescription Lens Variants (Admin) > Create Prescription Lens Variant`

Create:
1. Premium Progressive
2. Standard Progressive
3. Basic Progressive

See `ADMIN_QUICK_START_PROGRESSIVE.md` for detailed steps.

---

## ✅ After Seeding

1. ✅ Restart your backend server (if running)
2. ✅ Refresh your frontend
3. ✅ The error should be gone!
4. ✅ Progressive variants will appear on the selection page

---

## 🎯 Summary

**Quick Fix:**
```bash
npx prisma db seed
```

This will:
- ✅ Create all prescription lens types
- ✅ Create progressive variants
- ✅ Fix the "No prescription lens types found" error
- ✅ Make variants appear on frontend

**That's it!** 🎉

