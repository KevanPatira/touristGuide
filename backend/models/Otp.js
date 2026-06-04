// models/Otp.js — OTP schema with auto-expiry (5 minutes TTL)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Auto-delete after 5 minutes (300 seconds)
  },
});

/**
 * Hash OTP before saving
 */
OtpSchema.pre('save', async function (next) {
  if (!this.isModified('otpHash')) return next();
  this.otpHash = await bcrypt.hash(this.otpHash, 10);
  next();
});

/**
 * Compare entered OTP with stored hash
 * @param {string} candidateOtp - OTP to verify
 * @returns {Promise<boolean>}
 */
OtpSchema.methods.compareOtp = async function (candidateOtp) {
  return bcrypt.compare(candidateOtp, this.otpHash);
};

module.exports = mongoose.model('Otp', OtpSchema);
