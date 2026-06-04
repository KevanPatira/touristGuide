// services/auth.service.js — Authentication service layer
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Register a new user account.
 * Stores JWT token on success.
 * @param {string} name - User's full name
 * @param {string} email - Email address
 * @param {string} password - Password (min 6 chars)
 * @returns {Promise<{token: string, user: Object}>}
 */
export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  const { token, user } = response.data;
  await AsyncStorage.setItem('authToken', token);
  return { token, user };
};

/**
 * Login with email and password.
 * Stores JWT token on success.
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<{token: string, user: Object}>}
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;
  await AsyncStorage.setItem('authToken', token);
  return { token, user };
};

/**
 * Get the current authenticated user's profile.
 * @returns {Promise<Object>} User object
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.user;
};

/**
 * Update the current user's profile.
 * @param {Object} data - Fields to update (name, avatar, preferredLanguage, bio, homeCountry)
 * @returns {Promise<Object>} Updated user object
 */
export const updateProfile = async (data) => {
  const response = await api.patch('/auth/me', data);
  return response.data.user;
};



/**
 * Logout the current user.
 * Removes JWT token from storage and blacklists on server.
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (_) {
    // Even if server call fails, clear local token
  }
  await AsyncStorage.removeItem('authToken');
};
