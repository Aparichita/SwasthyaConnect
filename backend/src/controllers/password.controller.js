// backend/src/controllers/password.controller.js
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { sendMail } from "../utils/mail.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * @desc Forgot password - Send reset email
 * @route POST /api/auth/forgot-password
 * @access Public
 * 
 * Generates a reset token and sends email to user
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Search for user in both Patient and Doctor collections
  let user = await Patient.findOne({ email })
    .select("+passwordResetToken +passwordResetExpires")
    .lean();

  let userModel = Patient;
  let userRole = "patient";

  // If not found in Patient, check Doctor collection
  if (!user) {
    user = await Doctor.findOne({ email })
      .select("+passwordResetToken +passwordResetExpires")
      .lean();
    userModel = Doctor;
    userRole = "doctor";
  }

  // Don't reveal if user exists or not (security best practice)
  if (!user) {
    // Still return success to prevent email enumeration
    return res.status(200).json(
      new ApiResponse(200, {}, "If an account with that email exists, a password reset link has been sent.")
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Update user with reset token
  await userModel.findByIdAndUpdate(
    user._id,
    {
      $set: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    }
  );

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

  // Email HTML template
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #14b8a6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SwasthyaConnect</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password for your SwasthyaConnect account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #14b8a6;">${resetUrl}</p>
          <div class="warning">
            <p><strong>⚠️ Important:</strong> This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2024 SwasthyaConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email response immediately (non-blocking for Render free tier)
  res.status(200).json(
    new ApiResponse(200, {}, "If an account with that email exists, a password reset link has been sent.")
  );

  // Send email in background (fire & forget pattern)
  sendMail({
    to: email,
    subject: "Reset Your Password - SwasthyaConnect",
    html: emailHtml,
    text: `Please reset your password by clicking this link: ${resetUrl}. This link expires in 1 hour.`,
  })
    .then(() => {
      console.log(`✅ Password reset email sent to ${email}`);
    })
    .catch((error) => {
      console.error(`⚠️ Failed to send password reset email to ${email}:`, error);
      // Non-blocking: error is logged but doesn't break user experience
    });
});

/**
 * @desc Reset password using token
 * @route POST /api/auth/reset-password/:token
 * @access Public
 * 
 * Validates token and updates password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token) {
    throw new ApiError(400, "Reset token is required");
  }

  if (!password || !confirmPassword) {
    throw new ApiError(400, "Password and confirm password are required");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  // Validate password strength (8-32 chars, letter, number, special char)
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/;
  if (!passwordRegex.test(password)) {
    throw new ApiError(400, "Password must be 8-32 characters with at least one letter, one number, and one special character");
  }

  // Search for user with valid reset token
  let user = await Patient.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() }, // Token not expired
  })
    .select("+passwordResetToken +passwordResetExpires")
    .lean();

  let userModel = Patient;

  // If not found in Patient, check Doctor collection
  if (!user) {
    user = await Doctor.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    })
      .select("+passwordResetToken +passwordResetExpires")
      .lean();
    userModel = Doctor;
  }

  // If token invalid or expired
  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update password and clear reset token
  await userModel.findByIdAndUpdate(
    user._id,
    {
      $set: {
        password: hashedPassword,
      },
      $unset: {
        passwordResetToken: "",
        passwordResetExpires: "",
      },
    }
  );

  res.status(200).json(
    new ApiResponse(200, {}, "Password reset successfully. You can now login with your new password.")
  );
});

