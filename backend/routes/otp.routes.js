// routes/otp.routes.js — OTP verification routes
const express = require('express');
const { body } = require('express-validator');
const { sendOtp, verifyOtp } = require('../controllers/otp.controller');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter: max 5 OTP requests per email per 15 minutes
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/otp/send — Send OTP to email
router.post(
  '/send',
  otpLimiter,
  [
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email'),
  ],
  sendOtp
);

// POST /api/otp/verify — Verify OTP code
router.post(
  '/verify',
  [
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
      .isNumeric().withMessage('OTP must be numeric'),
  ],
  verifyOtp
);

module.exports = router;
