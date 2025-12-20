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
    } else if (route.includes('/subcategories') || route.includes('/admin/subcategories')) {
      folder = 'subcategories';
    } else if (route.includes('/cms') || route.includes('/banners') || route.includes('/admin/banners')) {
      folder = 'cms/banners';
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

// Mixed fields upload
exports.uploadFields = (fields) => upload.fields(fields);

// Support form attachments upload (max 5 files, 100MB each)
exports.uploadSupportAttachments = (fieldName = 'attachments') => supportUpload.array(fieldName, 5);

