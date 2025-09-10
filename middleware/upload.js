// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('../config/cloudinaryConfig');

// // File filter for security
// const fileFilter = (req, file, cb) => {
//   const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
//   if (allowedMimes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 400), false);
//   }
// };

// // Enhanced storage configuration
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => {
//     // Dynamic folder based on user or category
//     const folder = req.body.category || 'general';
    
//     return {
//       folder: `ecommerce/${folder}`,
//       allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
//       transformation: [
//         { 
//           width: 1200, 
//           height: 1200, 
//           crop: 'limit',
//           quality: 'auto:good', // Better quality setting
//           fetch_format: 'auto'
//         }
//       ],
//       // Generate unique filename
//       public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
//     };
//   },
// });

// // Enhanced multer configuration
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//     files: 5, // Max 5 files at once
//   },
// });

// // Error handling middleware
// const handleMulterError = (error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         error: 'File size too large. Maximum size is 10MB.'
//       });
//     }
//     if (error.code === 'LIMIT_FILE_COUNT') {
//       return res.status(400).json({
//         success: false,
//         error: 'Too many files. Maximum 5 files allowed.'
//       });
//     }
//   }
//   next(error);
// };

// module.exports = { upload, handleMulterError };



const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('../config/cloudinaryConfig');
// const AppError = require('../utils/appError');

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 400), false);
  }
};

// Use memory storage for direct upload to Cloudinary
const storage = multer.memoryStorage();

// Enhanced multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Max 5 files at once
  },
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: options.folder || 'ecommerce/general',
        // transformation: [
        //   {
        //     width: 1200,
        //     height: 1200,
        //     crop: 'limit',
        //     quality: 'auto:good',
        //     fetch_format: 'auto'
        //   }
        // ],
        public_id: options.public_id || `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
};

// Error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 5 files allowed.'
      });
    }
  }
  next(error);
};

module.exports = { upload, handleMulterError, uploadToCloudinary };