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
    consultation_fee
  } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  // Fast email check with timeout - check BOTH Patient and Doctor collections
  let existingUser;
  try {
    const [existingPatient, existingDoctor] = await Promise.race([
      Promise.all([
        Patient.findOne({ email }).lean(),
        Doctor.findOne({ email }).lean()
      ]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database query timeout")), 3000)
      )
    ]);
    
    existingUser = existingPatient || existingDoctor;
  } catch (error) {
    if (error.message === "Database query timeout") {
      throw new ApiError(503, "Database connection timeout. Please try again.");
    }
    throw error;
  }

  if (existingUser && existingUser.isEmailVerified) {
    throw new ApiError(400, "User with this email already exists");
  }

  // Generate verification token using crypto
  const crypto = await import("crypto");
  const verificationToken = crypto.default.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  // Create user with timeout (unverified initially)
  let newUser;
  try {
    if (role === "patient") {
      newUser = await Promise.race([
        Patient.create({ 
          name, 
          email, 
          password, 
          role, 
          city,
          // Legacy fields (keep for backward compatibility)
          isEmailVerified: false,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
          // New simplified verification fields
          isVerified: false,
          verificationToken: verificationToken // Token expires in 1 hour
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database operation timeout")), 5000)
        )
      ]);
    } else {
      if (!qualification || !specialization || !phone || !medical_registration_number || !state_medical_council || !experience || !consultation_fee) {
        throw new ApiError(400, "Qualification, specialization, phone, medical registration number, state medical council, experience, and consultation fee are required for doctor");
      }
      newUser = await Promise.race([
        Doctor.create({
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
          verification_status: "partially_verified",
          // Legacy fields (keep for backward compatibility)
          isEmailVerified: false,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
          // New simplified verification fields
          isVerified: false,
          verificationToken: verificationToken // Token expires in 1 hour
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database operation timeout")), 5000)
        )
      ]);
    }
  } catch (error) {
    if (error.message === "Database operation timeout") {
      throw new ApiError(503, "Registration timeout. Please try again.");
    }
    throw error;
  }

  const userResponse = { ...newUser._doc };
  delete userResponse.password;
  delete userResponse.verificationToken; // Don't send token in response

  // Generate JWT token for immediate login (verification not required)
  const token = generateToken({ id: newUser._id, role: newUser.role });

  // Send verification email asynchronously (don't block registration)
  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email/${verificationToken}`;
  
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
          <h2>Verify Your SwasthyaConnect Account</h2>
          <p>Thank you for registering with SwasthyaConnect! Please verify your email address to complete your registration.</p>
          <p>Click the button below to verify your account:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #14b8a6;">${verificationUrl}</p>
          <p><strong>Note:</strong> You can use the app even without verifying, but verification is recommended for enhanced security.</p>
          <p>If you didn't create an account with SwasthyaConnect, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 SwasthyaConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email asynchronously - don't block registration response
  sendMail({
    to: email,
    subject: "Verify Your SwasthyaConnect Account",
    html: emailHtml,
    text: `Please verify your email by clicking this link: ${verificationUrl}`,
  }).catch((emailError) => {
    console.error("Failed to send verification email:", emailError);
    // Don't fail registration if email fails - user can still use the app
  });

  // Send response immediately
  res
    .status(201)
    .json(new ApiResponse(201, { user: userResponse, token }, "User registered successfully. Please check your email to verify your account."));
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

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  // Fast query with timeout - also select isVerified fields
  let user;
  try {
    const userQuery = role === "patient"
      ? Patient.findOne({ email }).select("+password +isVerified +isEmailVerified").lean()
      : Doctor.findOne({ email }).select("+password +isVerified +isEmailVerified").lean();

    user = await Promise.race([
      userQuery,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database query timeout")), 3000)
      )
    ]);
  } catch (error) {
    if (error.message === "Database query timeout") {
      throw new ApiError(503, "Database connection timeout. Please try again.");
    }
    throw error;
  }

  if (!user) throw new ApiError(401, "Invalid credentials");

  // Check if email is verified (check both isEmailVerified and isVerified for backward compatibility)
  const isVerified = user.isVerified !== undefined ? user.isVerified : user.isEmailVerified;
  if (!isVerified) {
    throw new ApiError(403, "Please verify your email first. Check your inbox for the verification link.");
  }

  // Fast password comparison
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const token = generateToken({ id: user._id, role: user.role });
  const userResponse = { ...user };
  delete userResponse.password;

  // Send response immediately
  res
    .status(200)
    .json(new ApiResponse(200, { user: userResponse, token }, "Login successful"));
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

  res
    .status(200)
    .json(new ApiResponse(200, userDoc, "User info fetched successfully"));
});
