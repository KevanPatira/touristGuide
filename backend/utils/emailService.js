// utils/emailService.js — Nodemailer transporter for sending OTP emails
const nodemailer = require('nodemailer');

// Create reusable transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

/**
 * Send a 6-digit OTP to the user's email with a styled HTML template.
 * @param {string} email - Recipient email address
 * @param {string} otp - The 6-digit OTP code
 * @returns {Promise<void>}
 */
const sendOtpEmail = async (email, otp) => {
  const digits = otp.split('');

  const mailOptions = {
    from: `"TouristSync" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Your TouristSync Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0; padding:0; background-color:#0a0f1a; font-family:'Segoe UI',Roboto,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a; padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#111827,#1a2332); border:1px solid rgba(201,168,76,0.3); border-radius:20px; overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding:32px 32px 16px; text-align:center; border-bottom:1px solid rgba(201,168,76,0.15);">
                    <h1 style="margin:0; color:#c9a84c; font-size:24px; font-weight:700; letter-spacing:1px;">
                      🧭 TouristSync
                    </h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <h2 style="margin:0 0 8px; color:#f5f0e8; font-size:20px; font-weight:600; text-align:center;">
                      Verify Your Email
                    </h2>
                    <p style="margin:0 0 24px; color:#9ca3af; font-size:14px; text-align:center; line-height:1.5;">
                      Enter this code to complete your registration. It expires in <strong style="color:#c9a84c;">5 minutes</strong>.
                    </p>
                    <!-- OTP Digits -->
                    <table align="center" cellpadding="0" cellspacing="8" style="margin:0 auto 24px;">
                      <tr>
                        ${digits.map(d => `
                          <td style="width:48px; height:56px; background:#0a0f1a; border:2px solid #c9a84c; border-radius:12px; text-align:center; vertical-align:middle;">
                            <span style="color:#f5f0e8; font-size:28px; font-weight:700; letter-spacing:2px;">${d}</span>
                          </td>
                        `).join('')}
                      </tr>
                    </table>
                    <p style="margin:0; color:#6b7280; font-size:12px; text-align:center; line-height:1.5;">
                      If you didn't request this code, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:16px 32px; text-align:center; border-top:1px solid rgba(201,168,76,0.1);">
                    <p style="margin:0; color:#4b5563; font-size:11px;">
                      © ${new Date().getFullYear()} TouristGuide. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Verify that the SMTP transporter is configured correctly.
 * @returns {Promise<boolean>}
 */
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP transporter verified');
    return true;
  } catch (error) {
    console.warn('⚠️  SMTP transporter not configured:', error.message);
    return false;
  }
};

module.exports = { sendOtpEmail, verifyTransporter };
