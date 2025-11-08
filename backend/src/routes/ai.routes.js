import express from "express";
import { analyzeData, getMyAiResults, getResultsByPatient } from "../controllers/ai.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Analyze patient data (requires patient role)
router.post("/analyze", verifyToken, authorizeRoles("patient"), analyzeData);
router.post("/ncd-risk", verifyToken, authorizeRoles("patient"), analyzeData);

// Get AI results for logged-in patient
router.get("/my-results", verifyToken, authorizeRoles("patient"), getMyAiResults);
router.get("/results/:patientId", verifyToken, authorizeRoles("patient", "doctor"), getResultsByPatient);

export default router;
