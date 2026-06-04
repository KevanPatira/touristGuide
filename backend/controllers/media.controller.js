// controllers/media.controller.js — Upload & delete media via Cloudinary
const cloudinary = require('../config/cloudinary.config');
const { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } = require('../middleware/upload.middleware');

/**
 * Upload a single media file to Cloudinary
 * POST /api/media/upload
 * Expects multipart/form-data with field 'media'
 */
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const { mimetype, size, buffer } = req.file;

    // Per-type size check
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimetype);
    if (isImage && size > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Image too large (${(size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`,
      });
    }

    // Determine resource type for Cloudinary
    const resourceType = isImage ? 'image' : 'video';

    // Upload buffer to Cloudinary via stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'touristguide/posts',
          resource_type: resourceType,
          transformation: isImage
            ? [
                { width: 1080, crop: 'limit' },       // Max width 1080px
                { quality: 'auto:good' },              // Smart compression
                { fetch_format: 'auto' },              // WebP/AVIF where supported
              ]
            : [
                { width: 720, crop: 'limit' },
                { quality: 'auto:good' },
              ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        type: resourceType,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
      },
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload media' });
  }
};

/**
 * Upload multiple files (up to 5)
 * POST /api/media/upload-multiple
 */
exports.uploadMultipleMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }

    const results = [];

    for (const file of req.files) {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
      const resourceType = isImage ? 'image' : 'video';

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        results.push({ error: `${file.originalname} too large (max 5MB)` });
        continue;
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'touristguide/posts',
            resource_type: resourceType,
            transformation: isImage
              ? [{ width: 1080, crop: 'limit' }, { quality: 'auto:good' }, { fetch_format: 'auto' }]
              : [{ width: 720, crop: 'limit' }, { quality: 'auto:good' }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      results.push({
        url: result.secure_url,
        publicId: result.public_id,
        type: resourceType,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
      });
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Multi-upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload media' });
  }
};

/**
 * Delete media from Cloudinary
 * DELETE /api/media/:publicId
 */
exports.deleteMedia = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID is required' });
    }

    // Reconstruct full public ID (may contain folder path with slashes)
    const fullPublicId = req.query.folder
      ? `${req.query.folder}/${publicId}`
      : publicId;

    const result = await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: req.query.type || 'image',
    });

    res.json({
      success: true,
      data: { result: result.result },
    });
  } catch (error) {
    console.error('Media delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete media' });
  }
};
