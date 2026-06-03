// middleware/upload.middleware.js — Multer file upload with validation
const multer = require('multer');
const path = require('path');

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
];

const ALL_ALLOWED = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;  // 20MB

// Use memory storage — files stay in RAM buffer, never hit disk
const storage = multer.memoryStorage();

// File filter — validate type before accepting
const fileFilter = (req, file, cb) => {
  if (ALL_ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV, AVI`), false);
  }
};

/**
 * Single-file upload middleware.
 * Field name: 'media'
 * Max size: 20MB (enforced here; we'll do per-type checks in the controller)
 */
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
}).single('media');

/**
 * Multi-file upload middleware (up to 5 files).
 * Field name: 'media'
 */
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
}).array('media', 5);

/**
 * Wrapper that handles multer errors gracefully
 */
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Max: 5MB for images, 20MB for videos.',
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 files per upload.',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadSingle: handleUpload(uploadSingle),
  uploadMultiple: handleUpload(uploadMultiple),
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
};
