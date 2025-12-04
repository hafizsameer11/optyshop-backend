# Admin Dashboard - Detailed Flow Documentation

This document provides a comprehensive breakdown of the operational flows within the Admin Dashboard Backend. It details the interaction between API endpoints, controllers, and the database for key system functionalities.

## 1. Authentication & Security Flow

### Overview
The authentication system uses JWT (JSON Web Tokens) for stateless authentication. It supports Access Tokens (short-lived) and Refresh Tokens (long-lived) to maintain secure sessions.

### A. User Registration
*   **Endpoint**: `POST /api/auth/register`
*   **Access**: Public
*   **Flow**:
    1.  **Input Validation**: Checks for required fields (`email`, `password`, `first_name`, `last_name`).
    2.  **Duplicate Check**: Verifies if `email` already exists in `User` table.
    3.  **Password Hashing**: Hashes password using `bcrypt` (salt rounds: 10).
    4.  **User Creation**: Creates new `User` record in database.
    5.  **Token Generation**: Generates `accessToken` and `refreshToken`.
    6.  **Token Storage**: Hashes and stores `refreshToken` in the user's record.
    7.  **Response**: Returns user data (excluding password) and tokens.

### B. User Login
*   **Endpoint**: `POST /api/auth/login`
*   **Access**: Public
*   **Flow**:
    1.  **Credential Check**: Finds user by `email`. Returns 401 if not found.
    2.  **Status Check**: Returns 403 if `is_active` is false.
    3.  **Password Verification**: Compares input password with stored hash using `bcrypt`.
    4.  **Token Generation**: Generates new `accessToken` and `refreshToken`.
    5.  **Session Update**: Updates `refresh_token` in database.
    6.  **Response**: Returns user data and tokens.

### C. Token Refresh
*   **Endpoint**: `POST /api/auth/refresh`
*   **Access**: Public
*   **Flow**:
    1.  **Validation**: Verifies signature of provided `refreshToken`.
    2.  **Database Check**: Checks if token matches the one stored for the user.
    3.  **Rotation**: Generates NEW `accessToken` and NEW `refreshToken`.
    4.  **Update**: Replaces old refresh token in database with the new one.
    5.  **Response**: Returns new tokens.

---

## 2. User Management Flow

### Overview
Admins can view, search, and manage user accounts. This is critical for customer support and internal team management.

### A. Get All Users
*   **Endpoint**: `GET /api/admin/users`
*   **Access**: Private (Admin)
*   **Parameters**: `page`, `limit`, `role`, `search`
*   **Flow**:
    1.  **Filtering**: Builds Prisma `where` clause based on `role` and `search` (matches name or email).
    2.  **Pagination**: Calculates `skip` and `take` based on query params.
    3.  **Query**: Fetches users and total count in parallel.
    4.  **Response**: Returns list of users and pagination metadata.

### B. Update User
*   **Endpoint**: `PUT /api/admin/users/:id`
*   **Access**: Private (Admin)
*   **Flow**:
    1.  **Existence Check**: Verifies user ID exists.
    2.  **Update**: Modifies allowed fields (`role`, `is_active`, `email_verified`).
    3.  **Response**: Returns updated user object.

---

## 3. Product Management Flow

### Overview
The core of the e-commerce platform. Handles complex data structures including variants, images, and 3D models.

### A. Create Product (Multipart)
*   **Endpoint**: `POST /api/admin/products`
*   **Access**: Private (Admin)
*   **Content-Type**: `multipart/form-data`
*   **Flow**:
    1.  **File Upload (Middleware)**:
        *   `images`: Uploads up to 5 files to S3 (`products/` folder).
        *   `model_3d`: Uploads 1 file to S3 (`products/models/` folder).
    2.  **Data Preparation**:
        *   Auto-generates `slug` from name if missing.
        *   Parses `variants` JSON string into object.
        *   Converts numeric strings to Floats/Decimals.
    3.  **Database Transaction**:
        *   Creates `Product` record.
        *   Creates nested `ProductVariant` records.
    4.  **Response**: Returns created product with all relations.

### B. Bulk Upload (CSV)
*   **Endpoint**: `POST /api/admin/products/bulk-upload`
*   **Access**: Private (Admin)
*   **Flow**:
    1.  **Stream Processing**: Pipes uploaded CSV buffer through `csv-parser`.
    2.  **Row Processing**:
        *   Validates required fields (`name`, `sku`).
        *   Checks for duplicates (SKU/Slug) in DB.
    3.  **Batch Insert**: Creates valid products sequentially (or in batch).
    4.  **Response**: Returns count of successfully created products.

---

## 4. Order Management Flow

### Overview
Allows admins to track sales, manage order status, and view financial data.

### A. Get All Orders
*   **Endpoint**: `GET /api/admin/orders`
*   **Access**: Private (Admin)
*   **Parameters**: `page`, `limit`, `status`, `payment_status`
*   **Flow**:
    1.  **Filtering**: Applies filters for order status (e.g., `pending`, `shipped`) and payment status.
    2.  **Data Fetching**: Retrieves orders with included `User` details (name, email).
    3.  **Response**: Returns paginated list of orders.

### B. Dashboard Statistics
*   **Endpoint**: `GET /api/admin/dashboard`
*   **Access**: Private (Admin)
*   **Flow**:
    1.  **Aggregation**: Runs parallel queries for:
        *   Total Users count.
        *   Total Products count.
        *   Total Orders count.
        *   Total Revenue (sum of `total` for paid orders).
    2.  **Grouping**: Groups orders by `status` to show distribution (e.g., 5 Pending, 2 Shipped).
    3.  **Recent Activity**: Fetches last 10 orders.
    4.  **Response**: Returns consolidated stats object.

---

## 5. System Configuration Flow

### Overview
Manages dynamic attributes that define product properties.

### A. Category & Attribute Management
*   **Endpoints**:
    *   `Categories`: `/api/admin/categories`
    *   `Frame Sizes`: `/api/admin/frame-sizes`
    *   `Lens Types`: `/api/admin/lens-types`
    *   `Lens Coatings`: `/api/admin/lens-coatings`
*   **Flow**:
    *   Standard CRUD (Create, Read, Update, Delete) operations.
    *   **Slug Generation**: Automatically creates URL-friendly slugs from names during creation.
