import nodemailer from "nodemailer";

/**
 * Send email using nodemailer
 * @param {string|object} toOrOptions - Email address or options object
 * @param {string} [subject] - Email subject (if first param is string)
 * @param {string} [text] - Email text content (if first param is string)
 * @returns {Promise} Nodemailer info object
 */
export const sendMail = async (toOrOptions, subject, text) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email credentials not configured. Skipping email send.");
      return null;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Support both object and positional parameters
    let mailOptions;
    if (typeof toOrOptions === "object" && toOrOptions !== null) {
      // Object format: { to, subject, text, html }
      mailOptions = {
        from: process.env.EMAIL_USER,
        ...toOrOptions,
      };
    } else {
      // Positional format: (to, subject, text)
      mailOptions = {
        from: process.env.EMAIL_USER,
        to: toOrOptions,
        subject,
        text,
      };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", mailOptions.to);
    return info;
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
    // Don't throw - let the caller handle it
    throw err;
  }
};

// Also export as sendEmail for backward compatibility
export const sendEmail = sendMail;
