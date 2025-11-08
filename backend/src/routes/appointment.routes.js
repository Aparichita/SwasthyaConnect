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

// 📅 Book new appointment (Patient)
router.post("/", verifyToken, authorizeRoles("patient"), bookAppointment);

// 👀 View all appointments for logged-in user
router.get("/my", verifyToken, getMyAppointments);

// ✏️ Update appointment status (Doctor only)
router.put("/:id", verifyToken, authorizeRoles("doctor"), updateAppointmentStatus);

// ❌ Cancel appointment (Patient only)
router.delete("/:id", verifyToken, authorizeRoles("patient"), deleteAppointment);

export default router;
