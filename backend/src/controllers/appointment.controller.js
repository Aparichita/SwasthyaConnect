import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Conversation from "../models/conversation.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendMail } from "../utils/mail.js";
import { ApiError } from "../utils/api-error.js";

/**
 * @desc Book a new appointment
 * @route POST /api/appointments
 * @access Patient
 */
export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, time, symptoms } = req.body;
  const patientId = req.user.id;

  if (!doctorId || !date || !time) {
    return res.status(400).json({ message: "Doctor, date, and time are required." });
  }

  const patient = await Patient.findById(patientId);
  if (!patient) return res.status(404).json({ message: "Patient not found." });

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return res.status(404).json({ message: "Doctor not found." });

  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    date,
    time,
    symptoms,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully.",
    data: appointment,
  });
});

/**
 * @desc Get appointments for logged-in user
 * @route GET /api/appointments/my OR /doctor
 * @access Protected
 */
export const getMyAppointments = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  let filter = {};

  if (req.user.role === "doctor") {
    filter.doctor = req.user.id;
  } else if (req.user.role === "patient") {
    filter.patient = req.user.id;
  } else {
    return res.status(403).json({ message: "Invalid role" });
  }

  const appointments = await Appointment.find(filter)
    .populate("doctor", "name email")
    .populate("patient", "name email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: appointments,
  });
});


/**
 * @desc Update appointment status
 * @route PUT /api/appointments/:id
 * @access Doctor only
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  // Check authorization - doctor must own this appointment
  const doctorId = req.user.id || req.user._id;
  const appointmentDoctorId = appointment.doctor.toString();
  
  if (appointmentDoctorId !== doctorId.toString()) {
    throw new ApiError(403, "Not authorized to update this appointment");
  }

  appointment.status = status;
  await appointment.save();

  // ✅ CREATE CONVERSATION WHEN CONFIRMED
  if (status === "confirmed") {
    const exists = await Conversation.findOne({
      appointment: appointment._id,
    });

    if (!exists) {
      await Conversation.create({
        doctor: appointment.doctor,
        patient: appointment.patient,
        appointment: appointment._id,
      });
    }
  }

  res.json({
    success: true,
    message: "Appointment updated",
    data: appointment,
  });
});

/**
 * @desc Delete appointment
 * @route DELETE /api/appointments/:id
 * @access Patient only
 */
export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  if (appointment.patient.toString() !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await appointment.deleteOne();

  res.json({
    success: true,
    message: "Appointment cancelled",
  });
});
