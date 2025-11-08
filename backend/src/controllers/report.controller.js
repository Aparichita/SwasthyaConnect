import Report from "../models/report.model.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { generatePDF } from "../utils/generate-pdf.js";
import { sendMail } from "../utils/sendEmail.js"; // <-- Added email utility
import path from "path";
import fs from "fs";

/**
 * @desc Upload a medical report (PDF or image) and send email notification
 * @route POST /api/reports
 * @access Patient
 */
export const uploadReport = asyncHandler(async (req, res) => {
  const patientId = req.user.id;

  if (!req.file) {
    throw new ApiError(400, "Please upload a report file");
  }

  const { reportName, reportType, description, doctor } = req.body;

  if (!reportName) {
    throw new ApiError(400, "Report name is required");
  }

  const report = await Report.create({
    patient: patientId,
    doctor: doctor || null,
    reportType,
    description,
    reportName,
    fileUrl: req.file.path,
  });

  // Send email notification
  const patient = await Patient.findById(patientId).select("name email");
  if (patient?.email) {
    try {
      await sendMail(
        patient.email,
        "Report Uploaded Successfully",
        `Hello ${patient.name},\n\nYour report "${report.reportName}" has been uploaded successfully.\n\nRegards,\nSwasthya Connect`
      );
    } catch (emailError) {
      console.warn("Failed to send email notification:", emailError.message);
      // Don't block the report upload if email fails
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, report, "Report uploaded and email sent successfully"));
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
  return res
    .status(200)
    .json(new ApiResponse(200, reports, "Fetched patient reports"));
});

/**
 * @desc Get all reports uploaded for a specific patient (for doctors)
 * @route GET /api/reports/patient/:patientId
 * @access Patient / Doctor
 */
export const getReportsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const reports = await Report.find({ patient: patientId }).populate(
    "doctor",
    "name specialization"
  );
  return res
    .status(200)
    .json(new ApiResponse(200, reports, "Fetched reports for patient"));
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

  return res
    .status(200)
    .json(new ApiResponse(200, report, "Report fetched successfully"));
});

/**
 * @desc Delete a report by ID
 * @route DELETE /api/reports/:id
 * @access Patient (only owner)
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) throw new ApiError(404, "Report not found");

  if (report.patient.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized to delete this report");
  }

  if (fs.existsSync(report.fileUrl)) {
    fs.unlinkSync(report.fileUrl);
  }

  await report.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Report deleted successfully"));
});

/**
 * @desc Generate PDF report for a patient including appointments & health advice
 * @route POST /api/reports/generate
 * @access Patient
 */
export const generatePatientReport = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.user.id).select("name email city location age");
  if (!patient) throw new ApiError(404, "Patient not found");

  // Fetch appointments with populated doctor
  const appointments = await Appointment.find({ patient: req.user.id })
    .populate("doctor", "name specialization")
    .sort({ date: 1 });
  
  const formattedAppointments = appointments.map(appt => ({
    date: new Date(appt.date).toLocaleDateString("en-GB"),
    doctor: appt.doctor ? appt.doctor.name : "Unknown Doctor",
    status: appt.status || "pending",
  }));

  // Health advice
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
  const generatedDir = path.join("uploads", "generated");
  if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

  const filePath = await generatePDF(reportData, path.join(generatedDir, fileName));

  // Send email notification that report is generated
  if (patient?.email) {
    try {
      await sendMail(
        patient.email,
        "Your Healthcare Report is Ready",
        `Hello ${patient.name},\n\nYour healthcare report has been generated successfully and is ready for download.\n\nRegards,\nSwasthya Connect`
      );
    } catch (emailError) {
      console.warn("Failed to send email notification:", emailError.message);
      // Don't block the PDF download if email fails
    }
  }

  res.download(filePath, fileName, (err) => {
    if (err) throw new ApiError(500, "Failed to download PDF");
  });
});
