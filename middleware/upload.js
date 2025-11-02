const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('./errorHandler');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        // Accept common image formats
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError('Only JPEG, PNG, GIF, and WebP images are allowed', 400), false);
        }
    } else {
        cb(new AppError('Only image files are allowed', 400), false);
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only one file at a time
    }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size too large. Maximum size is 5MB', 400));
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return next(new AppError('Too many files. Only one file allowed', 400));
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError('Unexpected field name. Use "image" as field name', 400));
        }
        return next(new AppError('File upload error', 400));
    }
    next(error);
};

// Generate unique filename
const generateFileName = (originalName) => {
    const extension = originalName.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0]; // Use first part of UUID for shorter name
    return `${timestamp}-${uniqueId}.${extension}`;
};

module.exports = {
    upload,
    handleMulterError,
    generateFileName
};