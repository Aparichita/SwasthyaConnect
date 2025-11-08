import express from "express";
import {
  registerPatient,
  loginPatient,
  getMyProfile,
  updateMyProfile,
  updatePatientById,
  deletePatientById,
  getAllPatients,
  getPatientById,
  generatePatientReport, // <-- imported
} from "../controllers/patient.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// -------------------- Base: List patients --------------------
router.get("/", verifyToken, getAllPatients);

// -------------------- Auth routes --------------------
router.post("/register", registerPatient);
router.post("/login", loginPatient);

// -------------------- Protected routes (logged-in patient) --------------------
router.get("/me", verifyToken, getMyProfile);
router.put("/me", verifyToken, updateMyProfile);

// -------------------- Generate PDF report (logged-in patient) --------------------
router.post("/generate-report", verifyToken, generatePatientReport);

// -------------------- Admin / Testing routes --------------------
router.put("/:id", verifyToken, authorizeRoles("doctor"), updatePatientById);
router.delete("/:id", verifyToken, authorizeRoles("doctor"), deletePatientById);

// -------------------- Get patient by ID --------------------
router.get("/:id", verifyToken, getPatientById);

export default router;
