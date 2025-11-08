// src/controllers/auth.controller.js
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { generateToken } from "../utils/token.js";
import bcrypt from "bcryptjs";

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
    city
  } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  // Fast email check with timeout
  let existingUser;
  try {
    const emailCheck = role === "patient" 
      ? Patient.findOne({ email }).lean()
      : Doctor.findOne({ email }).lean();
    
    existingUser = await Promise.race([
      emailCheck,
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

  if (existingUser) throw new ApiError(400, "User with this email already exists");

  // Create user with timeout
  let newUser;
  try {
    if (role === "patient") {
      newUser = await Promise.race([
        Patient.create({ name, email, password, role, city }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database operation timeout")), 5000)
        )
      ]);
    } else {
      if (!qualification || !specialization || !phone) {
        throw new ApiError(400, "Qualification, specialization, and phone are required for doctor");
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
          city
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

  const token = generateToken({ id: newUser._id, role: newUser.role });

  // Send response immediately
  res
    .status(201)
    .json(new ApiResponse(201, { user: userResponse, token }, "User registered successfully"));
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

  // Fast query with timeout
  let user;
  try {
    const userQuery = role === "patient"
      ? Patient.findOne({ email }).select("+password").lean()
      : Doctor.findOne({ email }).select("+password").lean();

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
