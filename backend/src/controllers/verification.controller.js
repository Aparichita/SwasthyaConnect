// backend/src/controllers/verification.controller.js
import crypto from "crypto";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { sendMail } from "../utils/mail.js";

/**
 * @desc Send verification email
 * @route POST /api/verification/send
 * @access Public
 */
export const sendVerificationEmail = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    throw new ApiError(400, "Email and role are required");
  }

  // Check if user already exists and is verified
  const UserModel = role === "patient" ? Patient : Doctor;
  const existingUser = await UserModel.findOne({ email }).select("+emailVerificationToken +emailVerificationExpires");

  if (existingUser && existingUser.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // If user exists but not verified, update token
  if (existingUser) {
    existingUser.emailVerificationToken = verificationToken;
    existingUser.emailVerificationExpires = verificationExpires;
    await existingUser.save();
  }

  // Create verification URL
  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}&role=${role}`;

  // Send verification email
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to SwasthyaConnect</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with SwasthyaConnect! Please verify your email address to complete your registration.</p>
          <p>Click the button below to verify your email:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #14b8a6;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with SwasthyaConnect, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 SwasthyaConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendMail({
      to: email,
      subject: "Verify Your Email - SwasthyaConnect",
      html: emailHtml,
      text: `Please verify your email by clicking this link: ${verificationUrl}`,
    });

    res.status(200).json(
      new ApiResponse(200, { email }, "Verification email sent successfully. Please check your inbox.")
    );
  } catch (error) {
    console.error("Email sending error:", error);
    throw new ApiError(500, "Failed to send verification email");
  }
});

/**
 * @desc Verify email with token
 * @route GET /api/verification/verify
 * @access Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token, email, role } = req.query;

  if (!token || !email || !role) {
    throw new ApiError(400, "Token, email, and role are required");
  }

  const UserModel = role === "patient" ? Patient : Doctor;
  const user = await UserModel.findOne({ email }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    return res.status(200).json(
      new ApiResponse(200, { verified: true }, "Email is already verified")
    );
  }

  if (!user.emailVerificationToken || user.emailVerificationToken !== token) {
    throw new ApiError(400, "Invalid verification token");
  }

  if (user.emailVerificationExpires < new Date()) {
    throw new ApiError(400, "Verification token has expired. Please request a new one.");
  }

  // Verify the email
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.status(200).json(
    new ApiResponse(200, { verified: true }, "Email verified successfully! You can now complete your registration.")
  );
});

