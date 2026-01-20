// src/controllers/doctor.controller.js
import Doctor from "../models/doctor.model.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { generateToken } from "../utils/token.js";

/**
 * @desc Register a new doctor
 * @route POST /api/doctors/register
 * @access Public
 */
export const registerDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    specialization,
    city,
    phone,
    qualification,
    medical_registration_number,
    state_medical_council,
    experience,
    clinic_name,
    consultation_type,
    consultation_fee,
  } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  // Validate all required doctor fields
  if (
    !specialization ||
    !qualification ||
    !phone ||
    !medical_registration_number ||
    !state_medical_council ||
    !experience ||
    !consultation_fee ||
    !clinic_name ||
    !city
  ) {
    throw new ApiError(
      400,
      "All doctor fields are required: specialization, qualification, phone, medical_registration_number, state_medical_council, experience, consultation_fee, clinic_name, city"
    );
  }

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  // Fast email check with timeout
  let existingDoctor;
  try {
    existingDoctor = await Promise.race([
      Doctor.findOne({ email }).lean(),
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

  if (existingDoctor) throw new ApiError(400, "Email already registered");

  // Create doctor with timeout
  let doctor;
  try {
    doctor = await Promise.race([
      Doctor.create({
        name,
        email,
        password, // Password will be hashed by pre-save hook
        specialization,
        qualification,
        city,
        phone,
        medical_registration_number,
        state_medical_council,
        experience: parseInt(experience) || 0,
        clinic_name,
        consultation_type: consultation_type || "Both",
        consultation_fee: parseFloat(consultation_fee) || 0,
        role: "doctor",
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

  const token = generateToken({ id: doctor._id, role: doctor.role });
  const doctorObj = doctor.toObject();
  delete doctorObj.password;

  // Send response immediately
  return res
    .status(201)
    .json(new ApiResponse(201, { doctor: doctorObj, token }, "Doctor registered successfully"));
});

/**
 * @desc Login doctor
 * @route POST /api/doctors/login
 * @access Public
 */
export const loginDoctor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, "Database not available. Please try again later.");
  }

  // Fast query with timeout
  let doctor;
  try {
    doctor = await Promise.race([
      Doctor.findOne({ email }).select("+password").lean(),
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

  if (!doctor) throw new ApiError(401, "Invalid credentials");

  // Fast password comparison
  const isMatch = await bcrypt.compare(password, doctor.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const token = generateToken({ id: doctor._id, role: doctor.role });
  const doctorObj = { ...doctor };
  delete doctorObj.password;

  // Send response immediately
  return res
    .status(200)
    .json(new ApiResponse(200, { doctor: doctorObj, token }, "Login successful"));
});

/**
 * @desc Get logged-in doctor profile
 * @route GET /api/doctors/me
 * @access Doctor
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.user.id).select("-password");
  if (!doctor) throw new ApiError(404, "Doctor not found");

  return res
    .status(200)
    .json(new ApiResponse(200, doctor, "Doctor profile fetched successfully"));
});

/**
 * @desc Update logged-in doctor profile
 * @route PUT /api/doctors/me
 * @access Doctor
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.user.id);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  const { name, specialization, city, password } = req.body;

  if (name) doctor.name = name;
  if (specialization) doctor.specialization = specialization;
  if (city) doctor.city = city;
  if (password) doctor.password = await bcrypt.hash(password, 10);

  await doctor.save();

  const doctorObj = doctor.toObject();
  delete doctorObj.password;

  return res
    .status(200)
    .json(new ApiResponse(200, doctorObj, "Doctor profile updated successfully"));
});

/**
 * @desc Get all doctors
 * @route GET /api/doctors
 * @access Admin / testing
 */
export const getAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().select("-password");
  res.status(200).json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
});

/**
 * @desc Get doctor by ID
 * @route GET /api/doctors/:id
 * @access Admin / testing
 */
export const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).select("-password");
  if (!doctor) throw new ApiError(404, "Doctor not found");
  res.status(200).json(new ApiResponse(200, doctor, "Doctor fetched successfully"));
});

/**
 * @desc Update doctor by ID
 * @route PUT /api/doctors/:id
 * @access Doctor (testing)
 */
export const updateDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const doctor = await Doctor.findById(id);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  const allowed = ["name", "specialization", "city", "password", "email"];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key === "password") {
        doctor.password = await bcrypt.hash(updates.password, 10);
      } else {
        doctor[key] = updates[key];
      }
    }
  }
  await doctor.save();
  const obj = doctor.toObject();
  delete obj.password;
  res.status(200).json(new ApiResponse(200, obj, "Doctor updated successfully"));
});

/**
 * @desc Delete doctor by ID
 * @route DELETE /api/doctors/:id
 * @access Doctor (testing)
 */
export const deleteDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctor = await Doctor.findById(id);
  if (!doctor) throw new ApiError(404, "Doctor not found");
  await doctor.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Doctor deleted successfully"));
});

/**
 * @desc Get doctors by specialization/disease (multiple suggestions)
 * @route GET /api/doctors/specialization/:specialization
 * @access Public
 */
export const getDoctorsBySpecialization = asyncHandler(async (req, res) => {
  const { specialization } = req.params;
  const { limit = 5, sortBy = 'rating' } = req.query;

  console.log('🔍 Searching doctors for specialization:', specialization);
  console.log('📋 Query params:', { limit, sortBy });

  if (!specialization) {
    throw new ApiError(400, "Specialization is required");
  }

  // Build query - case insensitive search
  const query = {
    specialization: { $regex: new RegExp(specialization, 'i') }
  };

  console.log('🔎 MongoDB query:', JSON.stringify(query));

  // Build sort object
  let sort = {};
  if (sortBy === 'rating') {
    sort = { rating: -1, total_reviews: -1 }; // Highest rating first, then by reviews
  } else if (sortBy === 'experience') {
    sort = { experience: -1 }; // Most experience first
  } else {
    sort = { createdAt: -1 }; // Newest first
  }

  // Fetch doctors with limit
  const doctors = await Doctor.find(query)
    .select("-password")
    .sort(sort)
    .limit(parseInt(limit));

  console.log(`✅ Found ${doctors.length} doctor(s) for "${specialization}"`);

  if (doctors.length === 0) {
    console.log('⚠️ No doctors found - returning empty array');
    return res.status(200).json(
      new ApiResponse(200, [], `No doctors found for specialization: ${specialization}`)
    );
  }

  // Log first doctor for debugging
  if (doctors.length > 0) {
    console.log('📋 Sample doctor:', {
      name: doctors[0].name,
      specialization: doctors[0].specialization,
      rating: doctors[0].rating
    });
  }

  res.status(200).json(
    new ApiResponse(200, doctors, `Found ${doctors.length} doctor(s) for ${specialization}`)
  );
});