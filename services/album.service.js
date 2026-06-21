// services/album.service.js — Trip albums API
import api from './api';
import { uploadMultipleMedia } from './media.service';

/**
 * Create a new trip album
 * @param {string} name - Album name
 * @param {Array<{uri: string, type: string}>} mediaItems - Array of local media objects
 * @param {function} onProgress - Optional callback(percentage: number)
 */
export const createAlbum = async (name, mediaItems = [], onProgress = null) => {
  let uploadedMedia = [];

  // 1. Upload media to Cloudinary if provided
  if (mediaItems && mediaItems.length > 0) {
    const results = await uploadMultipleMedia(mediaItems, (index, pct) => {
      // Calculate overall progress across all files
      if (onProgress) {
        const overallProgress = Math.round(((index * 100) + pct) / mediaItems.length);
        onProgress(overallProgress);
      }
    });

    uploadedMedia = results.map(res => ({
      url: res.url,
      publicId: res.publicId,
      type: res.type || 'image',
      width: res.width,
      height: res.height,
    }));
  }

  // 2. Create the album on the backend
  const { data } = await api.post('/albums', {
    name,
    media: uploadedMedia,
  });
  
  return data;
};

/**
 * Get all albums for the current user
 * @param {number} page 
 * @param {number} limit 
 */
export const getMyAlbums = async (page = 1, limit = 20) => {
  const { data } = await api.get('/albums', { params: { page, limit } });
  return data;
};

/**
 * Get a specific album by ID
 * @param {string} albumId 
 */
export const getAlbum = async (albumId) => {
  const { data } = await api.get(`/albums/${albumId}`);
  return data;
};

/**
 * Delete an album
 * @param {string} albumId 
 */
export const deleteAlbum = async (albumId) => {
  const { data } = await api.delete(`/albums/${albumId}`);
  return data;
};
