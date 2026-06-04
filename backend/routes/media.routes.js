// routes/media.routes.js — Media upload/delete endpoints
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { uploadSingle, uploadMultiple } = require('../middleware/upload.middleware');
const mediaController = require('../controllers/media.controller');

// All routes require authentication
router.use(protect);

// Single file upload
router.post('/upload', uploadSingle, mediaController.uploadMedia);

// Multiple file upload (up to 5)
router.post('/upload-multiple', uploadMultiple, mediaController.uploadMultipleMedia);

// Delete media by publicId
router.delete('/:publicId', mediaController.deleteMedia);

module.exports = router;
