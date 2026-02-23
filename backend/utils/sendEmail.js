/**
 * Email Utility
 * Sends transactional emails via Nodemailer (SMTP/Gmail).
 * Supports HTML and plain-text templates.
 */

const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for port 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false, // Allow self-signed certs in dev
        },
    });
};

/**
 * Send an email.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_FROM || `CRM System <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ''), // Strip HTML for plain-text fallback
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        throw new Error('Email could not be sent. Please try again later.');
    }
};

// ─── Email Templates ─────────────────────────────────────────────────────────

/**
 * Send Email Verification email.
 */
const sendVerificationEmail = async (user, token) => {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    await sendEmail({
        to: user.email,
        subject: '✅ Verify Your Email - CRM System',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 8px;">
        <h2 style="color: #1e293b;">Welcome to CRM System, ${user.name}!</h2>
        <p style="color: #475569;">Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}" 
           style="display: inline-block; padding: 12px 28px; background: #6366f1; color: white; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #94a3b8; font-size: 12px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #cbd5e1; font-size: 12px;">CRM & Sales Management System</p>
      </div>
    `,
    });
};

/**
 * Send Password Reset email.
 */
const sendPasswordResetEmail = async (user, token) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendEmail({
        to: user.email,
        subject: '🔑 Password Reset Request - CRM System',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 8px;">
        <h2 style="color: #1e293b;">Reset Your Password</h2>
        <p style="color: #475569;">Hi ${user.name}, you requested a password reset.</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 28px; background: #ef4444; color: white; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 12px;">This link expires in <strong>30 minutes</strong>. If you didn't request this, please secure your account.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #cbd5e1; font-size: 12px;">CRM & Sales Management System</p>
      </div>
    `,
    });
};

/**
 * Send Welcome email after email verification.
 */
const sendWelcomeEmail = async (user) => {
    await sendEmail({
        to: user.email,
        subject: '🎉 Welcome to CRM System!',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 8px;">
        <h2 style="color: #1e293b;">You're all set, ${user.name}! 🚀</h2>
        <p style="color: #475569;">Your account has been verified. Start managing your leads and deals today.</p>
        <a href="${process.env.CLIENT_URL}/dashboard" 
           style="display: inline-block; padding: 12px 28px; background: #22c55e; color: white; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
          Go to Dashboard
        </a>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #cbd5e1; font-size: 12px;">CRM & Sales Management System</p>
      </div>
    `,
    });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };
