# Troubleshooting: "Backend unavailable - Cannot save product"

## ✅ Changes Applied

1. **Improved Logging**: Added detailed console logs to track the request flow
2. **Flexible Validation**: Updated validator to handle string inputs from form-data
3. **Better Error Messages**: Enhanced error handler with more context

## 🔍 Debugging Steps

### 1. Check Server Logs

When you try to create a product, you should see in the console:
```
📦 Creating product - Request received
Body keys: [list of keys]
Files: [list of files]
```

**If you don't see these logs:**
- The request isn't reaching the server
- Check your frontend API URL
- Check CORS settings
- Check if the server is actually running

### 2. Check Browser Console

Open browser DevTools (F12) → Network tab:
- Look for the POST request to `/api/admin/products`
- Check the **Status Code**:
  - `200/201` = Success
  - `400` = Validation error (check Response tab for details)
  - `401` = Authentication error (not logged in or token expired)
  - `403` = Authorization error (not admin)
  - `404` = Route not found
  - `500` = Server error (check server logs)
  - `Network Error` = Can't reach server

### 3. Common Issues

#### Issue: Validation Error
**Symptoms:** Status 400, error message about missing/invalid fields
**Solution:** 
- Check that all required fields are sent: `name`, `sku`, `category_id`, `price`
- Ensure `category_id` is a valid number
- Ensure `price` is a valid number

#### Issue: Authentication Error
**Symptoms:** Status 401
**Solution:**
- Make sure you're logged in
- Check if your token is expired
- Verify the token is being sent in the Authorization header

#### Issue: Network Error
**Symptoms:** "Backend unavailable" or "Network Error"
**Solution:**
- Verify server is running: `netstat -ano | findstr :5000`
- Check frontend API base URL matches backend
- Check CORS configuration in `server.js`
- Try accessing `http://localhost:5000/api` directly in browser

### 4. Test the Endpoint Directly

Use Postman or curl to test:

```bash
curl -X POST http://localhost:5000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "category_id": 1,
    "price": 99.99
  }'
```

### 5. Check Required Fields

Make sure your request includes:
- ✅ `name` (string, 3-255 chars)
- ✅ `sku` (string, 3-100 chars, unique)
- ✅ `category_id` (integer, must exist in database)
- ✅ `price` (number, >= 0)
- Optional: `description`, `slug`, `images`, etc.

## 🚀 Quick Fixes

1. **Restart the server** to load new code changes
2. **Clear browser cache** - old error messages might be cached
3. **Check server console** for detailed error messages
4. **Verify database connection** - ensure Prisma can connect

## 📝 Next Steps

After trying the above:
1. Check the server console for the new log messages
2. Share the error message from the browser Network tab
3. Share any error messages from the server console

This will help identify the exact issue!

