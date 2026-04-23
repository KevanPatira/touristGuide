// services/destination.service.js — Destination service layer
import api from './api';

/**
 * Get destinations with optional filters.
 * @param {Object} [filters] - Query filters
 * @param {string} [filters.category] - Category filter
 * @param {string} [filters.country] - Country filter
 * @param {string} [filters.state] - State filter
 * @param {string} [filters.sort] - Sort by: 'rating', 'name', 'rank'
 * @param {number} [filters.page] - Page number
 * @param {number} [filters.limit] - Items per page
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getDestinations = async (filters = {}) => {
  const response = await api.get('/destinations', { params: filters });
  return response.data;
};

/**
 * Get featured destinations.
 * @param {number} [limit=10] - Max results
 * @returns {Promise<Array>}
 */
export const getFeatured = async (limit = 10) => {
  const response = await api.get('/destinations/featured', { params: { limit } });
  return response.data.data;
};

/**
 * Find destinations near a geographic point.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} [radius=50] - Radius in km
 * @returns {Promise<Array>}
 */
export const getNearby = async (lat, lng, radius = 50) => {
  const response = await api.get('/destinations/nearby', { params: { lat, lng, radius } });
  return response.data.data;
};

/**
 * Search destinations by text query.
 * @param {string} query - Search text
 * @param {number} [limit=20] - Max results
 * @returns {Promise<Array>}
 */
export const searchDestinations = async (query, limit = 20) => {
  const response = await api.get('/destinations/search', { params: { q: query, limit } });
  return response.data.data;
};

/**
 * Get a single destination by ID (includes reviews).
 * @param {string} id - Destination MongoDB _id
 * @returns {Promise<Object>} Destination with reviews
 */
export const getDestination = async (id) => {
  const response = await api.get(`/destinations/${id}`);
  return response.data.data;
};
