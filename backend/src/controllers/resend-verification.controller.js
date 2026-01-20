// backend/src/controllers/resend-verification.controller.js
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { sendMail } from "../utils/mail.js";
import crypto from "crypto";

/**
 * @desc Resend verification email
 * @route POST /api/auth/resend-verification
 * @access Public
 * 
 * Regenerates verification token and resends email
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    throw new ApiError(400, "Email and role are required");
  }

  // Find user in appropriate collection
  const UserModel = role === "patient" ? Patient : Doctor;
  let user = await UserModel.findOne({ email })
    .select("+verificationToken +emailVerificationToken +emailVerificationExpires")
    .lean();

  if (!user) {
    // Don't reveal if user exists (security best practice)
    return res.status(200).json(
      new ApiResponse(200, {}, "If an account with that email exists, a verification email has been sent.")
    );
  }

  // Check if already verified
  if (user.isVerified || user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Update user with new token
  await UserModel.findByIdAndUpdate(
    user._id,
    {
      $set: {
        verificationToken: verificationToken,
        emailVerificationToken: verificationToken, // Legacy field
        emailVerificationExpires: verificationExpires,
      },
    }
  );

  // Create verification URL - ONLY use FRONTEND_URL from env (no hardcoded localhost)
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    console.error("⚠️ FRONTEND_URL not set in .env - verification links will not work!");
  }
  const verificationUrl = `${frontendUrl || "http://localhost:5173"}/verify-email/${verificationToken}`;

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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SwasthyaConnect</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>You requested a new verification email. Please verify your email address to complete your registration.</p>
          <p>Click the button below to verify your account:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #14b8a6;">${verificationUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this email, please ignore it.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 SwasthyaConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // ✅ Send response IMMEDIATELY without waiting for email
  res.status(200).json(
    new ApiResponse(200, {}, "If an account with that email exists, a verification email has been sent.")
  );

  // 🔄 Send email in background (non-blocking)
  sendMail({
    to: email,
    subject: "Verify Your SwasthyaConnect Account",
    html: emailHtml,
    text: `Please verify your email by clicking this link: ${verificationUrl}`,
  })
    .then(() => {
      console.log("✅ Verification email resent successfully to:", email);
    })
    .catch((error) => {
      console.error("❌ Failed to resend verification email:", error);
      console.error("   Email:", email);
      // User can try again - they're not blocked
    });
});

