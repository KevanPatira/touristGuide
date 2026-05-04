// middleware/auth.middleware.js — JWT verification middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory set of blacklisted (logged-out) tokens
// In production, use Redis or a database table
const tokenBlacklist = new Set();

/**
 * Middleware to verify JWT Bearer token.
 * Attaches req.user with { id, email } from token payload.
 * Returns 401 if token is missing, invalid, expired, or blacklisted.
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided',
    });
  }

  // Check if token has been blacklisted (logged out)
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Token has been invalidated — please log in again',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists',
      });
    }

    // Attach user to request
    req.user = { id: decoded.id, email: decoded.email };
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired — please log in again',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid token',
    });
  }
};

/**
 * Add a token to the blacklist (used on logout).
 * @param {string} token - JWT token to invalidate
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

module.exports = { protect, blacklistToken, tokenBlacklist };
