import express from "express";
import { createAppointment, updateAppointmentStatus, deleteAppointment } from "../controllers/appointment.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { createAppointmentValidator, updateAppointmentStatusValidator, deleteAppointmentValidator } from "../middleware/appointment.validator.js";

const router = express.Router();

// Create appointment (Patient only)
router.post("/", authenticate, authorizeRoles("patient"), createAppointmentValidator, createAppointment);

// Update status (Doctor only)
router.patch("/:id/status", authenticate, authorizeRoles("doctor"), updateAppointmentStatusValidator, updateAppointmentStatus);

// Delete appointment (Patient only)
router.delete("/:id", authenticate, authorizeRoles("patient"), deleteAppointmentValidator, deleteAppointment);

export default router;
