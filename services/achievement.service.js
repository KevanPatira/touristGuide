// services/achievement.service.js — Achievements & Leaderboard API
import api from './api';

/**
 * Get global leaderboard ranked by achievementPoints
 * @param {number} page 
 * @param {number} limit 
 * @param {string} search - Optional search term
 */
export const getLeaderboard = async (page = 1, limit = 20, search = '') => {
  const params = { page, limit };
  if (search) params.search = search;
  
  const { data } = await api.get('/achievements/leaderboard', { params });
  return data;
};

/**
 * Get current user's achievements and global rank
 */
export const getMyAchievements = async () => {
  const { data } = await api.get('/achievements/me');
  return data;
};

/**
 * Get any user's achievements
 * @param {string} userId 
 */
export const getUserAchievements = async (userId) => {
  const { data } = await api.get(`/achievements/user/${userId}`);
  return data;
};
