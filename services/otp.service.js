// services/otp.service.js — OTP verification API calls
import api from './api';

/**
 * Request an OTP code to be sent to the given email.
 * @param {string} email - Email address to send OTP to
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendOtp = async (email) => {
  const response = await api.post('/otp/send', { email });
  return response.data;
};

/**
 * Verify a 6-digit OTP code for the given email.
 * @param {string} email - Email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, verified: boolean, message: string}>}
 */
export const verifyOtp = async (email, otp) => {
  const response = await api.post('/otp/verify', { email, otp });
  return response.data;
};
