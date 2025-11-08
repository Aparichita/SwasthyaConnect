import express from "express";
import {
  generateABHA,
  verifyABHA,
  getMyABHA,
  shareHealthRecords,
  fetchHealthRecords,
} from "../controllers/abha.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// All routes require patient authentication
router.use(verifyToken);
router.use(authorizeRoles("patient"));

// Generate ABHA Health ID
router.post("/generate", generateABHA);

// Verify ABHA with OTP
router.post("/verify", verifyABHA);

// Get patient's ABHA details
router.get("/me", getMyABHA);

// Share health records via ABHA
router.post("/share-records", shareHealthRecords);

// Fetch health records from ABDM
router.get("/fetch-records", fetchHealthRecords);

export default router;

