// services/notification.service.js — Notification API
import api from './api';

/**
 * Get notifications (paginated)
 */
export const getNotifications = async (page = 1, limit = 30) => {
  const { data } = await api.get('/notifications', { params: { page, limit } });
  return data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count');
  return data;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notifId) => {
  const { data } = await api.put(`/notifications/${notifId}/read`);
  return data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const { data } = await api.put('/notifications/read-all');
  return data;
};
