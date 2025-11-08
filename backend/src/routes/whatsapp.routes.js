import express from "express";
import {
  testWhatsApp,
  sendAppointmentConfirmationWhatsApp,
  sendAppointmentReminder,
  sendReportReadyWhatsApp,
  sendHealthTip,
} from "../controllers/whatsapp.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Test WhatsApp
router.post("/test", testWhatsApp);

// Appointment confirmation
router.post("/appointment-confirmation", sendAppointmentConfirmationWhatsApp);

// Appointment reminder
router.post("/appointment-reminder", sendAppointmentReminder);

// Report ready notification
router.post("/report-ready", sendReportReadyWhatsApp);

// Health tip
router.post("/health-tip", sendHealthTip);

export default router;

