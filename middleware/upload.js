const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (for S3 uploads)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp|glb|gltf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

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

// Single file upload
exports.uploadSingle = (fieldName = 'image') => upload.single(fieldName);

// Multiple files upload
exports.uploadMultiple = (fieldName = 'images', maxCount = 5) => upload.array(fieldName, maxCount);

// Mixed fields upload
exports.uploadFields = (fields) => upload.fields(fields);

