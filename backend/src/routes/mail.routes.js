import express from "express";
import {
  testMail,
  sendAppointmentConfirmation,
  sendReportReady,
} from "../controllers/mail.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Test email
router.post("/test", testMail);

// Send appointment confirmation email
router.post("/appointment-confirmation", sendAppointmentConfirmation);

// Send report ready notification
router.post("/report-ready", sendReportReady);

export default router;

