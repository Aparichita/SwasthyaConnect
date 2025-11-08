import express from "express";
import {
  registerDoctor,
  loginDoctor,
  getMyProfile,
  updateMyProfile,
  getAllDoctors,
  getDoctorById,
  updateDoctorById,
  deleteDoctorById,
  getDoctorsBySpecialization,
} from "../controllers/doctor.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Auth
router.post("/register", registerDoctor);
router.post("/login", loginDoctor);

// Doctor self profile
router.get("/me", verifyToken, authorizeRoles("doctor"), getMyProfile);
router.put("/me", verifyToken, authorizeRoles("doctor"), updateMyProfile);

// Public listing and details
router.get("/", getAllDoctors);
router.get("/specialization/:specialization", getDoctorsBySpecialization);
router.get("/suggest/:specialization", getDoctorsBySpecialization); // Alias for compatibility
router.get("/:id", getDoctorById);

// Admin/testing mutations
router.put("/:id", verifyToken, authorizeRoles("doctor"), updateDoctorById);
router.delete("/:id", verifyToken, authorizeRoles("doctor"), deleteDoctorById);

export default router;
