# OptyShop Admin Dashboard System Documentation

This document details the operational status and data flows of the newly implemented Admin Dashboard Backend modules.

> [!TIP]
> For a detailed breakdown of API flows, including Authentication and User Management, please refer to [ADMIN_DASHBOARD_FLOWS.md](ADMIN_DASHBOARD_FLOWS.md).

## 1. Product Management Module

### Status: ✅ Fully Implemented

### Features & Flows

#### A. Product CRUD with Variants & 3D Models
*   **Flow**:
    1.  **Request**: Admin sends `POST /api/admin/products` with `multipart/form-data`.
    2.  **Middleware**: `uploadFields` handles `images` (max 5) and `model_3d` (max 1). Files are uploaded to AWS S3.
    3.  **Controller**: `createProduct` receives body + S3 URLs.
    4.  **Logic**:
        *   Auto-generates `slug` from name.
        *   Parses `variants` JSON string.
    5.  **Database**: Prisma creates `Product` and related `ProductVariant` records in a transaction.
    6.  **Response**: Returns created product object.

#### B. Bulk Upload (CSV/Excel)
*   **Flow**:
    1.  **Request**: Admin uploads CSV via `POST /api/admin/products/bulk-upload`.
    2.  **Middleware**: `uploadSingle` accepts `.csv`, `.xlsx`, `.xls`.
    3.  **Controller**: `bulkUploadProducts` streams the file buffer through `csv-parser`.
    4.  **Logic**:
        *   Iterates through rows.
        *   Checks for existing `sku` or `slug` to avoid duplicates.
        *   Maps CSV columns to Prisma `Product` schema.
    5.  **Database**: Batch inserts valid products.
    6.  **Response**: Summary of success count and errors.

#### C. Frame Size, Lens, & Coating Management
*   **Flow**:
    *   Standard CRUD operations via `adminController.js`.
    *   **Frame Sizes**: Linked to Products via `product_id`.
    *   **Lens/Coatings**: Managed as independent entities (`LensType`, `LensCoating`) and linked to products via many-to-many tables (`ProductLensType`, `ProductLensCoating`).

---

## 2. Simulation & Virtual Try-On (VTO) Module

### Status: ✅ Fully Implemented

### Features & Flows

#### A. Simulation Configuration
*   **Flow**:
    *   Admins update optical constants (e.g., `refractive_index`, `abbe_value`) via `PUT /api/simulations/config`.
    *   Stored in `SimulationConfig` table as Key-Value pairs.
    *   Used by frontend simulators for accurate physics calculations.

#### B. VTO Asset Management
*   **Flow**:
    1.  **Upload**: Admin uploads 3D assets (frames, masks) via `POST /api/simulations/vto-assets`.
    2.  **Storage**: Files stored in S3 bucket `vto-assets`.
    3.  **Database**: `VtoAsset` record created with metadata (alignment params, scale).
    4.  **Usage**: Frontend fetches assets via `GET /api/simulations/vto-assets` to render AR experiences.

---

## 3. Order & User Management Module

### Status: ✅ Fully Implemented

### Features & Flows

#### A. Order Processing (Refunds & Technicians)
*   **Refund Flow**:
    1.  Admin requests `POST /api/orders/:id/refund`.
    2.  Controller verifies order existence.
    3.  *(Placeholder)* Payment gateway (Stripe/PayPal) refund triggered.
    4.  Order status updated to `refunded`.
    5.  Audit note added to order.
*   **Technician Assignment Flow**:
    1.  Admin assigns technician via `PUT /api/orders/:id/assign-technician`.
    2.  Order status updates to `processing`.
    3.  Internal note added with Technician ID/Name.

#### B. Prescription Validation
*   **Flow**:
    1.  Admin sends prescription data to `POST /api/prescriptions/validate`.
    2.  **Logic Checks**:
        *   Sphere power > ±10.00 (High index warning).
        *   Cylinder > ±6.00 (Astigmatism warning).
        *   PD outside 50-80mm range (Adult norm check).
    3.  **Response**: Returns `valid: boolean` and list of `issues` (warnings).

---

## 4. Marketing & CMS Module

### Status: ✅ Fully Implemented

### Features & Flows

#### A. Marketing (Coupons & Campaigns)
*   **Coupons**:
    *   Admins create codes with `discount_type` (percentage/fixed) and `usage_limit`.
    *   Validated at checkout (logic in Cart module).
*   **Campaigns**:
    *   Seasonal sales configurations stored in `MarketingCampaign`.

#### B. Content Management System (CMS)
*   **Flow**:
    *   **Banners**: Upload image -> S3 -> `Banner` table (with sort order).
    *   **Blog**: Create post -> `BlogPost` table (slug auto-generated).
    *   **FAQs/Pages**: Standard CRUD for static content.
    *   **Testimonials**: Admin uploads user avatar -> `Testimonial` table.

---

## 5. Analytics & Logs Module

### Status: ✅ Fully Implemented

### Features & Flows

#### A. Sales Analytics
*   **Flow**:
    1.  Request `GET /api/analytics/sales?period=month`.
    2.  Controller queries `Order` table for `paid` orders within date range.
    3.  Aggregates `total` revenue and count.
    4.  Returns data points for frontend charting.

#### B. VTO Analytics
*   **Flow**:
    *   Tracks `AnalyticsEvent` (type: `vto_used`).
    *   Admin views total usage count and recent sessions to gauge feature popularity.

#### C. System Logs
*   **Admin Logs**: Tracks actions like "Product Updated" via `AdminActivityLog`.
*   **Error Logs**: Captures failed API requests in `ApiErrorLog` for debugging.

---

## Technical Stack Summary
*   **Framework**: Express.js
*   **Database**: MySQL (via Prisma ORM)
*   **Storage**: AWS S3 (via `aws-sdk`)
*   **Validation**: `express-validator`
*   **Security**: `helmet`, `cors`, `rate-limit`
