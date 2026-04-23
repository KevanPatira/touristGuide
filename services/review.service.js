// services/review.service.js — Review service layer
import api from './api';

/**
 * Get reviews for a destination (paginated).
 * @param {string} destinationId - Destination MongoDB _id
 * @param {Object} [options] - Query options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @param {string} [options.sort] - 'helpful', 'rating_high', 'rating_low'
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getReviews = async (destinationId, options = {}) => {
  const { page = 1, limit = 10, sort } = options;
  const response = await api.get(`/reviews/destination/${destinationId}`, {
    params: { page, limit, sort },
  });
  return response.data;
};

/**
 * Create a review for a destination.
 * @param {string} destinationId - Destination MongoDB _id
 * @param {Object} data - Review data
 * @param {number} data.rating - 1-5
 * @param {string} [data.title]
 * @param {string} [data.body]
 * @param {Array<string>} [data.images]
 * @param {string} [data.visitDate] - ISO date string
 * @returns {Promise<Object>} Created review
 */
export const createReview = async (destinationId, data) => {
  const response = await api.post(`/reviews/destination/${destinationId}`, data);
  return response.data.data;
};

/**
 * Edit own review.
 * @param {string} reviewId - Review MongoDB _id
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated review
 */
export const updateReview = async (reviewId, data) => {
  const response = await api.patch(`/reviews/${reviewId}`, data);
  return response.data.data;
};

/**
 * Delete own review.
 * @param {string} reviewId - Review MongoDB _id
 * @returns {Promise<void>}
 */
export const deleteReview = async (reviewId) => {
  await api.delete(`/reviews/${reviewId}`);
};

/**
 * Mark a review as helpful (upvote).
 * @param {string} reviewId - Review MongoDB _id
 * @returns {Promise<{helpful: number}>} Updated helpful count
 */
export const markHelpful = async (reviewId) => {
  const response = await api.post(`/reviews/${reviewId}/helpful`);
  return response.data.data;
};
