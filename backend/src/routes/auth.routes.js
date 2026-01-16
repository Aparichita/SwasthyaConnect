import express from "express";
import { loginUser, getCurrentUser, registerUser } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyEmail } from "../controllers/verification-simple.controller.js";
import { forgotPassword, resetPassword } from "../controllers/password.controller.js";

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user (patient or doctor)
 * @access Public
 */
router.post("/register", registerUser);

/**
 * @route POST /api/auth/login
 * @desc Login a user (patient or doctor)
 * @access Public
 * 
 * Body must include:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "role": "patient" // or "doctor"
 * }
 */
router.post("/login", loginUser);

/**
 * @route GET /api/auth/me
 * @desc Get current logged-in user info
 * @access Private
 */
router.get("/me", verifyToken, getCurrentUser);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify email using token (simplified version)
 * @access Public
 * 
 * This route verifies a user's email by token.
 * Does not require email/role in query params - token is unique.
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 * 
 * Body: { "email": "user@example.com" }
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password using token
 * @access Public
 * 
 * Body: { "password": "newPassword123!", "confirmPassword": "newPassword123!" }
 */
router.post("/reset-password/:token", resetPassword);

export default router;
