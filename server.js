// Suppress AWS SDK v2 maintenance mode warning (if aws-sdk is still in dependencies)
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import database
const { prisma, testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const prescriptionRoutes = require('./routes/prescriptions');
const simulationRoutes = require('./routes/simulations');
const categoryRoutes = require('./routes/categories');
const subCategoryRoutes = require('./routes/subCategory');
const adminRoutes = require('./routes/admin');
const marketingRoutes = require('./routes/marketing');
const cmsRoutes = require('./routes/cms');
const analyticsRoutes = require('./routes/analytics');
const overviewRoutes = require('./routes/overview');
const caseStudyRoutes = require('./routes/caseStudies');
const blogRoutes = require('./routes/blog');
const jobRoutes = require('./routes/jobs');
const formRoutes = require('./routes/forms');
const couponRoutes = require('./routes/coupons');
const bannerRoutes = require('./routes/banners');
const campaignRoutes = require('./routes/campaigns');
const brandRoutes = require('./routes/brands');
const faqRoutes = require('./routes/faqs');
const pageRoutes = require('./routes/pages');
const transactionRoutes = require('./routes/transactions');
const paymentRoutes = require('./routes/payments');
const shippingRoutes = require('./routes/shipping');
const lensRoutes = require('./routes/lens');
const customizationRoutes = require('./routes/productCustomization');
const prescriptionSunLensRoutes = require('./routes/prescriptionSunLenses');
const photochromicLensRoutes = require('./routes/photochromicLenses');
const prescriptionLensTypesRoutes = require('./routes/prescriptionLensTypes');
const contactLensFormRoutes = require('./routes/contactLensForms');
const prescriptionFormRoutes = require('./routes/prescriptionForms');
const flashOfferRoutes = require('./routes/flashOffers');
const productGiftRoutes = require('./routes/productGifts');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration - Completely open, no restrictions
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: '*',
  exposedHeaders: '*',
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS headers middleware - set headers on all responses (backup)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Expose-Headers', '*');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Security middleware - Configure Helmet to allow all cross-origin requests
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - Allow all origins
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware - Increased limits for file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// CORS headers for static files (uploads) - Allow ALL origins
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Serve uploaded files statically (for local storage fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}


// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OptyShop Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Fix double /api/api paths (rewrite path for all HTTP methods)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/api/')) {
    // Rewrite the URL to remove the duplicate /api
    const newPath = req.path.replace('/api/api/', '/api/');
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    req.url = newPath + queryString;
    // Also update originalUrl for consistency
    if (req.originalUrl) {
      req.originalUrl = req.originalUrl.replace('/api/api/', '/api/');
    }
  }
  next();
});

// API base route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OptyShop API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      prescriptions: '/api/prescriptions',
      simulations: '/api/simulations',
      categories: '/api/categories',
      admin: '/api/admin',
      overview: '/api/overview',
      caseStudies: '/api/case-studies',
      blog: '/api/blog',
      jobs: '/api/jobs',
      forms: '/api/forms',
      coupons: '/api/coupons',
      banners: '/api/banners',
      campaigns: '/api/campaigns',
      brands: '/api/brands',
      faqs: '/api/faqs',
      pages: '/api/pages',
      lens: '/api/lens',
      prescriptionSunLenses: '/api/prescription-sun-lenses',
      photochromicLenses: '/api/photochromic-lenses',
      contactLensForms: '/api/contact-lens-forms'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/marketing', marketingRoutes); // Deprecated - kept for backward compatibility
app.use('/api/cms', cmsRoutes); // Deprecated - kept for backward compatibility (testimonials only)
app.use('/api/analytics', analyticsRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact-lens-forms', contactLensFormRoutes); // Standard route
app.use('/api/prescription-forms', prescriptionFormRoutes); // Prescription forms route
app.use('/api/shipping-methods', shippingRoutes); // Standard route
app.use('/api/customization', customizationRoutes); // Standard route
app.use('/api/photochromic-lenses', photochromicLensRoutes); // Standard route
app.use('/api/prescription-sun-lenses', prescriptionSunLensRoutes); // Standard route
app.use('/api/prescription-lens-types', prescriptionLensTypesRoutes); // Standard route
app.use('/api/lens', lensRoutes); // Standard route - includes prescription-lens-types, prescription-sun-colors, etc.
app.use('/api/flash-offers', flashOfferRoutes);
app.use('/api/product-gifts', productGiftRoutes);
app.use('/api/api/shipping-methods', shippingRoutes); // Keep for backward compatibility
app.use('/api/api/lens', lensRoutes); // Keep for backward compatibility
app.use('/api/api/contact-lens-forms', contactLensFormRoutes); // Keep for backward compatibility
app.use('/api/api/subcategories', subCategoryRoutes);
app.use('/api/api/transactions', transactionRoutes);
app.use('/api/api/payments', paymentRoutes);
app.use('/api/api/prescription-sun-lenses', prescriptionSunLensRoutes);
app.use('/api/api/photochromic-lenses', photochromicLensRoutes);

// Handle double /api/api paths (fallback for cases where middleware doesn't catch it)
app.use('/api/api/auth', authRoutes);
app.use('/api/api/products', productRoutes);
app.use('/api/api/cart', cartRoutes);
app.use('/api/api/orders', orderRoutes);
app.use('/api/api/prescriptions', prescriptionRoutes);
app.use('/api/api/simulations', simulationRoutes);
app.use('/api/api/categories', categoryRoutes);
app.use('/api/api/admin', adminRoutes);
app.use('/api/api/marketing', marketingRoutes);
app.use('/api/api/cms', cmsRoutes);
app.use('/api/api/analytics', analyticsRoutes);
app.use('/api/api/overview', overviewRoutes);
app.use('/api/api/case-studies', caseStudyRoutes);
app.use('/api/api/blog', blogRoutes);
app.use('/api/api/jobs', jobRoutes);
app.use('/api/api/forms', formRoutes);
app.use('/api/api/coupons', couponRoutes);
app.use('/api/api/banners', bannerRoutes);
app.use('/api/api/campaigns', campaignRoutes);
app.use('/api/api/faqs', faqRoutes);
app.use('/api/api/pages', pageRoutes);
app.use('/api/api/customization', customizationRoutes);
app.use('/api/api/prescription-sun-lenses', prescriptionSunLensRoutes);
app.use('/api/api/photochromic-lenses', photochromicLensRoutes);
app.use('/api/api/contact-lens-forms', contactLensFormRoutes);
app.use('/api/api/subcategories', subCategoryRoutes);
app.use('/api/api/transactions', transactionRoutes);
app.use('/api/api/payments', paymentRoutes);
app.use('/api/api/shipping-methods', shippingRoutes);
app.use('/api/api/lens', lensRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Prisma migrations should be run manually
    // Run: npx prisma migrate dev (for development)
    // Run: npx prisma migrate deploy (for production)
    console.log('📦 Using Prisma ORM');
    console.log('💡 Run migrations with: npx prisma migrate dev');

    // Start server with no timeout restrictions
    const server = app.listen(PORT, () => {
      console.log(`🚀 OptyShop Backend server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔐 CORS: All origins allowed`);
    });

    // Handle port already in use error
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`💡 To fix this, you can:`);
        console.error(`   1. Stop the process using port ${PORT}`);
        console.error(`   2. On Windows: netstat -ano | findstr :${PORT} then taskkill /PID <PID> /F`);
        console.error(`   3. On Linux/Mac: lsof -ti:${PORT} | xargs kill -9`);
        console.error(`   4. Or change the PORT in your .env file`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Remove timeout restrictions - allow long-running requests (file uploads, etc.)
    server.timeout = 0; // 0 = no timeout
    server.keepAliveTimeout = 0; // 0 = no keep-alive timeout
    server.headersTimeout = 0; // 0 = no headers timeout
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  console.error('❌ Unhandled Rejection:', err);
  await prisma.$disconnect();
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('❌ Uncaught Exception:', err);
  await prisma.$disconnect();
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;

