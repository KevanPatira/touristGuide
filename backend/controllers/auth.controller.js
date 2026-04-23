// controllers/auth.controller.js — Authentication controller
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { blacklistToken } = require('../middleware/auth.middleware');

/**
 * Generate a signed JWT token for a user.
 * @param {string} id - User's MongoDB _id
 * @param {string} email - User's email
 * @returns {string} Signed JWT
 */
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email already exists',
    });
  }

  // Create user (passwordHash is hashed via pre-save hook)
  const user = await User.create({
    name,
    email,
    passwordHash: password,
  });

  // Generate JWT
  const token = generateToken(user._id, user.email);

  // Return user data (passwordHash excluded by toJSON transform)
  res.status(201).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      preferredLanguage: user.preferredLanguage,
      homeCountry: user.homeCountry,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc    Login user with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  // Find user and include passwordHash for verification
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id, user.email);

  res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      preferredLanguage: user.preferredLanguage,
      homeCountry: user.homeCountry,
      bio: user.bio,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * @desc    Get any user's public profile by ID
 * @route   GET /api/auth/user/:id
 * @access  Private
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      username: user.username || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      isPrivate: user.isPrivate || false,
      followerCount: user.followerCount || 0,
      followingCount: user.followingCount || 0,
      postCount: user.postCount || 0,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc    Update user profile (name, avatar, preferredLanguage, bio, homeCountry)
 * @route   PATCH /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  // Only allow updating specific fields
  const allowedFields = ['name', 'avatar', 'preferredLanguage', 'bio', 'homeCountry', 'username', 'isPrivate'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  ).select('-passwordHash');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * @desc    Logout user (blacklist token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Add token to blacklist
  if (req.token) {
    blacklistToken(req.token);
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = { register, login, getMe, getUserById, updateMe, logout };
