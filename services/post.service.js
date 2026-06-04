// services/post.service.js — Community posts API
import api from './api';

/**
 * Get paginated feed of posts
 * @param {string} sort - 'recent' or 'popular'
 * @param {number} page
 * @param {number} limit
 * @param {string} userId - optional, filter by author
 */
export const getPosts = async (sort = 'recent', page = 1, limit = 15, userId = null) => {
  const params = { sort, page, limit };
  if (userId) params.userId = userId;
  const { data } = await api.get('/posts', { params });
  return data;
};

/**
 * Create a new post
 * @param {string} text
 * @param {string|null} imageUrl - legacy single image URL
 * @param {string} location
 * @param {Array} media - array of { url, publicId, type, width, height }
 */
export const createPost = async (text, imageUrl = null, location = 'My Location', media = []) => {
  const { data } = await api.post('/posts', { text, imageUrl, location, media });
  return data;
};

/**
 * Like a post
 */
export const likePost = async (postId) => {
  const { data } = await api.post(`/posts/${postId}/like`);
  return data;
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId) => {
  const { data } = await api.post(`/posts/${postId}/unlike`);
  return data;
};

/**
 * Delete a post
 */
export const deletePost = async (postId) => {
  const { data } = await api.delete(`/posts/${postId}`);
  return data;
};
