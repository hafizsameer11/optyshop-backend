# API Testing Guide - OptyShop Backend

## 🔐 Authentication Credentials

### Admin Account
- **Email**: `admin@optyshop.com`
- **Password**: `admin123`

### Customer Account
- **Email**: `customer@test.com`
- **Password**: `customer123`

---

## 📝 Login API - Correct Format

### Endpoint
```
POST http://localhost:5000/api/auth/login
```

### Headers
```
Content-Type: application/json
```

### Request Body (Valid JSON Format)
```json
{
  "email": "admin@optyshop.com",
  "password": "admin123"
}
```

### ✅ Correct Examples

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@optyshop.com\",\"password\":\"admin123\"}"
```

**Using Postman:**
1. Method: **POST**
2. URL: `http://localhost:5000/api/auth/login`
3. Headers: Add `Content-Type: application/json`
4. Body: Select **raw** and **JSON**, then paste:
```json
{
  "email": "admin@optyshop.com",
  "password": "admin123"
}
```

**Using JavaScript (fetch):**
```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@optyshop.com',
    password: 'admin123'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## ❌ Common Mistakes to Avoid

### 1. Invalid JSON Format
❌ **WRONG:**
```
{email: admin@optyshop.com, password: password}
```
✅ **CORRECT:**
```json
{"email": "admin@optyshop.com", "password": "admin123"}
```

### 2. Wrong HTTP Method
❌ **WRONG:** `GET /api/auth/login` (will return 404)
✅ **CORRECT:** `POST /api/auth/login`

### 3. Wrong Password
❌ **WRONG:** `"password": "password"`
✅ **CORRECT:** `"password": "admin123"`

### 4. Missing Content-Type Header
❌ **WRONG:** No header specified
✅ **CORRECT:** `Content-Type: application/json`

---

## 📋 Expected Response

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@optyshop.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "admin",
      "is_active": true,
      "email_verified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

**401 Unauthorized (Wrong Password):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**400 Bad Request (Invalid JSON):**
```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

---

## 🔧 Testing with Browser (Using DevTools)

1. Open Browser DevTools (F12)
2. Go to **Console** tab
3. Run this code:

```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@optyshop.com',
    password: 'admin123'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Success:', data);
  if (data.success) {
    console.log('Token:', data.data.token);
  }
})
.catch(err => console.error('Error:', err));
```

---

## 🎯 Quick Test Checklist

- [ ] Server is running on port 5000
- [ ] Using POST method (not GET)
- [ ] URL is correct: `http://localhost:5000/api/auth/login`
- [ ] Content-Type header is set to `application/json`
- [ ] JSON is properly formatted with quotes around keys and values
- [ ] Email and password match the seeded credentials
- [ ] Database has been seeded (run `npm run prisma:seed`)

---

## 🚀 Other Test Endpoints

### Register New User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "newuser@test.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

### Get Current User (Protected)
```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

### Health Check
```bash
GET http://localhost:5000/health
```

### API Info
```bash
GET http://localhost:5000/api
```

