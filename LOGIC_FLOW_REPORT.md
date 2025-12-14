# OptyShop Backend — Logic & Flow Report

## 1) Entry & Core Middlewares
- `server.js` boots Express, loads env, sets `trust proxy`, and wires security: `helmet`, CORS (env-driven origin), body parsers (10mb), `compression`, `morgan` (env-based), and rate limiting on `/api/*`.
- Health probes: `GET /health` and `GET /api` return status/version.
- Error handling: 404 JSON responder, followed by global `errorHandler`.

## 2) Routing Map (top-level)
- Auth `/api/auth` • Products `/api/products` • Categories `/api/categories`
- Cart `/api/cart` • Orders `/api/orders` • Prescriptions `/api/prescriptions`
- Simulations `/api/simulations` • Admin `/api/admin`
- Marketing `/api/marketing` • CMS `/api/cms` • Analytics `/api/analytics`
- Overview `/api/overview` • Case Studies `/api/case-studies`
- Blog `/api/blog` • Jobs `/api/jobs` • Forms `/api/forms`

## 3) Cross-Cutting Concerns
- AuthZ/AuthN: JWT via `middleware/auth.js` (role checks for admin-only routes).
- Async safety: `middleware/asyncHandler.js` wraps controllers.
- Uploads: `middleware/upload.js` for multipart (images, 3D models, CSV) to S3.
- Responses: `utils/response.js` standardizes success/error shapes.
- Validation: `express-validator` in route validators for inputs.

## 4) Domain Flows (User-Facing)
- Authentication: register/login/refresh with hashed refresh tokens; role-aware profile updates.
- Products & Categories: public browse/detail/featured/related; admin CRUD (see admin module).
- Cart: auth-only CRUD for items, quantities, clear cart; ties to products/options.
- Orders: auth-only create from cart, list/detail, cancel; admin can update status.
- Prescriptions: auth CRUD + validation helpers for PD/HP ranges.
- Simulations: public calculators (PD, HP, lens thickness, kids/lifestyle lens recs, base curve, photochromic, AR coating).

## 5) Admin Dashboard Flows
- Products: multipart create (images + optional 3D model), variant parsing, slugging, Prisma transactions; bulk CSV upload with dedupe (sku/slug) and row validation.
- Categories & Attributes: CRUD for categories, frame sizes, lens types, coatings; slugs auto-generated.
- Users: admin list with filters/pagination/search; update role/status/verification flags.
- Orders: admin dashboard aggregates totals, revenue, grouped statuses, recent orders; status updates and technician/refund flows (payment gateway placeholder).
- Marketing/CMS: coupons/campaign scaffolding; banners/blog/FAQ/pages/testimonials CRUD.

## 6) Analytics & Overview
- `/api/overview` executes parallel Prisma queries to build: total orders/users/revenue, lens-type distribution (+%), avg PD/HP and 12‑month trends, revenue trend, order status overview, top-selling frames (by paid order items), latest orders, pending customizations. Helpers bucket monthly revenue and prescription metrics.

## 7) Dynamic Content & Fallbacks
- `data/dynamicContent.js` provides in-memory case studies, blog articles, jobs, and form configurations used by `/api/case-studies`, `/api/blog`, `/api/jobs`, and `/api/forms` when DB is empty.

## 8) Data & Persistence
- Prisma + MySQL; models cover Users, Products (+variants/relations), Categories, Cart/CartItem, Orders/OrderItem, Prescriptions, Reviews, FrameSize, LensType, LensCoating, SimulationConfig, plus marketing/CMS entities.
- Assets stored on S3 (product images, 3D models, CMS media, VTO assets).

## 9) Security & Ops
- Security: JWT auth, bcrypt hashing, rate limiting, CORS, helmet headers, validation to guard inputs.
- Ops: migrations run via `npx prisma migrate`; environment via `.env`; logging with `morgan`; health endpoint for monitoring.

## 10) Key Files for Deeper Reference
- `server.js` — app wiring & middleware chain.
- `controllers/overviewController.js` — admin analytics/overview assembly.
- `controllers/adminController.js` — admin CRUD (products, categories, users, orders, assets).
- `middleware/auth.js` — JWT/role enforcement.
- `middleware/upload.js` — S3 multipart handling.
- `data/dynamicContent.js` — fallback dynamic datasets.

