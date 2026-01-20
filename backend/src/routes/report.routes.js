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

// ✅ Ensure uploads/reports folder exists
const uploadDir = path.join("uploads", "reports");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // e.g., 1699273847123-CBC-report.pdf
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// ✅ Optional: filter only PDFs/images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF or image files are allowed"), false);
};

const upload = multer({ storage, fileFilter });

// 📤 Upload a new report (patient only)
router.post(
  "/",
  verifyToken,
  authorizeRoles("patient", "doctor"), // allow doctors to upload on behalf of a patient
  upload.single("file"), // handle file upload
  uploadReport
);

// 📄 My reports (patient)
router.get("/my", verifyToken, authorizeRoles("patient"), getMyReports);

// 📋 Get all reports for a specific patient (patient or doctor)
router.get(
  "/patient/:patientId",
  verifyToken,
  authorizeRoles("patient", "doctor"),
  getReportsByPatient
);

// 🔍 Get single report by ID
router.get("/:id", verifyToken, getReportById);

// ⬇️ Download report file (with attachment headers)
router.get("/:id/download", verifyToken, downloadReport);

// 👁️ View report file in browser (with inline headers)
router.get("/:id/view", verifyToken, viewReport);

// ❌ Delete report (patient only)
router.delete("/:id", verifyToken, authorizeRoles("patient"), deleteReport);

// 🧾 Generate PDF
router.post("/generate", verifyToken, authorizeRoles("patient"), generatePatientReport);

export default router;
