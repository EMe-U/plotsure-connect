const s3Helper = require('../config/s3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const stream = require('stream');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadDirs = {
  documents: path.join(__dirname, '../uploads/documents'),
  images: path.join(__dirname, '../uploads/images'),
  videos: path.join(__dirname, '../uploads/videos')
};

Object.values(uploadDirs).forEach(ensureDirectoryExists);

// File filter function
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// Generate unique filename
const generateFilename = (originalname) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalname);
  const nameWithoutExt = path.basename(originalname, extension);
  return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
};

// S3 upload handler for documents, images, videos
const s3UploadHandler = (fieldName, allowedTypes, maxSize) => {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter(allowedTypes),
    limits: { fileSize: maxSize }
  }).array(fieldName, 10);
};

// Helper to upload files to S3 after multer parses them
async function uploadFilesToS3(files, folder) {
  const uploaded = [];
  for (const file of files) {
    const key = `${folder}/${Date.now()}_${file.originalname}`;
    const result = await s3Helper.uploadFile(file.buffer, key, file.mimetype);
    uploaded.push({
      ...file,
      s3Key: key,
      s3Url: result.Location
    });
  }
  return uploaded;
}

// File type configurations
const documentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

const imageTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const videoTypes = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm'
];

// File size limits (in bytes)
const fileSizeLimits = {
  documents: 10 * 1024 * 1024, // 10MB
  images: 5 * 1024 * 1024,     // 5MB
  videos: 50 * 1024 * 1024     // 50MB
};

// Upload middleware for documents
exports.uploadDocuments = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirs.documents);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  }),
  fileFilter: fileFilter(documentTypes),
  limits: {
    fileSize: fileSizeLimits.documents
  }
}).array('documents', 10); // Allow up to 10 documents

// Upload middleware for images
exports.uploadImages = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirs.images);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  }),
  fileFilter: fileFilter(imageTypes),
  limits: {
    fileSize: fileSizeLimits.images
  }
}).array('images', 20); // Allow up to 20 images

// Upload middleware for videos
exports.uploadVideos = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirs.videos);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  }),
  fileFilter: fileFilter(videoTypes),
  limits: {
    fileSize: fileSizeLimits.videos
  }
}).array('videos', 5); // Allow up to 5 videos

// Mixed upload middleware for listing creation
exports.uploadListingFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath;
      if (documentTypes.includes(file.mimetype)) {
        uploadPath = uploadDirs.documents;
      } else if (imageTypes.includes(file.mimetype)) {
        uploadPath = uploadDirs.images;
      } else if (videoTypes.includes(file.mimetype)) {
        uploadPath = uploadDirs.videos;
      } else {
        return cb(new Error('Invalid file type'), false);
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, generateFilename(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allAllowedTypes = [...documentTypes, ...imageTypes, ...videoTypes];
    if (allAllowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  limits: {
    fileSize: Math.max(...Object.values(fileSizeLimits)) // Use the largest limit
  }
}).fields([
  { name: 'documents', maxCount: 10 },
  { name: 'images', maxCount: 20 },
  { name: 'videos', maxCount: 5 }
]);

// Single file upload middleware
exports.uploadSingle = (fieldName, fileTypes, maxSize) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        let uploadPath;
        if (documentTypes.includes(file.mimetype)) {
          uploadPath = uploadDirs.documents;
        } else if (imageTypes.includes(file.mimetype)) {
          uploadPath = uploadDirs.images;
        } else if (videoTypes.includes(file.mimetype)) {
          uploadPath = uploadDirs.videos;
        } else {
          return cb(new Error('Invalid file type'), false);
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        cb(null, generateFilename(file.originalname));
      }
    }),
    fileFilter: fileFilter(fileTypes),
    limits: {
      fileSize: maxSize
    }
  }).single(fieldName);
};

// Error handling middleware for multer
exports.handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Please upload a smaller file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Please reduce the number of files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please check your upload fields.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};