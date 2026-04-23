// services/translation.service.js — Translation history service layer
import api from './api';

/**
 * Save a translation to cloud history.
 * @param {Object} data - Translation data
 * @param {string} data.extractedText - Original extracted text
 * @param {string} data.translatedText - Translated text
 * @param {string} data.sourceLanguage - Source language name
 * @param {string} data.targetLanguage - Target language name
 * @param {string} [data.imageUrl] - Optional image thumbnail URL
 * @returns {Promise<Object>} Saved translation object
 */
export const saveTranslation = async (data) => {
  const response = await api.post('/translations', data);
  return response.data.data;
};

/**
 * Get user's translation history with pagination.
 * @param {number} [page=1] - Page number
 * @param {number} [limit=20] - Items per page
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getHistory = async (page = 1, limit = 20) => {
  const response = await api.get('/translations', { params: { page, limit } });
  return response.data;
};

/**
 * Delete a single translation from history.
 * @param {string} id - Translation ID
 * @returns {Promise<void>}
 */
export const deleteTranslation = async (id) => {
  await api.delete(`/translations/${id}`);
};

/**
 * Clear all translation history for the current user.
 * @returns {Promise<{deletedCount: number}>}
 */
export const clearHistory = async () => {
  const response = await api.delete('/translations');
  return response.data;
};
