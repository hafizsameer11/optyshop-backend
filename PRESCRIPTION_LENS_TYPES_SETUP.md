# Prescription Lens Types Setup Guide

## 🚨 Problem

You're seeing this error:
```
⚠️ Please add prescription lens types in admin panel
⚠️ Make sure at least one type has prescription_type="progressive"
⚠️ Using default fallback options as last resort
```

This happens because the database doesn't have the required prescription lens types.

---

## ✅ Quick Solution

### **Option 1: Run Setup Script (Recommended)**

```bash
npm run setup-prescription-types
```

or

```bash
node scripts/setup-prescription-lens-types.js
```

This script will:
- ✅ Check if prescription lens types exist
- ✅ Create missing types (Distance Vision, Near Vision, Progressive)
- ✅ Create progressive variants (Premium, Standard, Basic)
- ✅ Skip existing types (won't duplicate)

---

### **Option 2: Run Full Database Seed**

```bash
npm run prisma:seed
```

or

```bash
npx prisma db seed
```

This will seed the entire database including prescription lens types.

---

### **Option 3: Create via Admin API**

Use Postman or your API client to create the types:

#### **1. Create Distance Vision**

```bash
POST /api/admin/prescription-lens-types
Authorization: Bearer {{admin_token}}

{
  "name": "Distance Vision",
  "slug": "distance-vision",
  "description": "For distance (Thin, anti-glare, blue-cut options)",
  "prescription_type": "single_vision",
  "base_price": 60.00,
  "is_active": true,
  "sort_order": 1
}
```

#### **2. Create Near Vision**

```bash
POST /api/admin/prescription-lens-types
Authorization: Bearer {{admin_token}}

{
  "name": "Near Vision",
  "slug": "near-vision",
  "description": "For near/reading (Thin, anti-glare, blue-cut options)",
  "prescription_type": "single_vision",
  "base_price": 60.00,
  "is_active": true,
  "sort_order": 2
}
```

#### **3. Create Progressive (REQUIRED)**

```bash
POST /api/admin/prescription-lens-types
Authorization: Bearer {{admin_token}}

{
  "name": "Progressive",
  "slug": "progressive",
  "description": "Progressives (For two powers in same lenses)",
  "prescription_type": "progressive",
  "base_price": 60.00,
  "is_active": true,
  "sort_order": 3
}
```

#### **4. Create Progressive Variants (After creating Progressive type)**

```bash
POST /api/admin/prescription-lens-variants
Authorization: Bearer {{admin_token}}

# Premium Progressive
{
  "prescription_lens_type_id": 3,  // ID of Progressive type
  "name": "Premium Progressive",
  "slug": "premium-progressive",
  "description": "High-quality progressive lenses with advanced technology",
  "price": 150.00,
  "is_recommended": true,
  "viewing_range": "Wide",
  "use_cases": "Maximum comfort & balanced vision",
  "is_active": true,
  "sort_order": 1
}

# Standard Progressive
{
  "prescription_lens_type_id": 3,
  "name": "Standard Progressive",
  "slug": "standard-progressive",
  "description": "Standard progressive lenses for everyday use",
  "price": 100.00,
  "is_recommended": false,
  "viewing_range": "Standard",
  "use_cases": "Perfect for everyday tasks",
  "is_active": true,
  "sort_order": 2
}

# Basic Progressive
{
  "prescription_lens_type_id": 3,
  "name": "Basic Progressive",
  "slug": "basic-progressive",
  "description": "Affordable progressive lens option",
  "price": 75.00,
  "is_recommended": false,
  "viewing_range": "Basic",
  "use_cases": "Budget-friendly option",
  "is_active": true,
  "sort_order": 3
}
```

---

## 📋 Required Prescription Lens Types

The system requires **at least 3 prescription lens types**:

| Type | prescription_type | Required | Description |
|------|-----------------|----------|-------------|
| **Distance Vision** | `single_vision` | ✅ Yes | For distance vision |
| **Near Vision** | `single_vision` | ✅ Yes | For near/reading vision |
| **Progressive** | `progressive` | ✅ **REQUIRED** | For progressive lenses (must exist) |

### **Valid prescription_type Values:**

- `single_vision` - For distance or near vision
- `bifocal` - Bifocal lenses
- `trifocal` - Trifocal lenses
- `progressive` - Progressive lenses (**REQUIRED**)

---

## 🔍 Verify Setup

After running the setup, verify it worked:

### **Test 1: Get All Prescription Lens Types**

```bash
GET /api/prescription-lens-types
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "prescriptionLensTypes": [
      {
        "id": 1,
        "name": "Distance Vision",
        "prescriptionType": "single_vision",
        "basePrice": 60.00
      },
      {
        "id": 2,
        "name": "Near Vision",
        "prescriptionType": "single_vision",
        "basePrice": 60.00
      },
      {
        "id": 3,
        "name": "Progressive",
        "prescriptionType": "progressive",
        "basePrice": 60.00,
        "variants": [
          {
            "id": 1,
            "name": "Premium Progressive",
            "price": 150.00,
            "isRecommended": true
          }
        ]
      }
    ],
    "count": 3
  }
}
```

### **Test 2: Check Admin Panel**

```bash
GET /api/admin/prescription-lens-types
Authorization: Bearer {{admin_token}}
```

Should return all types with pagination.

---

## 🎯 Progressive Variants

After creating the Progressive type, you should create variants:

| Variant | Price | Recommended | Use Case |
|---------|-------|-------------|----------|
| **Premium Progressive** | $150.00 | ✅ Yes | Maximum comfort & balanced vision |
| **Standard Progressive** | $100.00 | ❌ No | Perfect for everyday tasks |
| **Basic Progressive** | $75.00 | ❌ No | Budget-friendly option |

---

## 🚀 Quick Commands

```bash
# Setup prescription lens types only
npm run setup-prescription-types

# Full database seed (includes prescription lens types)
npm run prisma:seed

# Check if types exist
GET /api/prescription-lens-types
```

---

## 📝 Notes

- The setup script is **idempotent** - safe to run multiple times
- It won't create duplicates if types already exist
- Progressive type is **required** for progressive lens functionality
- Variants are optional but recommended for better UX

---

## 🔧 Troubleshooting

### **Error: "No prescription lens types found"**

**Solution:** Run the setup script:
```bash
npm run setup-prescription-types
```

### **Error: "Make sure at least one type has prescription_type='progressive'"**

**Solution:** Create a Progressive type:
```bash
POST /api/admin/prescription-lens-types
{
  "name": "Progressive",
  "prescription_type": "progressive",
  ...
}
```

### **Types exist but frontend still shows error**

**Solution:**
1. Check if types are active: `is_active: true`
2. Restart the backend server
3. Clear frontend cache

---

**Last Updated:** 2025-01-26
**Version:** 1.0.0

