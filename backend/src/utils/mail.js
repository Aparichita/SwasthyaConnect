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
export const sendMail = async ({ to, subject, text, html }) => {
  try {
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    const mailOptions = {
      from: `"SwasthyaConnect" <${process.env.EMAIL_USER}>`, // sender
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    console.error("Email error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    
    // Check if email credentials are missing
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("⚠️ EMAIL_USER or EMAIL_PASS not set in .env file");
      throw new Error("Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in .env");
    }
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
};
