// src/routes/notification.routes.js
import express from "express";
import {
  createNotification,
  getMyNotifications,
  markAsRead,
  deleteNotification,
  sendTestEmail,
} from "../controllers/notification.controller.js";
import {
  sendWhatsAppToPatientById,
  sendAppointmentReminder,
  sendBulkReminders,
  sendUpcomingReminders,
  sendCustomWhatsApp,
} from "../controllers/patient-notification.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Existing notification routes
router.post("/", verifyToken, createNotification);
router.get("/my", verifyToken, getMyNotifications);
router.patch("/:id/read", verifyToken, markAsRead);
router.delete("/:id", verifyToken, deleteNotification);
router.post("/send-test", verifyToken, sendTestEmail);

// Patient WhatsApp notification routes
router.post("/patient/:patientId/whatsapp", verifyToken, authorizeRoles("doctor"), sendWhatsAppToPatientById);
router.post("/appointment/:appointmentId/reminder", verifyToken, authorizeRoles("doctor"), sendAppointmentReminder);
router.post("/appointments/bulk-reminders", verifyToken, authorizeRoles("doctor"), sendBulkReminders);
router.post("/appointments/upcoming-reminders", verifyToken, authorizeRoles("doctor"), sendUpcomingReminders);
router.post("/whatsapp/send", verifyToken, sendCustomWhatsApp);

export default router;
