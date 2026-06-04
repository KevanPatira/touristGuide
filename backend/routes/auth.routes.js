// routes/auth.routes.js — Authentication routes
const express = require('express');
const { body } = require('express-validator');
const { register, login, googleSignIn, getMe, getUserById, updateMe, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  registerLimiter,
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/\d/).withMessage('Password must contain at least one number'),
  ],
  register
);

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  login
);

// POST /api/auth/google — Google OAuth sign-in
router.post('/google', googleSignIn);

// GET /api/auth/me — Get current user
router.get('/me', protect, getMe);

// GET /api/auth/user/:id — Get any user's public profile
router.get('/user/:id', protect, getUserById);

// PATCH /api/auth/me — Update profile
router.patch(
  '/me',
  protect,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('avatar')
      .optional()
      .isString().withMessage('Avatar must be a string URL'),
    body('preferredLanguage')
      .optional()
      .isString().withMessage('Preferred language must be a string'),
    body('bio')
      .optional()
      .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('homeCountry')
      .optional()
      .isString().withMessage('Home country must be a string'),
  ],
  updateMe
);

// POST /api/auth/logout
router.post('/logout', protect, logout);

module.exports = router;
