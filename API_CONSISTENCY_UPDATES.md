# API Consistency Updates - Summary

This document summarizes the updates made to ensure consistency across backend, admin-panel, and OptyShop frontend.

## Changes Made

### 1. Prisma Schema Updates
- **Added 'staff' role to UserRole enum**: Updated `backend/prisma/schema.prisma` to include `staff` role alongside `customer` and `admin`
  - This allows staff members to access admin routes alongside admins

### 2. Backend Route Updates

#### Coupon Apply Endpoint (NEW)
- **Created**: `backend/routes/coupons.js` - New public route for coupon application
- **Endpoint**: `POST /api/coupons/apply` (Public, optional auth)
- **Controller**: Added `applyCoupon` function to `backend/controllers/marketingController.js`
- **Features**:
  - Validates coupon code
  - Checks coupon active status and date validity
  - Validates minimum order amount
  - Calculates discount based on type (percentage, fixed_amount, free_shipping, bogo)
  - Returns discount details

#### Authorization Updates
- **Updated all admin routes** to allow both `admin` and `staff` roles:
  - `backend/routes/admin.js`
  - `backend/routes/cms.js`
  - `backend/routes/marketing.js`
  - `backend/routes/analytics.js`
  - `backend/routes/overview.js`
  - `backend/routes/simulations.js` (admin config routes)
  - `backend/routes/prescriptions.js` (validate/verify routes)
  - `backend/routes/orders.js` (status/refund/assign-technician routes)

- **Added helper**: `authorizeAdmin()` in `backend/middleware/auth.js` (for future use)

### 3. Server Configuration
- **Added coupon routes** to `backend/server.js`:
  - Registered `/api/coupons` route
  - Added to API info endpoint
  - Added to double `/api/api` fallback routes

### 4. Postman Collection Updates
- **Added Coupon Apply endpoint** to `backend/OptyShop_API.postman_collection.json`:
  - New "Coupons" section with "Apply Coupon" request
  - Placed between "Cart" and "Orders" sections
  - Includes example request body with code, subtotal, and cartItems

### 5. Frontend Configuration Verification

#### OptyShop (Public Website)
- ✅ `OptyShop/src/config/apiRoutes.ts` - Already includes:
  - Coupon apply endpoint (`COUPONS.APPLY`)
  - All public product/category routes
  - All simulation calculation routes
  - All CMS GET routes
  - No admin routes (correct)

#### Admin Panel
- ✅ `admin-panel/src/config/apiRoutes.js` - Already includes:
  - All admin routes
  - All marketing routes
  - All CMS routes (GET public, write admin)
  - All analytics routes
  - No public coupon apply (correct - admin doesn't need it)

## Route Summary

### Public Routes (No Auth)
- `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`
- `/api/products/*` (all GET)
- `/api/categories/*` (all GET)
- `/api/simulations/*` (calculation endpoints only)
- `/api/case-studies/*`
- `/api/blog/*`
- `/api/jobs/*`
- `/api/forms/*`
- `/api/cms/*` (GET only: banners, blog, faqs, pages, testimonials)
- `/api/coupons/apply` (NEW)
- `/health`, `/api`

### Customer Auth Required (`access_token`)
- `/api/auth/me`, `/api/auth/profile`, `/api/auth/change-password`, `/api/auth/logout`
- `/api/cart/*` (all endpoints)
- `/api/orders` (create, list, get, cancel)
- `/api/prescriptions/*` (CRUD operations)

### Admin/Staff Auth Required (`admin_token`)
- `/api/admin/*` (all endpoints)
- `/api/marketing/*` (all endpoints)
- `/api/analytics/*` (all endpoints)
- `/api/overview` (all endpoints)
- `/api/cms/*` (POST/PUT/DELETE only)
- `/api/simulations/config`, `/api/simulations/vto-*` (admin config routes)
- `/api/orders/:id/status`, `/api/orders/:id/refund`, `/api/orders/:id/assign-technician`
- `/api/prescriptions/validate`, `/api/prescriptions/:id/verify`

## Next Steps

1. **Database Migration**: Run Prisma migration to add 'staff' role to UserRole enum:
   ```bash
   cd backend
   npx prisma migrate dev --name add_staff_role
   ```

2. **Testing**: Test the new coupon apply endpoint:
   - Test with valid coupon code
   - Test with invalid/expired coupon
   - Test with minimum order amount validation
   - Test discount calculations (percentage, fixed_amount)

3. **Frontend Integration**: 
   - OptyShop frontend can now use `API_ROUTES.COUPONS.APPLY` endpoint
   - Admin panel routes already configured correctly

## Notes

- All admin routes now support both `admin` and `staff` roles
- Coupon apply endpoint is public but uses `optionalAuth` middleware to support user-specific limits in the future
- Postman collection is now fully aligned with backend implementation
- Frontend configs are already aligned and don't need updates

