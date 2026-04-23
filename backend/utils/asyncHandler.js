// utils/asyncHandler.js — Wraps async route handlers to catch errors automatically
/**
 * Wraps an async Express route handler so that any thrown errors
 * are automatically forwarded to the global error handler via next().
 * @param {Function} fn - Async route handler (req, res, next) => Promise<void>
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
