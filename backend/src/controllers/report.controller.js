// backend/src/controllers/report.controller.js
import Report from "../models/report.model.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import path from "path";
import axios from "axios";

/* ---------------- MULTER SETUP ---------------- */
import multer from "multer";

const uploadDir = path.join("uploads", "reports");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only PDF, JPEG or PNG files are allowed"), false);
};

export const uploadMiddleware = multer({ storage, fileFilter });

/* ---------------- CONTROLLERS ---------------- */

// Upload a report
export const uploadReport = asyncHandler(async (req, res) => {
  const isDoctor = req.user.role === "doctor";
  const patientId = isDoctor ? req.body.patient || req.body.patientId : req.user.id;

  if (!req.file) throw new ApiError(400, "Please upload a report file");
  if (!patientId) throw new ApiError(400, "Patient ID is required");

  const patient = await Patient.findById(patientId);
  if (!patient) throw new ApiError(404, "Patient not found");

  const { reportName, reportType, description } = req.body;
  if (!reportName) throw new ApiError(400, "Report name is required");

  let fileUrl = null;
  let cloudinaryPublicId = null;

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "swasthya-connect/reports",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });

    fileUrl = result.secure_url;
    cloudinaryPublicId = result.public_id;

    // Delete local temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  } catch (err) {
    if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw new ApiError(500, `Failed to upload report: ${err.message}`);
  }

  const report = await Report.create({
    patient: patientId,
    doctor: isDoctor ? req.user.id : null,
    reportType: reportType || "Medical Report",
    description: description || "",
    reportName,
    fileUrl,
    cloudinaryPublicId,
  });

  res.status(201).json(new ApiResponse(201, report, "Report uploaded successfully"));
});

// Get logged-in patient's reports
export const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ patient: req.user.id }).populate(
    "doctor",
    "name specialization"
  );
  res.status(200).json(new ApiResponse(200, reports, "Fetched patient reports"));
});

// Get reports by patient (doctor/patient)
export const getReportsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  if (req.user.role === "patient" && req.user.id !== patientId)
    throw new ApiError(403, "Not authorized to view other patients' reports");

  const reports = await Report.find({ patient: patientId }).populate(
    "doctor",
    "name specialization"
  );
  res.status(200).json(new ApiResponse(200, reports, "Fetched reports for patient"));
});

// Get a report by ID
export const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate("doctor", "name specialization");
  if (!report) throw new ApiError(404, "Report not found");

  if (req.user.role === "patient" && report.patient.toString() !== req.user.id)
    throw new ApiError(403, "Not authorized to view this report");

  res.status(200).json(new ApiResponse(200, report, "Report fetched successfully"));
});

// View report in browser
export const viewReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  // Validate fileUrl or cloudinaryPublicId exists
  if (!report.fileUrl && !report.cloudinaryPublicId) throw new ApiError(400, "Report has no file URL");

  // Authorization: Patient can view their own reports, Doctor can view any patient's reports
  if (req.user.role === "patient" && report.patient.toString() !== req.user.id)
    throw new ApiError(403, "Not authorized to view this report");
  // Doctors can view reports of any patient (no restriction)

  // Cloudinary files
  if (report.cloudinaryPublicId || report.fileUrl?.startsWith("https://res.cloudinary.com")) {
    try {
      // Generate authenticated URL using cloudinaryPublicId
      let downloadUrl;
      let publicId = report.cloudinaryPublicId;
      
      // If no publicId but fileUrl is Cloudinary, extract publicId from URL
      if (!publicId && report.fileUrl?.startsWith("https://res.cloudinary.com")) {
        // URL format: https://res.cloudinary.com/[cloud]/[type]/upload/v[version]/[public_id]
        // Extract everything after /upload/v[version]/ as the public_id
        const match = report.fileUrl.match(/\/upload\/v\d+\/(.+?)(?:\?|$)/);
        if (match && match[1]) {
          publicId = match[1];
          console.log("Extracted public ID from URL:", publicId);
        }
      }
      
      if (publicId) {
        // Generate URL with quality:auto transformation to bypass ACL restrictions
        // The transformation parameter is benign but allows CDN to serve authenticated files
        downloadUrl = cloudinary.url(publicId, {
          resource_type: "image",
          quality: "auto"
        });
      } else {
        downloadUrl = report.fileUrl;
      }
      
      console.log("Fetching from Cloudinary:", downloadUrl);
      
      const response = await axios.get(downloadUrl, { 
        responseType: "arraybuffer",
        timeout: 30000
      });
      
      if (!response.data || response.data.byteLength === 0) {
        console.error("Empty response from Cloudinary:", downloadUrl);
        throw new ApiError(400, "Empty file received from Cloudinary");
      }

      const contentType = response.headers["content-type"] || "application/octet-stream";
      const filename = report.reportName || "report";
      
      res.set({
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": response.data.byteLength,
        "Cache-Control": "no-cache"
      });
      
      return res.send(Buffer.from(response.data));
    } catch (err) {
      console.error("Cloudinary view error:", err.message);
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, `Failed to retrieve file: ${err.message}`);
    }
  }

  // Local files (legacy)
  if (report.fileUrl.startsWith("uploads")) {
    try {
      const localPath = path.join(process.cwd(), report.fileUrl);
      if (!fs.existsSync(localPath)) {
        throw new ApiError(404, "Report file not found on server");
      }
      
      const fileBuffer = fs.readFileSync(localPath);
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new ApiError(400, "Empty file on server");
      }
      
      const filename = report.reportName || "report";
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": fileBuffer.length
      });
      return res.send(fileBuffer);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, `Failed to read local file: ${err.message}`);
    }
  }

  throw new ApiError(400, "Invalid report file URL format");
});

// Download report
export const downloadReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  // Validate fileUrl or cloudinaryPublicId exists
  if (!report.fileUrl && !report.cloudinaryPublicId) throw new ApiError(400, "Report has no file URL");

  // Authorization: Patient can download their own reports, Doctor can download any patient's reports
  if (req.user.role === "patient" && report.patient.toString() !== req.user.id)
    throw new ApiError(403, "Not authorized to download this report");
  // Doctors can download reports of any patient (no restriction)

  // Cloudinary files
  if (report.cloudinaryPublicId || report.fileUrl?.startsWith("https://res.cloudinary.com")) {
    try {
      // Generate authenticated URL using cloudinaryPublicId
      let downloadUrl;
      let publicId = report.cloudinaryPublicId;
      
      // If no publicId but fileUrl is Cloudinary, extract publicId from URL
      if (!publicId && report.fileUrl?.startsWith("https://res.cloudinary.com")) {
        // URL format: https://res.cloudinary.com/[cloud]/[type]/upload/v[version]/[public_id]
        // Extract everything after /upload/v[version]/ as the public_id
        const match = report.fileUrl.match(/\/upload\/v\d+\/(.+?)(?:\?|$)/);
        if (match && match[1]) {
          publicId = match[1];
          console.log("Extracted public ID from URL:", publicId);
        }
      }
      
      if (publicId) {
        // Generate URL with quality:auto transformation to bypass ACL restrictions
        // The transformation parameter is benign but allows CDN to serve authenticated files
        downloadUrl = cloudinary.url(publicId, {
          resource_type: "image",
          quality: "auto"
        });
      } else {
        downloadUrl = report.fileUrl;
      }
      
      console.log("Downloading from Cloudinary:", downloadUrl);
      
      const response = await axios.get(downloadUrl, { 
        responseType: "arraybuffer",
        timeout: 30000
      });
      
      if (!response.data || response.data.byteLength === 0) {
        console.error("Empty response from Cloudinary:", downloadUrl);
        throw new ApiError(400, "Empty file received from Cloudinary");
      }

      const contentType = response.headers["content-type"] || "application/octet-stream";
      const filename = report.reportName || "report";
      
      res.set({
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": response.data.byteLength,
        "Cache-Control": "no-cache"
      });
      
      return res.send(Buffer.from(response.data));
    } catch (err) {
      console.error("Cloudinary download error:", err.message);
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, `Failed to download file: ${err.message}`);
    }
  }

  // Local files (legacy)
  if (report.fileUrl.startsWith("uploads")) {
    try {
      const localPath = path.join(process.cwd(), report.fileUrl);
      if (!fs.existsSync(localPath)) {
        throw new ApiError(404, "Report file not found on server");
      }
      
      const fileBuffer = fs.readFileSync(localPath);
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new ApiError(400, "Empty file on server");
      }
      
      const filename = report.reportName || "report";
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length
      });
      return res.send(fileBuffer);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, `Failed to download local file: ${err.message}`);
    }
  }

  throw new ApiError(400, "Invalid report file URL format");
});

// Delete report
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  if (report.patient.toString() !== req.user.id)
    throw new ApiError(403, "Not authorized to delete this report");

  // Delete Cloudinary
  if (report.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(report.cloudinaryPublicId, { resource_type: "auto" });
  }

  // Delete local file
  if (report.fileUrl.startsWith("uploads/")) {
    const localPath = path.join("uploads", "reports", path.basename(report.fileUrl));
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }

  await report.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Report deleted successfully"));
});
