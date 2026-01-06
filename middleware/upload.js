const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on route path, not field name
    let folder = 'general';
    const route = req.route?.path || req.path || req.originalUrl || '';
    
    // Determine folder based on route
    if (route.includes('/products') || route.includes('/admin/products')) {
      if (file.fieldname === 'model_3d') {
        folder = 'vto-assets';
      } else {
        folder = 'products';
      }
    } else if (route.includes('/contact-lens-configs') || route.includes('/admin/contact-lens-configs')) {
      folder = 'contact-lens-configs';
    } else if (route.includes('/subcategories') || route.includes('/admin/subcategories')) {
      folder = 'subcategories';
    } else if (route.includes('/cms') || route.includes('/banners') || route.includes('/admin/banners')) {
      folder = 'cms/banners';
    } else if (route.includes('/campaigns') || route.includes('/admin/campaigns')) {
      folder = 'campaigns';
    } else if (route.includes('/brands') || route.includes('/admin/brands')) {
      folder = 'brands';
    } else if (file.fieldname === 'attachments') {
      folder = 'support-attachments';
    } else if (file.fieldname === 'model_3d') {
      folder = 'vto-assets';
    } else {
      // Default folder for other uploads
      folder = 'general';
    }
    
    const folderPath = path.join(UPLOADS_DIR, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp|glb|gltf|csv|xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'text/csv';

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and 3D models are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for support form attachments (100MB per file, max 5 files)
const supportUpload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Allow more file types for support attachments
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|csv|xlsx|xls|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-rar-compressed';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDF, documents, spreadsheets, archives.'));
    }
  }
});

// Single file upload
exports.uploadSingle = (fieldName = 'image') => upload.single(fieldName);

// Multiple files upload
exports.uploadMultiple = (fieldName = 'images', maxCount = 5) => upload.array(fieldName, maxCount);

// Mixed fields upload with error handling
exports.uploadFields = (fields) => {
  const fieldsMiddleware = upload.fields(fields);
  
  return (req, res, next) => {
    // Log expected fields for debugging
    const expectedFields = fields.map(f => f.name).join(', ');
    console.log(`📤 Upload middleware - Expected fields: ${expectedFields}`);
    
    fieldsMiddleware(req, res, (err) => {
      if (err) {
        // Log detailed error information
        console.error('❌ Multer error:', {
          name: err.name,
          code: err.code,
          message: err.message,
          field: err.field,
          expectedFields: expectedFields,
          url: req.originalUrl,
          method: req.method
        });
        
        // Enhance error message with expected fields
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          err.message = `Unexpected field: "${err.field}". Expected fields: ${expectedFields}`;
        }
      }
      next(err);
    });
  };
};

// Product upload middleware - accepts images, model_3d, and dynamic color fields
// Supports: images, model_3d, color_images_{colorName} (old format), image_#RRGGBB (new format)
exports.uploadProductFiles = () => {
  // Use upload.any() to accept any field names, then validate
  const anyUpload = upload.any();
  
  return (req, res, next) => {
    anyUpload(req, res, (err) => {
      if (err) {
        console.error('❌ Multer error in product upload:', {
          name: err.name,
          code: err.code,
          message: err.message,
          url: req.originalUrl,
          method: req.method
        });
        return next(err);
      }
      
      // Convert array format to object format for compatibility with existing code
      // upload.any() returns an array, but controller expects an object keyed by fieldname
      if (req.files && Array.isArray(req.files)) {
        const allowedFields = ['images', 'model_3d'];
        const invalidFields = [];
        
        // Group files by fieldname
        const filesByField = {};
        req.files.forEach(file => {
          if (!filesByField[file.fieldname]) {
            filesByField[file.fieldname] = [];
          }
          filesByField[file.fieldname].push(file);
        });
        
        // Validate each field
        for (const fieldname of Object.keys(filesByField)) {
          const isAllowed = allowedFields.includes(fieldname);
          // Support both old format (color_images_*) and new format (image_#RRGGBB)
          const isColorImage = fieldname.startsWith('color_images_');
          const isImageWithColor = fieldname.startsWith('image_#') && fieldname.match(/^image_#[0-9A-Fa-f]{6}$/);
          
          if (!isAllowed && !isColorImage && !isImageWithColor) {
            invalidFields.push(fieldname);
          }
          
          // Validate limits
          if (fieldname === 'images' && filesByField[fieldname].length > 5) {
            return next(new Error(`Too many files for 'images' field. Maximum is 5, received ${filesByField[fieldname].length}.`));
          }
          
          if (fieldname === 'model_3d' && filesByField[fieldname].length > 1) {
            return next(new Error(`Too many files for 'model_3d' field. Maximum is 1, received ${filesByField[fieldname].length}.`));
          }
          
          // Limit color_images_* and image_#* fields to 5 files each
          if ((isColorImage || isImageWithColor) && filesByField[fieldname].length > 5) {
            return next(new Error(`Too many files for '${fieldname}' field. Maximum is 5, received ${filesByField[fieldname].length}.`));
          }
        }
        
        if (invalidFields.length > 0) {
          return next(new Error(`Unexpected field(s): ${invalidFields.join(', ')}. Allowed fields: images, model_3d, color_images_{colorName} (e.g., color_images_black), or image_#RRGGBB (e.g., image_#000000, image_#FFD700).`));
        }
        
        // Convert to object format - controller expects req.files.images, req.files.model_3d, req.files['color_images_black'], req.files['image_#000000'], etc.
        req.files = filesByField;
      } else if (!req.files) {
        // Ensure req.files exists as an object even if no files were uploaded
        req.files = {};
      }
      
      next();
    });
  };
};

// Support form attachments upload (max 5 files, 100MB each)
exports.uploadSupportAttachments = (fieldName = 'attachments') => supportUpload.array(fieldName, 5);

