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

  let user;
  if (role === "patient") {
    user = await Patient.create(commonData);
  } else {
    user = await Doctor.create({ ...commonData, ...rest });
  }

  // ✅ SAVE FIRST, THEN SEND EMAIL
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

  await sendMail({
    to: email,
    subject: "Verify Your SwasthyaConnect Account",
    html: `
      <h2>Welcome to SwasthyaConnect</h2>
      <p>Please verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      null,
      "Registration successful. Verification email sent."
    )
  );
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
    const newToken = crypto.randomBytes(32).toString("hex");

    user.emailVerificationToken = newToken;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email/${newToken}`;

    await sendMail({
      to: email,
      subject: "Verify Your Email",
      html: `<a href="${verificationUrl}">Verify Email</a>`,
    });

    return res.status(403).json({
      success: false,
      message: "Check your inbox. Verification email sent.",
    });
  }

  const token = generateToken({ id: user._id, role: user.role });
  user.password = undefined;

  res.status(200).json(
    new ApiResponse(200, { user, token }, "Login successful")
  );
});

/* ======================================================
   VERIFY EMAIL
====================================================== */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user =
    (await Patient.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    })) ||
    (await Doctor.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    }));

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/email-verified-success`);
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
