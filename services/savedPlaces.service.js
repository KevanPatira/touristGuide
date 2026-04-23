// services/savedPlaces.service.js — Saved places service layer
import api from './api';

/**
 * Get all saved places for the current user.
 * @param {number} [page=1] - Page number
 * @param {number} [limit=20] - Items per page
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getSavedPlaces = async (page = 1, limit = 20) => {
  const response = await api.get('/saved', { params: { page, limit } });
  return response.data;
};

/**
 * Save (bookmark) a destination.
 * @param {string} destinationId - Destination MongoDB _id
 * @param {string} [note] - Optional personal note
 * @returns {Promise<Object>} Saved place object
 */
export const savePlace = async (destinationId, note = '') => {
  const response = await api.post(`/saved/${destinationId}`, { note });
  return response.data.data;
};

/**
 * Remove a destination from saved.
 * @param {string} destinationId - Destination MongoDB _id
 * @returns {Promise<void>}
 */
export const unsavePlace = async (destinationId) => {
  await api.delete(`/saved/${destinationId}`);
};

/**
 * Update a personal note on a saved destination.
 * @param {string} destinationId - Destination MongoDB _id
 * @param {string} note - New note content
 * @returns {Promise<Object>} Updated saved place
 */
export const updateNote = async (destinationId, note) => {
  const response = await api.patch(`/saved/${destinationId}`, { note });
  return response.data.data;
};
