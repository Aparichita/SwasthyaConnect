import express from "express";
import {
  bookAppointment,
  getMyAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} from "../controllers/appointment.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// 📅 Patient books appointment
router.post(
  "/",
  verifyToken,
  authorizeRoles("patient"),
  bookAppointment
);

// 👀 Logged-in user (patient OR doctor)
router.get(
  "/my",
  verifyToken,
  getMyAppointments
);

// 👨‍⚕️ Doctor appointments (USED BY CHAT SYSTEM)
router.get(
  "/doctor",
  verifyToken,
  authorizeRoles("doctor"),
  getMyAppointments
);

// ✏️ Doctor updates appointment status
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("doctor"),
  updateAppointmentStatus
);

// ❌ Patient cancels appointment
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("patient"),
  deleteAppointment
);

export default router;
