import express from "express";
import {
  uploadReport,
  getReportsByPatient,
  getReportById,
  deleteReport,
  getMyReports,
  generatePatientReport,
  downloadReport,
  viewReport,
} from "../controllers/report.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// Ensure upload folder exists (only used for temp upload)
const uploadDir = path.join("uploads", "reports");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only PDF or image files allowed"), false);
};

const upload = multer({ storage, fileFilter });

/* ================= ROUTES ================= */

// Upload
router.post(
  "/",
  verifyToken,
  authorizeRoles("patient", "doctor"),
  upload.single("file"),
  uploadReport
);

// My reports
router.get("/my", verifyToken, authorizeRoles("patient"), getMyReports);

// Reports by patient
router.get(
  "/patient/:patientId",
  verifyToken,
  authorizeRoles("patient", "doctor"),
  getReportsByPatient
);

// ⚠️ IMPORTANT: SPECIFIC ROUTES FIRST
router.get("/:id/view", verifyToken, viewReport);
router.get("/:id/download", verifyToken, downloadReport);

// Generic route LAST
router.get("/:id", verifyToken, getReportById);

// Delete
router.delete("/:id", verifyToken, authorizeRoles("patient"), deleteReport);

// Generate PDF
router.post(
  "/generate",
  verifyToken,
  authorizeRoles("patient"),
  generatePatientReport
);

export default router;
