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

/**
 * @desc Register a new user (patient or doctor)
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    qualification,
    specialization,
    phone,
    city,
    medical_registration_number,
    state_medical_council,
    experience,
    clinic_name,
    consultation_type,
    consultation_fee,
  } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  // Check if user exists
  let existingUser = await Patient.findOne({ email }).lean();
  if (!existingUser) existingUser = await Doctor.findOne({ email }).lean();

  if (existingUser && existingUser.isVerified) {
    throw new ApiError(400, "User with this email already exists");
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  let newUser;
  if (role === "patient") {
    newUser = await Patient.create({
      name,
      email,
      password,
      role,
      city,
      isVerified: false,
      verificationToken,
      emailVerificationToken: verificationToken, // legacy
      emailVerificationExpires: verificationExpires,
    });
  } else {
    if (!qualification || !specialization || !phone || !medical_registration_number || !state_medical_council || !experience || !consultation_fee) {
      throw new ApiError(400, "All doctor fields are required");
    }
    newUser = await Doctor.create({
      name,
      email,
      password,
      role,
      qualification,
      specialization,
      phone,
      city,
      medical_registration_number,
      state_medical_council,
      experience: parseInt(experience) || 0,
      clinic_name,
      consultation_type: consultation_type || "Both",
      consultation_fee: parseFloat(consultation_fee) || 0,
      isVerified: false,
      verificationToken,
      emailVerificationToken: verificationToken, // legacy
      emailVerificationExpires: verificationExpires,
    });
  }

  // Send verification email
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
      <h2>Welcome to SwasthyaConnect</h2>
      <p>Thank you for registering! Please verify your email:</p>
      <a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:#14b8a6;color:#fff;border-radius:5px;text-decoration:none;">Verify Email</a>
      <p>Or paste this link in your browser: ${verificationUrl}</p>
    </div>
  `;

  sendMail({
    to: email,
    subject: "Verify Your SwasthyaConnect Account",
    html: emailHtml,
    text: `Verify your email: ${verificationUrl}`,
  }).catch((err) => console.error("Email sending failed:", err));

  const token = generateToken({ id: newUser._id, role: newUser.role });
  const userResponse = { ...newUser._doc };
  delete userResponse.password;
  delete userResponse.verificationToken;

  res.status(201).json(
    new ApiResponse(201, { user: userResponse, token }, "User registered successfully. Please check your email to verify your account.")
  );
});

/**
 * @desc Login a user (patient or doctor)
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) throw new ApiError(400, "Email, password, and role are required");

  let user = role === "patient"
    ? await Patient.findOne({ email }).select("+password +isVerified +verificationToken +emailVerificationToken +emailVerificationExpires")
    : await Doctor.findOne({ email }).select("+password +isVerified +verificationToken +emailVerificationToken +emailVerificationExpires");

  if (!user) throw new ApiError(401, "Invalid credentials");

  const isVerified = user.isVerified || false;

  // If not verified, send verification email
  if (!isVerified) {
    if (!user.verificationToken) {
      user.verificationToken = crypto.randomBytes(32).toString("hex");
      user.emailVerificationToken = user.verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email/${user.verificationToken}`;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
        <h2>Verify Your Email Address</h2>
        <p>Please verify your email by clicking below:</p>
        <a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:#14b8a6;color:#fff;border-radius:5px;text-decoration:none;">Verify Email</a>
        <p>Or paste this link in your browser: ${verificationUrl}</p>
      </div>
    `;

    await sendMail({
      to: email,
      subject: "Verify Your SwasthyaConnect Account",
      html: emailHtml,
      text: `Verify your email: ${verificationUrl}`,
    }).catch((err) => console.error("Email sending failed on login:", err));

    return res.status(403).json({
      success: false,
      message: "Check your inbox. A verification email has been sent.",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const token = generateToken({ id: user._id, role: user.role });
  const userResponse = { ...user._doc };
  delete userResponse.password;

  res.status(200).json(new ApiResponse(200, { user: userResponse, token }, "Login successful"));
});

/**
 * @desc Get current logged-in user
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Unauthorized");

  const { id, role } = req.user;
  let userDoc = null;

  if (role === "patient") userDoc = await Patient.findById(id).select("-password");
  else if (role === "doctor") userDoc = await Doctor.findById(id).select("-password");

  if (!userDoc) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, userDoc, "User info fetched successfully"));
});
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Verification token is missing");
  }

  // Try patient first
  let user = await Patient.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  // If not patient, try doctor
  if (!user) {
    user = await Doctor.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });
  }

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  // ✅ Mark verified
  user.isVerified = true;
  user.isEmailVerified = true; // optional but frontend supports this
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  user.verificationToken = undefined;

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { verified: true },
      "Email verified successfully"
    )
  );
});