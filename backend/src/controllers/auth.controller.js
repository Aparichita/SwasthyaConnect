// src/controllers/auth.controller.js
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
    name, email, password, role,
    qualification, specialization, phone, city,
    medical_registration_number, state_medical_council,
    experience, clinic_name, consultation_type, consultation_fee
  } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  // Check if user exists
  const [existingPatient, existingDoctor] = await Promise.all([
    Patient.findOne({ email }).lean(),
    Doctor.findOne({ email }).lean()
  ]);
  const existingUser = existingPatient || existingDoctor;

  if (existingUser && existingUser.isVerified) {
    throw new ApiError(400, "User with this email already exists");
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  let newUser;
  if (role === "patient") {
    newUser = await Patient.create({
      name, email, password, role, city,
      isVerified: false,
      verificationToken,
      emailVerificationToken: verificationToken, // legacy
      emailVerificationExpires: verificationExpires
    });
  } else {
    if (!qualification || !specialization || !phone || !medical_registration_number ||
        !state_medical_council || !experience || !consultation_fee) {
      throw new ApiError(400, "All doctor fields are required");
    }
    newUser = await Doctor.create({
      name, email, password, role, qualification, specialization, phone, city,
      medical_registration_number, state_medical_council,
      experience: parseInt(experience) || 0,
      clinic_name,
      consultation_type: consultation_type || "Both",
      consultation_fee: parseFloat(consultation_fee) || 0,
      isVerified: false,
      verificationToken,
      emailVerificationToken: verificationToken, // legacy
      emailVerificationExpires: verificationExpires
    });
  }

  // JWT token for immediate login
  const token = generateToken({ id: newUser._id, role: newUser.role });

  // Send verification email
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) console.warn("⚠️ FRONTEND_URL not set in .env!");

  const verificationUrl = `${frontendUrl || "http://localhost:5173"}/verify-email/${verificationToken}`;
  const emailHtml = `
    <p>Welcome to SwasthyaConnect!</p>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>Or copy this link into your browser: ${verificationUrl}</p>
  `;

  sendMail({
    to: email,
    subject: "Verify Your SwasthyaConnect Account",
    html: emailHtml,
    text: `Please verify your email by visiting: ${verificationUrl}`
  }).catch(err => console.error("Failed to send verification email:", err));

  const userResponse = { ...newUser._doc };
  delete userResponse.password;
  delete userResponse.verificationToken;

  res.status(201).json(new ApiResponse(
    201,
    { user: userResponse, token },
    "User registered successfully. Please check your email to verify your account."
  ));
});

/**
 * @desc Login a user (patient or doctor)
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    throw new ApiError(400, "Email, password, and role are required");
  }

  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  const UserModel = role === "patient" ? Patient : Doctor;

  // Find user and include verificationToken and password
  let userDoc = await UserModel.findOne({ email })
    .select("+password +verificationToken +emailVerificationToken +emailVerificationExpires");

  if (!userDoc) throw new ApiError(401, "Invalid credentials");

  const isVerified = userDoc.isVerified || userDoc.isEmailVerified;
  if (!isVerified) {
    // Always generate a new token on unverified login
    const newToken = crypto.randomBytes(32).toString("hex");
    userDoc.verificationToken = newToken;
    userDoc.emailVerificationToken = newToken; // legacy
    userDoc.emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await userDoc.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email/${newToken}`;
    const emailHtml = `
      <p>You attempted to login but your email is not verified.</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>Or copy this link: ${verificationUrl}</p>
    `;

    try {
      await sendMail({
        to: email,
        subject: "Verify Your SwasthyaConnect Account",
        html: emailHtml,
        text: `Verify your email: ${verificationUrl}`
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (err) {
      console.error("Failed to send verification email on login:", err);
    }

    return res.status(403).json({
      success: false,
      message: "Check your inbox. A verification email has been sent."
    });
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, userDoc.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const token = generateToken({ id: userDoc._id, role: userDoc.role });
  const userResponse = { ...userDoc._doc };
  delete userResponse.password;
  delete userResponse.verificationToken;

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
