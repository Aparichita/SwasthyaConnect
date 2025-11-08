import express from "express";
import { registerDoctor, updateMyProfile } from "../controllers/doctor.controller.js";
import { registerDoctorValidator, updateDoctorValidator } from "../middleware/doctor.validator.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Doctor registration
router.post("/register", registerDoctorValidator, registerDoctor);

// Update doctor profile
router.put("/me", authenticate, authorizeRoles("doctor"), updateDoctorValidator, updateMyProfile);

export default router;
