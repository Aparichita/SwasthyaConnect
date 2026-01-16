// backend/src/utils/mail.js
import nodemailer from "nodemailer";

/**
 * Sends an email using Gmail SMTP
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<Object>} info - Email sending result
 */
/**
 * Sends an email using Gmail SMTP
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address (REQUIRED - uses the email passed, not .env)
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<Object>} info - Email sending result
 */
export const sendMail = async ({ to, subject, text, html }) => {
  // Validate recipient email
  if (!to) {
    throw new Error("Recipient email (to) is required");
  }

  // Support both EMAIL_USER/EMAIL_PASS and MAIL_USER/MAIL_PASS for flexibility
  const emailUser = process.env.MAIL_USER || process.env.EMAIL_USER;
  const emailPass = process.env.MAIL_PASS || process.env.EMAIL_PASS;

  // Check if email credentials are missing
  if (!emailUser || !emailPass) {
    console.error("⚠️ Email credentials missing!");
    console.error("   Please set MAIL_USER (or EMAIL_USER) and MAIL_PASS (or EMAIL_PASS) in .env");
    throw new Error("Email configuration missing. Please set MAIL_USER and MAIL_PASS in .env");
  }

  try {
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || process.env.MAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || process.env.MAIL_PORT || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Verify transporter configuration
    await transporter.verify();
    console.log("✅ Email transporter verified successfully");

    const mailOptions = {
      from: `"SwasthyaConnect" <${emailUser}>`, // Sender (from .env)
      to: to, // Recipient (from function parameter - user's email)
      subject,
      text,
      html,
    };

    console.log(`📧 Sending email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("Email error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      to: to, // Log recipient for debugging
    });
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
};
