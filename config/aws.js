const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check if AWS credentials are configured
const isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  );
};

// Configure AWS only if credentials are provided
if (isS3Configured()) {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
}

const s3 = isS3Configured() ? new AWS.S3() : null;

// Local storage directory
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;

// Ensure uploads directory exists
const ensureUploadsDir = (folder = 'general') => {
  const folderPath = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
};

// Upload to local storage (fallback when S3 is not configured)
const uploadToLocal = async (file, folder = 'general') => {
  try {
    const folderPath = ensureUploadsDir(folder);
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(folderPath, fileName);
    
    fs.writeFileSync(filePath, file.buffer);
    
    // Return public URL
    const url = `${PUBLIC_URL}/uploads/${folder}/${fileName}`;
    console.log(`✅ File saved locally: ${url}`);
    return url;
  } catch (error) {
    console.error('Local file upload error:', error);
    throw new Error(`Failed to save file locally: ${error.message}`);
  }
};

// Delete from local storage
const deleteFromLocal = async (url) => {
  try {
    // Extract file path from URL
    const urlPath = url.replace(`${PUBLIC_URL}/uploads/`, '');
    const filePath = path.join(UPLOADS_DIR, urlPath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Local file delete error:', error);
    return false;
  }
};

const uploadToS3 = async (file, folder = 'general') => {
  // Use local storage if S3 is not configured
  if (!isS3Configured()) {
    console.warn('⚠️  AWS S3 not configured. Using local file storage.');
    return uploadToLocal(file, folder);
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${folder}/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (error) {
    console.error('S3 upload failed, falling back to local storage:', error.message);
    // Fallback to local storage on S3 error
    return uploadToLocal(file, folder);
  }
};

const deleteFromS3 = async (urlOrKey) => {
  // If S3 is not configured, try to delete from local storage
  if (!isS3Configured()) {
    return deleteFromLocal(urlOrKey);
  }

  // Check if it's a local URL or S3 key
  if (urlOrKey.includes('/uploads/')) {
    return deleteFromLocal(urlOrKey);
  }

  // It's an S3 key
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: urlOrKey
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete failed:', error.message);
    return false;
  }
};

module.exports = { s3, uploadToS3, deleteFromS3, isS3Configured };

