import Report from "../models/report.model.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { generatePDF } from "../utils/generate-pdf.js";
import { sendMail } from "../utils/sendEmail.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";

/**
 * @desc Upload a medical report (PDF or image) to Cloudinary and send email
 * @route POST /api/reports
 * @access Patient / Doctor
 */

const getContentType = (url) => {
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) return "image/jpeg";
  return "application/pdf";
};

// Upload a medical report
export const uploadReport = asyncHandler(async (req, res) => {
  const isDoctor = req.user.role === "doctor";
  const patientId = isDoctor ? req.body.patient || req.body.patientId : req.user.id;

  if (!req.file) throw new ApiError(400, "Please upload a report file");
  if (!patientId) throw new ApiError(400, "Patient ID is required");

  const patientExists = await Patient.findById(patientId);
  if (!patientExists) throw new ApiError(404, "Patient not found");

  const { reportName, reportType, description } = req.body;
  if (!reportName) throw new ApiError(400, "Report name is required");

  let fileUrl;

  try {
    // Upload to Cloudinary
    console.log("📤 Uploading to Cloudinary:", req.file.originalname);
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "swasthya-connect/reports",
      resource_type: "auto",
    });
    fileUrl = result.secure_url; // always store Cloudinary URL
    console.log("✅ Cloudinary upload successful:", fileUrl);
  } catch (err) {
    console.error("❌ Cloudinary upload failed:", err.message);
    throw new ApiError(500, "Failed to upload report. Try again.");
  }

  const report = await Report.create({
    patient: patientId,
    doctor: isDoctor ? req.user.id : null,
    reportType,
    description,
    reportName,
    fileUrl,
  });

  console.log("✅ Report saved to DB with Cloudinary URL");

  res.status(201).json(new ApiResponse(201, report, "Report uploaded successfully"));

  // Send email (non-blocking)
  if (patientExists.email) {
    sendMail(
      patientExists.email,
      "Report Uploaded Successfully",
      `Hello ${patientExists.name},\n\nYour report "${report.reportName}" is ready: ${fileUrl}\n\nRegards,\nSwasthya Connect`
    ).catch(err => console.error("⚠️ Failed to send report email:", err.message));
  }
});


/**
 * @desc Get all reports of a logged-in patient
 * @route GET /api/reports/my
 * @access Patient
 */
export const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ patient: req.user.id }).populate(
    "doctor",
    "name specialization"
  );
  return res.status(200).json(new ApiResponse(200, reports, "Fetched patient reports"));
});

/**
 * @desc Get all reports for a specific patient (for doctors)
 * @route GET /api/reports/patient/:patientId
 * @access Patient / Doctor
 */
export const getReportsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  if (req.user.role === "patient" && req.user.id !== patientId) {
    throw new ApiError(403, "Not authorized to view other patients' reports");
  }

  const reports = await Report.find({ patient: patientId }).populate(
    "doctor",
    "name specialization"
  );
  return res.status(200).json(new ApiResponse(200, reports, "Fetched reports for patient"));
});

/**
 * @desc Get a report by ID
 * @route GET /api/reports/:id
 * @access Patient / Doctor
 */
export const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate(
    "doctor",
    "name specialization"
  );

  if (!report) throw new ApiError(404, "Report not found");

  if (req.user.role === "patient" && report.patient.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized to view this report");
  }

  return res.status(200).json(new ApiResponse(200, report, "Report fetched successfully"));
});

/**
 * @desc Download a report file
 * @route GET /api/reports/:id/download
 * @access Patient / Doctor
 */

export const downloadReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  if (req.user.role === "patient" && report.patient.toString() !== req.user.id)
    throw new ApiError(403, "Not authorized to download this report");

  if (req.user.role === "doctor" && report.doctor && report.doctor.toString() !== req.user.id)
    throw new ApiError(403, "Not authorized to download this report");

  if (!report.fileUrl || !report.fileUrl.startsWith("http")) {
    console.error("❌ Invalid fileUrl:", report.fileUrl);
    throw new ApiError(400, "Report file URL is invalid. Please upload a new report.");
  }

  try {
    console.log("⬇️ Downloading from:", report.fileUrl);
    const response = await axios.get(report.fileUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    if (!response.data || response.data.byteLength === 0) {
      throw new ApiError(400, "Empty file received from Cloudinary");
    }

    console.log("✅ Downloaded", response.data.byteLength, "bytes");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.reportName || "report"}.pdf"`,
      "Content-Length": response.data.byteLength,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });

    return res.send(Buffer.from(response.data));
  } catch (err) {
    console.error("❌ Download error:", err.message);
    if (err instanceof ApiError) throw err;
    if (err.code === "ECONNABORTED") {
      throw new ApiError(504, "Download request timed out. Please try again.");
    }
    throw new ApiError(500, "Failed to download report. Please try again later.");
  }
});



/**
 * @desc View a report file in browser
 * @route GET /api/reports/:id/view
 * @access Patient / Doctor
 */
export const viewReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  if (req.user.role === "patient" && report.patient.toString() !== req.user.id)
    throw new ApiError(403, "Not authorized to view this report");

  if (req.user.role === "doctor" && report.doctor && report.doctor.toString() !== req.user.id)
    throw new ApiError(403, "Not authorized to view this report");

  if (!report.fileUrl || !report.fileUrl.startsWith("http")) {
    console.error("❌ Invalid fileUrl:", report.fileUrl);
    throw new ApiError(400, "Report file URL is invalid. Please upload a new report.");
  }

  try {
    console.log("👁️ Viewing from:", report.fileUrl);
    const response = await axios.get(report.fileUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    if (!response.data || response.data.byteLength === 0) {
      throw new ApiError(400, "Empty file received from Cloudinary");
    }

    console.log("✅ Retrieved", response.data.byteLength, "bytes");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${report.reportName || "report"}.pdf"`,
      "Content-Length": response.data.byteLength,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });

    return res.send(Buffer.from(response.data));
  } catch (err) {
    console.error("❌ View error:", err.message);
    if (err instanceof ApiError) throw err;
    if (err.code === "ECONNABORTED") {
      throw new ApiError(504, "View request timed out. Please try again.");
    }
    throw new ApiError(500, "Failed to view report. Please try again later.");
  }
});



/**
 * @desc Delete a report by ID
 * @route DELETE /api/reports/:id
 * @access Patient (owner only)
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  if (report.patient.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized to delete this report");
  }

  try {
    // Extract public_id from fileUrl
    const segments = report.fileUrl.split("/");
    const publicIdWithExt = segments.slice(-1)[0].split(".")[0];
    const publicId = `swasthya-connect/reports/${publicIdWithExt}`;

    await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
  } catch (err) {
    console.warn("⚠️ Could not delete file from Cloudinary:", err.message);
  }

  await report.deleteOne();
  return res.status(200).json(new ApiResponse(200, null, "Report deleted successfully"));
});

/**
 * @desc Generate PDF report for a patient including appointments & health advice
 * @route POST /api/reports/generate
 * @access Patient
 */
export const generatePatientReport = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.user.id).select("name email city location age");
  if (!patient) throw new ApiError(404, "Patient not found");

  const appointments = await Appointment.find({ patient: req.user.id })
    .populate("doctor", "name specialization")
    .sort({ date: 1 });

  const formattedAppointments = appointments.map(appt => ({
    date: new Date(appt.date).toLocaleDateString("en-GB"),
    doctor: appt.doctor ? appt.doctor.name : "Unknown Doctor",
    status: appt.status || "pending",
  }));

  const healthAdvice = [
    "Maintain regular exercise",
    "Eat a balanced diet",
    "Keep up with routine checkups"
  ];

  const patientCity = patient.city || patient.location || "N/A";
  const patientAge = patient.age !== null && patient.age !== undefined ? patient.age.toString() : "N/A";

  const reportData = {
    patientName: patient.name || "Patient",
    email: patient.email || "N/A",
    city: patientCity,
    age: patientAge,
    appointments: formattedAppointments,
    healthAdvice,
    generatedAt: new Date().toLocaleString("en-IN", { hour12: false }),
  };

  const safeName = (patient.name ? patient.name : "patient").replace(/\s+/g, "_");
  const fileName = `${safeName}-report.pdf`;

  const filePath = await generatePDF(reportData, fileName);

  // Email notification (non-blocking)
  if (patient?.email) {
    sendMail(
      patient.email,
      "Your Healthcare Report is Ready",
      `Hello ${patient.name},\n\nYour healthcare report has been generated successfully and is ready for download.\n\nRegards,\nSwasthya Connect`
    ).catch(err => console.warn("Failed to send email:", err.message));
  }

  res.download(filePath, fileName, err => {
    if (err) throw new ApiError(500, "Failed to download PDF");
  });
});
