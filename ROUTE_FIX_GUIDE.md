# Route Fix Guide - Lens Thickness Endpoints

## ✅ Routes Are Properly Configured

The routes are correctly set up in `routes/admin.js`. The issue is likely one of the following:

---

## 🔍 Common Issues & Solutions

### Issue 1: Missing `/api` Prefix

**❌ Wrong URL:**
```
/admin/lens-thickness-materials?page=1&limit=1000&isActive=true
```

**✅ Correct URL:**
```
/api/admin/lens-thickness-materials?page=1&limit=1000&isActive=true
```

**Note:** All admin routes require the `/api` prefix because they're mounted at `/api/admin` in `server.js`.

---

### Issue 2: Server Not Restarted

After adding new routes, you **must restart the server**:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
# or
node server.js
```

---

### Issue 3: Missing Authorization Header

All admin endpoints require authentication:

```
Authorization: Bearer <your_admin_token>
```

---

## 📋 Correct Endpoint URLs

### Lens Thickness Materials (Admin)

**Get All:**
```
GET /api/admin/lens-thickness-materials?page=1&limit=1000&isActive=true
Headers: Authorization: Bearer <admin_token>
```

**Get by ID:**
```
GET /api/admin/lens-thickness-materials/:id
Headers: Authorization: Bearer <admin_token>
```

**Create:**
```
POST /api/admin/lens-thickness-materials
Headers: 
  Authorization: Bearer <admin_token>
  Content-Type: application/json
Body: {
  "name": "Unbreakable (Plastic)",
  "price": 30.00,
  "is_active": true
}
```

**Update:**
```
PUT /api/admin/lens-thickness-materials/:id
Headers: 
  Authorization: Bearer <admin_token>
  Content-Type: application/json
```

**Delete:**
```
DELETE /api/admin/lens-thickness-materials/:id
Headers: Authorization: Bearer <admin_token>
```

---

### Lens Thickness Options (Admin)

**Get All:**
```
GET /api/admin/lens-thickness-options?page=1&limit=1000&isActive=true
Headers: Authorization: Bearer <admin_token>
```

**Get by ID:**
```
GET /api/admin/lens-thickness-options/:id
Headers: Authorization: Bearer <admin_token>
```

**Create:**
```
POST /api/admin/lens-thickness-options
Headers: 
  Authorization: Bearer <admin_token>
  Content-Type: application/json
Body: {
  "name": "Thin",
  "thickness_value": 1.5,
  "is_active": true
}
```

**Update:**
```
PUT /api/admin/lens-thickness-options/:id
Headers: 
  Authorization: Bearer <admin_token>
  Content-Type: application/json
```

**Delete:**
```
DELETE /api/admin/lens-thickness-options/:id
Headers: Authorization: Bearer <admin_token>
```

---

## 🧪 Quick Test

### Test with cURL (Windows PowerShell)

```powershell
# Get admin token first (login)
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"password123"}'

$token = $loginResponse.data.access_token

# Test lens thickness materials endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/lens-thickness-materials?page=1&limit=10" `
  -Method GET `
  -Headers @{Authorization="Bearer $token"}
```

### Test with Postman

1. **Set Base URL:** `http://localhost:5000`
2. **Set Admin Token:** In Authorization tab, select "Bearer Token" and paste your admin token
3. **Request URL:** `{{base_url}}/api/admin/lens-thickness-materials?page=1&limit=10`
4. **Method:** GET

---

## 🔧 Verification Steps

1. ✅ **Check routes are loaded:**
   ```bash
   node test-lens-thickness-routes.js
   ```

2. ✅ **Verify server is running:**
   ```bash
   curl http://localhost:5000/health
   ```

3. ✅ **Check route registration:**
   - Routes are in `routes/admin.js` (lines 362-372)
   - Controller functions are exported from `controllers/lensThicknessController.js`
   - Routes are mounted in `server.js` at `/api/admin`

4. ✅ **Restart server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm start
   ```

---

## 📝 Route Structure

```
server.js
  └── app.use('/api/admin', adminRoutes)
       └── routes/admin.js
            └── router.get('/lens-thickness-materials', getAllLensThicknessMaterials)
```

**Full Path:** `/api/admin/lens-thickness-materials`

---

## ⚠️ Important Notes

1. **Always use `/api` prefix** - All routes are mounted under `/api`
2. **Restart server** after route changes
3. **Include Authorization header** for admin endpoints
4. **Check server logs** for any errors

---

## 🐛 Debugging

If routes still don't work:

1. **Check server logs** for errors
2. **Verify Prisma models exist:**
   ```bash
   npx prisma studio
   # Check if lens_thickness_materials and lens_thickness_options tables exist
   ```

3. **Test route directly:**
   ```javascript
   // In server.js, add temporary route to test
   app.get('/test-thickness', (req, res) => {
     res.json({ message: 'Route test successful' });
   });
   ```

4. **Check middleware order** - Ensure `protect` and `authorize` are before routes

---

The routes are properly configured. Make sure you're using the correct URL with `/api` prefix and restart your server! 🚀

