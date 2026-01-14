// backend/src/routes/verification.routes.js
import express from "express";
import { sendVerificationEmail, verifyEmail } from "../controllers/verification.controller.js";

const router = express.Router();

// Send verification email
router.post("/send", sendVerificationEmail);

// Verify email with token
router.get("/verify", verifyEmail);

export default router;

