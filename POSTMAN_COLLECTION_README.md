# Postman Collection Guide

## 📬 Importing the Collection

1. **Open Postman**
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `OptyShop_API.postman_collection.json`
5. Click **Import**

## 🔧 Setting Up Environment Variables

The collection uses these variables:

- `base_url` - API base URL (default: `http://localhost:5000`)
- `access_token` - JWT access token (auto-filled after login)
- `refresh_token` - JWT refresh token (auto-filled after login)
- `admin_token` - Admin JWT token (for admin endpoints)

### To Set Variables:

1. Click on the collection name
2. Go to **Variables** tab
3. Update `base_url` if your server runs on a different port
4. After logging in, copy the token from response and paste into `access_token`

## 🚀 Quick Start

### 1. Test Health Check
- Run **Health Check** request to verify server is running

### 2. Register/Login
- Use **Register** to create a new account
- Or use **Login** with seeded credentials:
  - Email: `customer@test.com`
  - Password: `customer123`

### 3. Save Token
- After login, copy the `token` from response
- Paste it into collection variable `access_token`

### 4. Test Protected Endpoints
- Now you can use any protected endpoint (Cart, Orders, etc.)

## 📋 Collection Structure

### Authentication
- Register
- Login
- Get Current User
- Refresh Token
- Update Profile
- Change Password
- Logout

### Products
- Get All Products (with filters)
- Get Featured Products
- Get Product by ID
- Get Product by Slug
- Get Related Products

### Categories
- Get All Categories
- Get Category by ID
- Get Category by Slug

### Cart
- Get Cart
- Add to Cart
- Update Cart Item
- Remove from Cart
- Clear Cart

### Orders
- Create Order
- Get User Orders
- Get Order by ID
- Cancel Order

### Prescriptions
- Get User Prescriptions
- Create Prescription
- Get Prescription by ID
- Update Prescription
- Delete Prescription

### Simulations
- Calculate PD (Pupillary Distance)
- Calculate Pupillary Height
- Calculate Lens Thickness
- Kids Lens Recommendation
- Lifestyle Recommendation
- Photochromic Simulator
- AR Coating Simulator

### Admin
- Dashboard Stats
- Create Product
- Update Product
- Delete Product
- Get All Orders
- Update Order Status
- Get All Users
- Update User
- Create Category

### Health Check
- Health Check endpoint

## 🔐 Admin Access

To test admin endpoints:

1. Login with admin credentials:
   - Email: `admin@optyshop.com`
   - Password: `admin123` (from seed data)

2. Copy the token and paste into `admin_token` variable

## 💡 Tips

1. **Auto-save tokens**: You can use Postman's **Tests** tab to auto-save tokens:
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       if (jsonData.data && jsonData.data.token) {
           pm.collectionVariables.set("access_token", jsonData.data.token);
       }
   }
   ```

2. **Use Pre-request Scripts**: Add this to collection level to auto-set Authorization header:
   ```javascript
   pm.request.headers.add({
       key: 'Authorization',
       value: 'Bearer ' + pm.collectionVariables.get('access_token')
   });
   ```

3. **Test Data**: Use the seed data for testing:
   - Customer: `customer@test.com` / `customer123`
   - Admin: `admin@optyshop.com` / `admin123`

## 📝 Notes

- All protected endpoints require `Authorization: Bearer <token>` header
- Admin endpoints require admin role token
- Base URL can be changed in collection variables
- Some endpoints accept query parameters for filtering/pagination

---

**Happy Testing! 🎉**

