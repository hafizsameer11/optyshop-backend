// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with more details
  console.error('❌ Error:', {
    message: err.message,
    name: err.name,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message
    };
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value entered';
    error = {
      statusCode: 400,
      message
    };
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Resource not found';
    error = {
      statusCode: 404,
      message
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      statusCode: 401,
      message
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      statusCode: 401,
      message
    };
  }

  // Prisma unique constraint errors
  if (err.code === 'P2002') {
    const target = err.meta?.target;
    let field = 'field';
    if (Array.isArray(target) && target.length > 0) {
      field = target[0].replace(/_/g, ' ');
    }
    error = {
      statusCode: 400,
      message: `A record with this ${field} already exists. Please use a different value.`
    };
  }

  // S3/Upload errors - provide user-friendly message
  if (error.message && error.message.includes('S3') || error.message.includes('upload')) {
    error = {
      statusCode: 500,
      message: error.message.includes('not configured') 
        ? 'File upload is not configured. Please configure AWS S3 or contact administrator.'
        : 'File upload failed. Please try again or contact administrator.'
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

