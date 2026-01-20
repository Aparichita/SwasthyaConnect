// backend/src/controllers/auth.controller.js
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { generateToken } from "../utils/token.js";
import bcrypt from "bcryptjs";
import { sendMail } from "../utils/mail.js";
import crypto from "crypto";

/* ======================================================
   REGISTER USER
====================================================== */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, city, ...rest } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available");
  }

  const userExists =
    (await Patient.findOne({ email })) ||
    (await Doctor.findOne({ email }));

  if (userExists && userExists.isVerified) {
    throw new ApiError(400, "User already exists");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const commonData = {
    name,
    email,
    password,
    role,
    city,
    isVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: Date.now() + 60 * 60 * 1000, // 1 hour
  };

  console.log("📝 Creating user account...");
  let user;
  if (role === "patient") {
    user = await Patient.create(commonData);
  } else {
    user = await Doctor.create({ ...commonData, ...rest });
  }
  console.log("✅ User created successfully");

  // ✅ CRITICAL: Send email IMMEDIATELY after user creation
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

  console.log("📧 Preparing to send verification email...");
  console.log("   To:", email);
  console.log("   Verification URL:", verificationUrl);

  // ✅ Send response IMMEDIATELY without waiting for email
  res.status(201).json(
    new ApiResponse(
      201,
      null,
      "Registration successful! Please check your email for verification link."
    )
  );

  // 🔄 Send email in background (non-blocking)
  // Don't await this - it will send asynchronously
  sendMail({
    to: email,
    subject: "Verify Your SwasthyaConnect Account",
    html: `
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
            <h2>Hi ${name},</h2>
            <p>Thank you for registering with SwasthyaConnect! Please verify your email address to complete your registration.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #14b8a6; font-size: 12px;">${verificationUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't create an account with SwasthyaConnect, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 SwasthyaConnect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to SwasthyaConnect! Please verify your email by clicking this link: ${verificationUrl}. This link will expire in 1 hour.`,
  })
    .then(() => {
      console.log("✅ Verification email sent successfully to:", email);
    })
    .catch((emailError) => {
      console.error("❌ Failed to send verification email:", emailError);
      console.error("   Email:", email);
      console.error("   Error details:", emailError.message);
      // User is already created - they can use resend verification
    });
});

/* ======================================================
   LOGIN USER
====================================================== */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user =
    role === "patient"
      ? await Patient.findOne({ email }).select("+password")
      : await Doctor.findOne({ email }).select("+password");

  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  if (!user.isVerified) {
    // Generate new token for unverified users
    const newToken = crypto.randomBytes(32).toString("hex");

    user.emailVerificationToken = newToken;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email/${newToken}`;

    console.log("📧 Sending verification email to unverified user:", email);
    
    try {
      await sendMail({
        to: email,
        subject: "Verify Your SwasthyaConnect Account",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #14b8a6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Verify Your Email</h1>
              </div>
              <div class="content">
                <h2>Hi ${user.name},</h2>
                <p>You attempted to log in, but your email is not verified yet.</p>
                <p style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </p>
                <p>Or copy this link: <br><span style="word-break: break-all; color: #14b8a6; font-size: 12px;">${verificationUrl}</span></p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Please verify your email: ${verificationUrl}`,
      });
      
      console.log("✅ Verification email sent to:", email);
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
    }

    return res.status(403).json({
      success: false,
      message: "Please verify your email. A new verification link has been sent to your inbox.",
    });
  }

  const token = generateToken({ id: user._id, role: user.role });
  user.password = undefined;

  res.status(200).json(
    new ApiResponse(200, { user, token }, "Login successful")
  );
});

/* ======================================================
   VERIFY EMAIL  ✅ FINAL FIX
====================================================== */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  console.log("🔍 Verifying token:", token);

  // IMPORTANT: explicitly select hidden fields
  let user =
    await Patient.findOne({ emailVerificationToken: token })
      .select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    user = await Doctor.findOne({ emailVerificationToken: token })
      .select("+emailVerificationToken +emailVerificationExpires");
  }

  if (!user) {
    console.error("❌ Token not found in DB");
    throw new ApiError(400, "Invalid verification token");
  }

  if (user.emailVerificationExpires < Date.now()) {
    console.error("❌ Token expired");
    throw new ApiError(400, "Verification token expired");
  }

  user.isVerified = true;
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save();

  console.log("✅ Email verified:", user.email);

  return res.status(200).json(
    new ApiResponse(200, { verified: true }, "Email verified successfully")
  );
});

/* ======================================================
   GET CURRENT USER
====================================================== */
export const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const { id, role } = req.user;

  const user =
    role === "patient"
      ? await Patient.findById(id).select("-password")
      : await Doctor.findById(id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(
    new ApiResponse(200, user, "User fetched successfully")
  );
});