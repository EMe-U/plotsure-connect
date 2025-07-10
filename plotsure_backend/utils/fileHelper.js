const fs = require('fs');
const path = require('path');

// Delete file from filesystem
exports.deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      return resolve(true);
    }

    const fullPath = path.join(__dirname, '..', filePath);
    
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        // File doesn't exist, consider it deleted
        return resolve(true);
      }

      fs.unlink(fullPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
          return reject(unlinkErr);
        }
        resolve(true);
      });
    });
  });
};

// Delete multiple files
exports.deleteFiles = async (filePaths) => {
  const results = await Promise.allSettled(
    filePaths.map(filePath => this.deleteFile(filePath))
  );
  
  const failed = results.filter(result => result.status === 'rejected');
  if (failed.length > 0) {
    console.error('Some files failed to delete:', failed);
  }
  
  return { success: failed.length === 0, failed: failed.length };
};

// Get file size
exports.getFileSize = (filePath) => {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, '..', filePath);
    
    fs.stat(fullPath, (err, stats) => {
      if (err) {
        return reject(err);
      }
      resolve(stats.size);
    });
  });
};

// Check if file exists
exports.fileExists = (filePath) => {
  return new Promise((resolve) => {
    const fullPath = path.join(__dirname, '..', filePath);
    
    fs.access(fullPath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
};

// Get file extension
exports.getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Get file name without extension
exports.getFileNameWithoutExtension = (filename) => {
  return path.basename(filename, path.extname(filename));
};

// Format file size for display
exports.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file type
exports.validateFileType = (filename, allowedTypes) => {
  const extension = this.getFileExtension(filename);
  return allowedTypes.includes(extension);
};

// Create directory if it doesn't exist
exports.ensureDirectoryExists = (dirPath) => {
  const fullPath = path.join(__dirname, '..', dirPath);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    return true;
  }
  return false;
};

// Copy file
exports.copyFile = (source, destination) => {
  return new Promise((resolve, reject) => {
    const sourcePath = path.join(__dirname, '..', source);
    const destPath = path.join(__dirname, '..', destination);
    
    // Ensure destination directory exists
    this.ensureDirectoryExists(path.dirname(destination));
    
    fs.copyFile(sourcePath, destPath, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(true);
    });
  });
};

// Move file
exports.moveFile = async (source, destination) => {
  try {
    await this.copyFile(source, destination);
    await this.deleteFile(source);
    return true;
  } catch (error) {
    throw error;
  }
};