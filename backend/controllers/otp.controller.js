// controllers/otp.controller.js — OTP send & verify logic
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Otp = require('../models/Otp');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendOtpEmail } = require('../utils/emailService');

/**
 * Generate a cryptographically secure 6-digit OTP.
 * @returns {string} 6-digit numeric string
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * @desc    Send OTP to the provided email
 * @route   POST /api/otp/send
 * @access  Public
 */
const sendOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email } = req.body;

  // Check if email is already registered
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email already exists',
    });
  }

  // Delete any existing OTPs for this email (prevent stacking)
  await Otp.deleteMany({ email: email.toLowerCase().trim() });

  // Generate and save new OTP
  const otp = generateOtp();
  await Otp.create({
    email: email.toLowerCase().trim(),
    otpHash: otp, // Will be hashed by the pre-save hook
  });

  // Send OTP via email
  try {
    await sendOtpEmail(email.trim(), otp);
  } catch (emailError) {
    console.error('[OTP] Email send failed:', emailError.message);
    // Clean up the OTP record if email fails
    await Otp.deleteMany({ email: email.toLowerCase().trim() });
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again.',
    });
  }

  console.log(`[OTP] Code sent to ${email}`);

  res.status(200).json({
    success: true,
    message: 'Verification code sent to your email',
  });
});

/**
 * @desc    Verify the OTP for an email
 * @route   POST /api/otp/verify
 * @access  Public
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, otp } = req.body;

  // Find the most recent OTP for this email
  const otpRecord = await Otp.findOne({ email: email.toLowerCase().trim() })
    .sort({ createdAt: -1 });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: 'Verification code expired or not found. Please request a new one.',
    });
  }

  // Compare OTP
  const isValid = await otpRecord.compareOtp(otp);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code. Please check and try again.',
    });
  }

  // OTP is valid — clean up and respond
  await Otp.deleteMany({ email: email.toLowerCase().trim() });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    verified: true,
  });
});

module.exports = { sendOtp, verifyOtp };
