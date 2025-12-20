const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

// Upload to local storage (for backward compatibility with buffer-based uploads)
const uploadToLocal = async (file, folder = 'general') => {
  try {
    // If file is already saved by multer (has path property), return its URL
    if (file.path) {
      // Extract relative path from absolute path
      const relativePath = file.path.replace(UPLOADS_DIR + path.sep, '').replace(/\\/g, '/');
      const url = `${PUBLIC_URL}/uploads/${relativePath}`;
      console.log(`✅ File already saved by multer: ${url}`);
      return url;
    }
    
    // Fallback: if file has buffer (old way), save it
    if (file.buffer) {
      const folderPath = ensureUploadsDir(folder);
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(folderPath, fileName);
      
      fs.writeFileSync(filePath, file.buffer);
      
      // Return public URL
      const url = `${PUBLIC_URL}/uploads/${folder}/${fileName}`;
      console.log(`✅ File saved locally: ${url}`);
      return url;
    }
    
    throw new Error('File object must have either path or buffer property');
  } catch (error) {
    console.error('Local file upload error:', error);
    throw new Error(`Failed to save file locally: ${error.message}`);
  }
};

// Delete from local storage
const deleteFromLocal = async (url) => {
  try {
    // Handle both full URLs and relative paths
    let filePath;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/uploads/')) {
      // Extract file path from URL
      const urlPath = url.replace(`${PUBLIC_URL}/uploads/`, '').replace('/uploads/', '');
      filePath = path.join(UPLOADS_DIR, urlPath);
    } else {
      // Assume it's already a file path
      filePath = url;
    }
    
    // Normalize path separators
    filePath = filePath.replace(/\//g, path.sep);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ File deleted: ${filePath}`);
      return true;
    }
    console.warn(`⚠️  File not found for deletion: ${filePath}`);
    return false;
  } catch (error) {
    console.error('Local file delete error:', error);
    return false;
  }
};

// Upload file - multer already saves to disk, optionally move to correct folder
const uploadToS3 = async (file, folder = 'general') => {
  // With multer disk storage, file is already saved
  if (file.path) {
    const fileName = path.basename(file.path);
    
    // Get the current folder from the file path (normalize separators)
    let currentRelativePath = file.path.replace(UPLOADS_DIR + path.sep, '').replace(/\\/g, '/');
    
    // Remove "images" from path if it exists (legacy support)
    currentRelativePath = currentRelativePath.replace(/^images\//, '').replace(/\/images\//, '/');
    
    const pathParts = currentRelativePath.split('/');
    const currentFolder = pathParts[0] || 'general';
    
    // Always use the specified folder parameter, not the detected folder
    // This ensures consistent folder structure
    if (currentFolder !== folder) {
      const targetFolderPath = ensureUploadsDir(folder);
      const targetPath = path.join(targetFolderPath, fileName);
      
      try {
        // Move file to correct folder
        fs.renameSync(file.path, targetPath);
        const url = `${PUBLIC_URL}/uploads/${folder}/${fileName}`;
        console.log(`✅ File moved to ${folder}: ${url}`);
        return url;
      } catch (error) {
        console.error(`Failed to move file to ${folder}, using current location:`, error);
        // If move fails, reconstruct URL without "images" in path
        const cleanPath = currentRelativePath.replace(/^images\//, folder + '/');
        const url = `${PUBLIC_URL}/uploads/${cleanPath}`;
        return url;
      }
    }
    
    // File is already in the correct folder - ensure URL doesn't include "images"
    const cleanPath = currentRelativePath.replace(/^images\//, folder + '/');
    const url = `${PUBLIC_URL}/uploads/${cleanPath}`;
    console.log(`✅ File uploaded via multer: ${url}`);
    return url;
  }
  
  // Fallback to local upload if file doesn't have path (backward compatibility)
  return uploadToLocal(file, folder);
};

const deleteFromS3 = async (urlOrKey) => {
  // Always use local storage deletion
  return deleteFromLocal(urlOrKey);
};

// Keep isS3Configured for backward compatibility (always returns false now)
const isS3Configured = () => false;

module.exports = { uploadToS3, deleteFromS3, isS3Configured };

