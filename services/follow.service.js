// services/follow.service.js — Follow/unfollow API
import api from './api';

/**
 * Follow a user
 */
export const followUser = async (userId) => {
  const { data } = await api.post(`/follows/${userId}`);
  return data;
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (userId) => {
  const { data } = await api.delete(`/follows/${userId}`);
  return data;
};

/**
 * Accept a follow request
 */
export const acceptFollow = async (userId) => {
  const { data } = await api.put(`/follows/${userId}/accept`);
  return data;
};

/**
 * Decline a follow request
 */
export const declineFollow = async (userId) => {
  const { data } = await api.delete(`/follows/${userId}/decline`);
  return data;
};

/**
 * Check follow status with a user
 */
export const checkFollowStatus = async (userId) => {
  const { data } = await api.get(`/follows/status/${userId}`);
  return data;
};

/**
 * Get followers of a user
 */
export const getFollowers = async (userId, page = 1, limit = 20) => {
  const { data } = await api.get(`/follows/followers/${userId}`, { params: { page, limit } });
  return data;
};

/**
 * Get users a user is following
 */
export const getFollowing = async (userId, page = 1, limit = 20) => {
  const { data } = await api.get(`/follows/following/${userId}`, { params: { page, limit } });
  return data;
};
