import Patient from "../models/patient.model.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { generateToken } from "../utils/token.js";
import { generatePDF } from "../utils/generate-pdf.js";
import path from "path";
import fs from "fs";

/**
 * @desc Update patient by ID
 * @route PUT /api/patients/:id
 * @access Admin / Testing
 */
export const updatePatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const patient = await Patient.findById(id);
  if (!patient) throw new ApiError(404, "Patient not found");

  const allowedFields = ["name", "city", "age", "phone", "password", "email"];
  for (let field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === "password") {
        patient.password = await bcrypt.hash(updates.password, 10);
      } else {
        patient[field] = updates[field];
      }
    }
  }

  await patient.save();
  const patientObj = patient.toObject();
  delete patientObj.password;

  return res
    .status(200)
    .json(new ApiResponse(200, patientObj, "Patient updated successfully"));
});

/**
 * @desc Delete patient by ID
 * @route DELETE /api/patients/:id
 * @access Admin / Testing
 */
export const deletePatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patient = await Patient.findById(id);
  if (!patient) throw new ApiError(404, "Patient not found");

  await patient.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Patient deleted successfully"));
});

/**
 * @desc Get all patients (basic fields)
 * @route GET /api/patients/
 * @access Private (any authenticated)
 */
export const getAllPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find({}, "name email city age createdAt");
  return res
    .status(200)
    .json(new ApiResponse(200, patients, "Patients fetched successfully"));
});

/**
 * @desc Get a patient by id
 * @route GET /api/patients/:id
 * @access Private (any authenticated)
 */
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).select("-password");
  if (!patient) throw new ApiError(404, "Patient not found");
  return res
    .status(200)
    .json(new ApiResponse(200, patient, "Patient fetched successfully"));
});

/**
 * @desc Register a new patient
 * @route POST /api/patients/register
 * @access Public
 */
export const registerPatient = asyncHandler(async (req, res) => {
  const { name, email, password, city, age, phone } = req.body;

  // Quick validation
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  // Fast email check with timeout
  let existing;
  try {
    existing = await Promise.race([
      Patient.findOne({ email }).lean(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database query timeout")), 3000)
      )
    ]);
  } catch (error) {
    if (error.message === "Database query timeout") {
      throw new ApiError(503, "Database connection timeout. Please try again.");
    }
    throw error;
  }

  if (existing) throw new ApiError(400, "Email already registered");

  // Create patient with timeout
  let patient;
  try {
    patient = await Promise.race([
      Patient.create({
        name,
        email,
        password, // Password will be hashed by pre-save hook
        city,
        age,
        phone,
        role: "patient",
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database operation timeout")), 5000)
      )
    ]);
  } catch (error) {
    if (error.message === "Database operation timeout") {
      throw new ApiError(503, "Registration timeout. Please try again.");
    }
    throw error;
  }

  const token = generateToken({ id: patient._id, role: patient.role });
  const patientObj = patient.toObject();
  delete patientObj.password;

  // Send response immediately
  return res
    .status(201)
    .json(new ApiResponse(201, { patient: patientObj, token }, "Patient registered successfully"));
});

/**
 * @desc Login a patient
 * @route POST /api/patients/login
 * @access Public
 */
export const loginPatient = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  // Fast query with timeout
  let patient;
  try {
    patient = await Promise.race([
      Patient.findOne({ email }).select("+password").lean(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database query timeout")), 3000)
      )
    ]);
  } catch (error) {
    if (error.message === "Database query timeout") {
      throw new ApiError(503, "Database connection timeout. Please try again.");
    }
    throw error;
  }

  if (!patient) throw new ApiError(401, "Invalid credentials");

  // Fast password comparison
  const isMatch = await bcrypt.compare(password, patient.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const token = generateToken({ id: patient._id, role: patient.role });
  const patientObj = { ...patient };
  delete patientObj.password;

  // Send response immediately
  return res
    .status(200)
    .json(new ApiResponse(200, { patient: patientObj, token }, "Login successful"));
});

/**
 * @desc Get logged-in patient profile
 * @route GET /api/patients/me
 * @access Patient
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.user.id).select("-password");
  if (!patient) throw new ApiError(404, "Patient not found");

  return res.status(200).json(new ApiResponse(200, patient, "Patient profile fetched successfully"));
});

/**
 * @desc Update logged-in patient profile
 * @route PUT /api/patients/me
 * @access Patient
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.user.id);
  if (!patient) throw new ApiError(404, "Patient not found");

  const { name, city, age, password } = req.body;
  if (name) patient.name = name;
  if (city) patient.city = city;
  if (age !== undefined) patient.age = age;
  if (password) patient.password = await bcrypt.hash(password, 10);

  await patient.save();
  const patientObj = patient.toObject();
  delete patientObj.password;

  return res.status(200).json(new ApiResponse(200, patientObj, "Patient profile updated successfully"));
});

/**
 * @desc Generate PDF report for the logged-in patient
 * @route POST /api/patients/generate-report
 * @access Patient
 */
export const generatePatientReport = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.user.id);
  if (!patient) throw new ApiError(404, "Patient not found");

  // Safe fallback values
  const patientName = patient.name || "Unknown_Patient";
  const patientEmail = patient.email || "N/A";
  const patientCity = patient.city || "Unknown";

  const reportData = {
    patientName,
    email: patientEmail,
    city: patientCity,
    advice: "General health report",
    generatedAt: new Date().toLocaleString(),
  };

  // Generate file name safely
  const safeFileName = `${patientName.replace(/\s+/g, "_")}-report.pdf`;
  const generatedDir = path.join("uploads", "generated");
  if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

  const filePath = await generatePDF(reportData, path.join(generatedDir, safeFileName));

  // Send PDF as download
  res.download(filePath, safeFileName, (err) => {
    if (err) {
      throw new ApiError(500, "Failed to download PDF");
    }
  });
});
