# OptyShop Backend

A comprehensive Node.js/Express backend for OptyShop - A Smart Optical E-Commerce & Simulation System.

## 📁 Project Structure

```
backend/
├── config/                 # Configuration files
│   ├── database.js        # Sequelize database configuration
│   ├── jwt.js             # JWT configuration
│   └── aws.js             # AWS S3 configuration
├── controllers/           # Route controllers (business logic)
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── prescriptionController.js
│   ├── simulationController.js
│   ├── categoryController.js
│   ├── adminController.js
│   ├── caseStudyController.js
│   ├── blogController.js
│   ├── jobController.js
│   └── formController.js
├── data/                  # Static fallbacks for content/config until DB is seeded
│   └── dynamicContent.js
├── middleware/           # Express middleware
│   ├── auth.js           # Authentication & authorization
│   ├── errorHandler.js   # Global error handler
│   ├── asyncHandler.js   # Async error wrapper
│   └── upload.js         # File upload handling
├── models/               # Sequelize database models
│   ├── User.js
│   ├── Product.js
│   ├── Category.js
│   ├── Order.js
│   ├── OrderItem.js
│   ├── Cart.js
│   ├── CartItem.js
│   ├── Prescription.js
│   ├── Review.js
│   ├── FrameSize.js
│   ├── LensType.js
│   ├── LensCoating.js
│   ├── SimulationConfig.js
│   └── index.js          # Model associations
├── routes/               # API route definitions
│   ├── auth.js
│   ├── products.js
│   ├── cart.js
│   ├── orders.js
│   ├── prescriptions.js
│   ├── simulations.js
│   ├── categories.js
│   ├── admin.js
│   ├── caseStudies.js
│   ├── blog.js
│   ├── jobs.js
│   └── forms.js
├── services/             # Business logic services
│   └── opticalCalculations.js  # Optical calculation formulas
├── utils/                # Utility functions
│   ├── response.js       # Standardized response helpers
│   └── constants.js      # Application constants
├── validators/           # Request validation schemas
│   ├── authValidator.js
│   ├── productValidator.js
│   └── simulationValidator.js
├── server.js             # Main application entry point
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL >= 5.7

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`)
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=optyshop
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
# ... other variables
```

5. Start the server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (Protected)
- `POST /api/auth/logout` - Logout (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)
- `PUT /api/auth/change-password` - Change password (Protected)

### Products (`/api/products`)
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/products/:id/related` - Get related products

### Cart (`/api/cart`) - Protected
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders (`/api/orders`) - Protected
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/cancel` - Cancel order
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Prescriptions (`/api/prescriptions`) - Protected
- `GET /api/prescriptions` - Get user prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions/:id` - Get single prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

### Simulations (`/api/simulations`) - Public
- `POST /api/simulations/pd` - Calculate Pupillary Distance
- `POST /api/simulations/pupillary-height` - Calculate Pupillary Height
- `POST /api/simulations/lens-thickness` - Calculate lens thickness
- `POST /api/simulations/kids-lens-recommendation` - Kids lens recommendation
- `POST /api/simulations/lifestyle-recommendation` - Lifestyle lens recommendation
- `POST /api/simulations/base-curve` - Calculate base curve
- `POST /api/simulations/photochromic` - Simulate photochromic lens
- `POST /api/simulations/ar-coating` - Simulate AR coating

### Dynamic Content (`/api`) - Public
- `GET /api/case-studies` - List case studies (fallbacks available if DB empty)
- `GET /api/case-studies/:slug` - Case study detail
- `GET /api/blog` - List blog articles
- `GET /api/blog/:slug` - Blog article detail
- `GET /api/jobs` - List open roles
- `GET /api/jobs/:id` - Job detail by numeric ID or slug
- `GET /api/forms/:name` - Fetch a form config (`contact`, `demo`, `pricing`, `job-application`)
- `POST /api/forms/:name/submissions` - Submit a form payload (validated per form)

### Categories (`/api/categories`)
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `GET /api/categories/slug/:slug` - Get category by slug

### Admin (`/api/admin`) - Admin Only
- `GET /api/admin/dashboard` - Dashboard statistics
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## 🧮 Optical Calculations

The backend includes comprehensive optical calculation services:

- **PD Calculator**: Calculates monocular/binocular PD and near PD
- **Pupillary Height**: Calculates HP for bifocal/progressive lenses
- **Lens Thickness**: Calculates edge thickness based on frame diameter, power, and index
- **Kids Lens Recommendation**: Recommends safe lens options for children
- **Lifestyle Recommendation**: Suggests lenses based on user lifestyle
- **Base Curve**: Calculates contact lens base curve

## 🛠️ Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for MySQL
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **AWS S3** - File storage
- **Multer** - File upload handling
- **Express Validator** - Request validation

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🧪 Testing

```bash
npm test
```

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@optyshop.com or create an issue in the repository.

#   O p t y S h o p 
 
 #   o p t y s h o p - b a c k e n d  
 