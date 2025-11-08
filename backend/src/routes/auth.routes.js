import express from "express";
import { loginUser, getCurrentUser, registerUser } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

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

export default router;
