// services/media.service.js — Upload media files to backend → Cloudinary
import api from './api';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress an image before uploading.
 * Resizes to max 1080px wide and reduces quality.
 * @param {string} uri - local file URI
 * @returns {{ uri: string, width: number, height: number }}
 */
export const compressImage = async (uri) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result;
  } catch (e) {
    console.log('[media] Compression failed, using original:', e.message);
    return { uri };
  }
};

/**
 * Upload a single image/video file to the backend.
 * Uses multipart/form-data (FormData) so the file goes as a binary blob.
 *
 * @param {string} uri - local file URI (from ImagePicker or camera)
 * @param {string} type - 'image' or 'video'
 * @param {function} onProgress - optional callback(percentage: number)
 * @returns {{ url, publicId, type, width, height, bytes, format }}
 */
export const uploadMedia = async (uri, type = 'image', onProgress = null) => {
  // Compress images before upload
  let uploadUri = uri;
  if (type === 'image') {
    const compressed = await compressImage(uri);
    uploadUri = compressed.uri;
  }

  // Build FormData
  const formData = new FormData();
  const filename = uploadUri.split('/').pop() || `upload_${Date.now()}.jpg`;
  const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';

  formData.append('media', {
    uri: uploadUri,
    name: filename,
    type: mimeType,
  });

  const { data } = await api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60s timeout for uploads
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress(pct);
      }
    },
  });

  return data;
};

/**
 * Upload multiple files in parallel.
 * @param {Array<{uri: string, type: string}>} files
 * @param {function} onProgress - callback(fileIndex, percentage)
 * @returns {Array<{url, publicId, type, ...}>}
 */
export const uploadMultipleMedia = async (files, onProgress = null) => {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadMedia(
      file.uri,
      file.type || 'image',
      (pct) => onProgress?.(i, pct)
    );
    results.push(result.data);
  }
  return results;
};

/**
 * Delete a media asset from Cloudinary via the backend.
 * @param {string} publicId
 * @param {string} type - 'image' or 'video'
 */
export const deleteMedia = async (publicId, type = 'image') => {
  const { data } = await api.delete(`/media/${encodeURIComponent(publicId)}`, {
    params: { type },
  });
  return data;
};
