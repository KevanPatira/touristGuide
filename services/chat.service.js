// services/chat.service.js — Chat + Messages API (MongoDB source of truth)
import api from './api';

/**
 * Create or get a DM chat with another user
 */
export const createOrGetChat = async (participantId) => {
  const { data } = await api.post('/chats', { participantId });
  return data;
};

/**
 * Get all chats for the current user
 */
export const getUserChats = async () => {
  const { data } = await api.get('/chats');
  return data;
};

/**
 * Send a message (MongoDB is source of truth)
 * Returns message with backend-generated ID
 */
export const sendMessage = async (chatId, text) => {
  const { data } = await api.post(`/chats/${chatId}/messages`, { text });
  return data;
};

/**
 * Get messages for a chat (paginated, newest first)
 */
export const getMessages = async (chatId, page = 1, limit = 50) => {
  const { data } = await api.get(`/chats/${chatId}/messages`, { params: { page, limit } });
  return data;
};

/**
 * Mark a chat as read (reset unread count)
 */
export const markChatAsRead = async (chatId) => {
  const { data } = await api.put(`/chats/${chatId}/read`);
  return data;
};

/**
 * Search users to start new chats
 */
export const searchUsers = async (query) => {
  const { data } = await api.get('/chats/search-users', { params: { q: query } });
  return data;
};
