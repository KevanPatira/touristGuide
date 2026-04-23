// services/comment.service.js — Comment API
import api from './api';

/**
 * Get comments for a post (paginated)
 */
export const getComments = async (postId, page = 1, limit = 20) => {
  const { data } = await api.get(`/comments/${postId}`, { params: { page, limit } });
  return data;
};

/**
 * Add a comment to a post
 */
export const addComment = async (postId, text) => {
  const { data } = await api.post(`/comments/${postId}`, { text });
  return data;
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId) => {
  const { data } = await api.delete(`/comments/${commentId}`);
  return data;
};
