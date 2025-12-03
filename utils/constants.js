// Application constants
module.exports = {
  // Order statuses
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  },

  // Payment statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },

  // Payment methods
  PAYMENT_METHOD: {
    STRIPE: 'stripe',
    PAYPAL: 'paypal',
    COD: 'cod'
  },

  // User roles
  USER_ROLES: {
    CUSTOMER: 'customer',
    ADMIN: 'admin'
  },

  // Frame shapes
  FRAME_SHAPES: [
    'round',
    'square',
    'oval',
    'cat-eye',
    'aviator',
    'rectangle',
    'wayfarer',
    'geometric'
  ],

  // Frame materials
  FRAME_MATERIALS: [
    'acetate',
    'metal',
    'tr90',
    'titanium',
    'wood',
    'mixed'
  ],

  // Lens types
  LENS_TYPES: [
    'prescription',
    'sunglasses',
    'reading',
    'computer',
    'photochromic'
  ],

  // Gender options
  GENDERS: ['men', 'women', 'unisex', 'kids'],

  // Stock statuses
  STOCK_STATUS: {
    IN_STOCK: 'in_stock',
    OUT_OF_STOCK: 'out_of_stock',
    BACKORDER: 'backorder'
  },

  // Lens indexes
  LENS_INDEXES: [1.56, 1.61, 1.67, 1.74],

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100
  }
};

