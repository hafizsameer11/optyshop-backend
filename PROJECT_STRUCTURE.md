# OptyShop Backend - Complete Project Structure

## 📁 Folder Structure

```
backend/
│
├── 📂 config/                    # Configuration files
│   ├── database.js              # Sequelize MySQL configuration
│   ├── jwt.js                   # JWT token configuration
│   └── aws.js                   # AWS S3 file upload configuration
│
├── 📂 controllers/              # Business logic controllers
│   ├── adminController.js       # Admin panel operations
│   ├── authController.js        # Authentication & user management
│   ├── cartController.js        # Shopping cart operations
│   ├── categoryController.js    # Category management
│   ├── orderController.js       # Order processing
│   ├── prescriptionController.js # Prescription management
│   ├── productController.js     # Product catalog
│   └── simulationController.js   # Optical simulation tools
│
├── 📂 middleware/               # Express middleware
│   ├── auth.js                  # JWT authentication & authorization
│   ├── asyncHandler.js          # Async error wrapper
│   ├── errorHandler.js          # Global error handler
│   └── upload.js                # Multer file upload configuration
│
├── 📂 models/                   # Sequelize database models
│   ├── Cart.js                  # Shopping cart model
│   ├── CartItem.js              # Cart items model
│   ├── Category.js              # Product categories
│   ├── FrameSize.js             # Frame size specifications
│   ├── index.js                 # Model associations & exports
│   ├── LensCoating.js           # Lens coating types
│   ├── LensType.js              # Lens type definitions
│   ├── Order.js                 # Order model
│   ├── OrderItem.js             # Order items model
│   ├── Prescription.js          # Eye prescription data
│   ├── Product.js               # Product catalog model
│   ├── Review.js                # Product reviews
│   ├── SimulationConfig.js      # Simulation configurations
│   └── User.js                  # User accounts
│
├── 📂 routes/                   # API route definitions
│   ├── admin.js                 # Admin routes (protected)
│   ├── auth.js                  # Authentication routes
│   ├── cart.js                  # Cart routes (protected)
│   ├── categories.js            # Category routes
│   ├── orders.js                # Order routes (protected)
│   ├── prescriptions.js          # Prescription routes (protected)
│   ├── products.js              # Product routes
│   └── simulations.js           # Simulation routes (public)
│
├── 📂 services/                 # Business logic services
│   └── opticalCalculations.js   # Optical calculation formulas
│       ├── calculatePD()        # Pupillary Distance calculator
│       ├── calculatePupillaryHeight() # HP calculator
│       ├── calculateLensThickness()   # Lens thickness calculator
│       ├── recommendKidsLens()        # Kids lens recommendations
│       ├── recommendLifestyleLens()  # Lifestyle-based recommendations
│       └── calculateBaseCurve()      # Contact lens base curve
│
├── 📂 utils/                    # Utility functions
│   ├── constants.js             # Application constants
│   └── response.js              # Standardized API responses
│
├── 📂 validators/               # Request validation schemas
│   ├── authValidator.js         # Auth route validations
│   ├── productValidator.js     # Product route validations
│   └── simulationValidator.js   # Simulation route validations
│
├── 📄 server.js                 # Main application entry point
├── 📄 package.json              # Dependencies & scripts
├── 📄 README.md                 # Project documentation
├── 📄 env.example               # Environment variables template
└── 📄 PROJECT_STRUCTURE.md      # This file
```

## 🔑 Key Features

### 1. Authentication & Authorization
- JWT-based authentication
- Access & refresh tokens
- Role-based access control (Customer/Admin)
- Password hashing with bcrypt

### 2. Product Management
- Full CRUD operations
- Advanced filtering (shape, material, lens type, price)
- Product categories
- Frame sizes & specifications
- Lens types & coatings
- 3D model support

### 3. Shopping Cart
- Add/remove items
- Update quantities
- Lens customization (index, coatings)
- Prescription linking

### 4. Order Processing
- Order creation from cart
- Order status tracking
- Payment integration ready
- Stock management
- Order history

### 5. Prescription Management
- Store eye prescriptions
- Right/left eye specifications
- PD & HP tracking
- Prescription linking to orders

### 6. Optical Simulations
- **PD Calculator**: Monocular/Binocular PD
- **Pupillary Height**: HP for bifocal/progressive lenses
- **Lens Thickness**: Edge thickness calculation
- **Kids Lens Recommendation**: Safety-focused recommendations
- **Lifestyle Recommendation**: Based on user habits
- **Photochromic Simulator**: Lens darkening simulation
- **AR Coating Simulator**: Anti-reflective coating visualization
- **Base Curve Calculator**: Contact lens calculations

### 7. Admin Panel
- Dashboard statistics
- Product management
- Order management
- User management
- Category management

## 🛠️ Technology Stack

- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer + AWS S3
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

## 📊 Database Models

### Core Models
- **User**: Customer & admin accounts
- **Product**: Eyewear products
- **Category**: Product categories
- **Cart**: Shopping carts
- **CartItem**: Cart line items
- **Order**: Customer orders
- **OrderItem**: Order line items
- **Prescription**: Eye prescriptions

### Supporting Models
- **Review**: Product reviews
- **FrameSize**: Frame measurements
- **LensType**: Lens index types
- **LensCoating**: Coating options
- **SimulationConfig**: Simulation settings

## 🔐 Security Features

- JWT token authentication
- Password encryption (bcrypt)
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- SQL injection protection (Sequelize)
- XSS protection

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]  // Optional validation errors
}
```

## 🚀 Getting Started

1. Install dependencies: `npm install`
2. Configure `.env` file (copy from `env.example`)
3. Set up MySQL database
4. Run server: `npm run dev` (development) or `npm start` (production)

## 📚 API Documentation

See `README.md` for complete API endpoint documentation.

## 🧪 Testing

Run tests with: `npm test`

## 📦 Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Configure AWS S3 credentials
5. Use process manager (PM2, etc.)

---

**Built with ❤️ for OptyShop**

