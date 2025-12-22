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

  // Multer errors - handle file upload errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    let statusCode = 400;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${err.limit / (1024 * 1024)}MB.`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = `Too many files. Maximum is ${err.limit} files.`;
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected field: "${err.field}". Expected fields: ${err.message.includes('images') ? 'images' : 'Please check the field name'}.`;
        // For product uploads, provide specific guidance
        if (req.originalUrl && req.originalUrl.includes('/products')) {
          message = `Unexpected field: "${err.field}". For product uploads, use field name "images" for image files (max 5) and "model_3d" for 3D model files (max 1).`;
        }
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the request.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields.';
        break;
      default:
        message = `File upload error: ${err.message}`;
    }

    error = {
      statusCode,
      message
    };
  }

  // S3/Upload errors - provide user-friendly message
  if (error.message && (error.message.includes('S3') || error.message.includes('upload'))) {
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

