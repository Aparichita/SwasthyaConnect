// backend/src/routes/report.routes.js
import express from "express";
import {
  uploadReport,
  getReportsByPatient,
  getReportById,
  deleteReport,
  getMyReports,
  downloadReport,
  viewReport,
  uploadMiddleware, // <- updated multer middleware
} from "../controllers/report.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

/* ================= ROUTES ================= */

// 1️⃣ Upload a report (Patient / Doctor)
router.post(
  "/",
  verifyToken,
  authorizeRoles("patient", "doctor"),
  uploadMiddleware.single("file"), // multer middleware
  uploadReport
);

// 2️⃣ Get logged-in patient's reports
router.get("/my", verifyToken, authorizeRoles("patient"), getMyReports);

// 3️⃣ Get reports by patient ID (Patient/Doctor)
router.get(
  "/patient/:patientId",
  verifyToken,
  authorizeRoles("patient", "doctor"),
  getReportsByPatient
);

// 4️⃣ View report in browser
router.get("/:id/view", verifyToken, viewReport);

// 5️⃣ Download report file
router.get("/:id/download", verifyToken, downloadReport);

// 6️⃣ Get report by ID (generic)
router.get("/:id", verifyToken, getReportById);

// 7️⃣ Delete a report (Patient only)
router.delete("/:id", verifyToken, authorizeRoles("patient"), deleteReport);

export default router;
