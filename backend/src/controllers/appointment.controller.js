import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendMail } from "../utils/mail.js";

/**
 * @desc Book a new appointment
 * @route POST /api/appointments
 * @access Patient (protected)
 */
export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, time, symptoms } = req.body;
  const patientId = req.user.id;

  if (!doctorId || !date || !time) {
    return res.status(400).json({ message: "Doctor, date, and time are required." });
  }

  // Fetch patient and doctor
  const patient = await Patient.findById(patientId);
  if (!patient) return res.status(404).json({ message: "Patient not found." });

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return res.status(404).json({ message: "Doctor not found." });

  // Create appointment
  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    date,
    time,
    symptoms,
    status: "confirmed"
  });

  // Send email to patient
  if (patient.email) {
    try {
      await sendMail({
        to: patient.email,
        subject: "Appointment Confirmation - SwasthyaConnect",
        text: `Hi ${patient.name || "Patient"},\n\nYour appointment with Dr. ${doctor.name || "Doctor"} is confirmed for ${date} at ${time}.\n\nThank you for using SwasthyaConnect.`
      });
    } catch (err) {
      console.warn("Failed to send patient email:", err.message);
    }
  }

  // Send email to doctor
  if (doctor.email) {
    try {
      await sendMail({
        to: doctor.email,
        subject: "New Appointment Booked",
        text: `Hi Dr. ${doctor.name || "Doctor"},\n\nA new appointment has been booked by ${patient.name || "a patient"} on ${date} at ${time}.\n\nPlease check your dashboard for details.`
      });
    } catch (err) {
      console.warn("Failed to send doctor email:", err.message);
    }
  }

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully and notifications sent.",
    data: appointment,
  });
});

/**
 * @desc Get appointments for the logged-in user (doctor or patient)
 * @route GET /api/appointments/my
 * @access Protected
 */
export const getMyAppointments = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;

  let filter = {};
  if (role === "doctor") filter.doctor = userId;
  else if (role === "patient") filter.patient = userId;

  const appointments = await Appointment.find(filter)
    .populate("doctor", "name email")
    .populate("patient", "name email")
    .sort({ date: 1, time: 1 });

  res.json({
    success: true,
    count: appointments.length,
    data: appointments,
  });
});

/**
 * @desc Update appointment status (confirm / cancel / complete)
 * @route PUT /api/appointments/:id
 * @access Doctor only
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;

  if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });

  if (appointment.doctor.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized to update this appointment." });
  }

  appointment.status = status;
  await appointment.save();

  // Notify patient
  const patient = await Patient.findById(appointment.patient);
  const doctor = await Doctor.findById(appointment.doctor);
  if (patient?.email) {
    try {
      await sendMail({
        to: patient.email,
        subject: `Appointment ${status} - SwasthyaConnect`,
        text: `Hi ${patient.name || "Patient"},\n\nYour appointment with Dr. ${doctor?.name || "Doctor"} on ${appointment.date} at ${appointment.time} has been ${status}.\n\nSwasthyaConnect`
      });
    } catch (err) {
      console.warn("Failed to send status update email:", err.message);
    }
  }

  res.json({
    success: true,
    message: `Appointment ${status}.`,
    data: appointment,
  });
});

/**
 * @desc Delete appointment (patient cancels)
 * @route DELETE /api/appointments/:id
 * @access Patient only
 */
export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });

  if (appointment.patient.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not authorized to cancel this appointment." });
  }

  await appointment.deleteOne();

  // Notify doctor
  const doctor = await Doctor.findById(appointment.doctor);
  if (doctor?.email) {
    try {
      await sendMail({
        to: doctor.email,
        subject: "Appointment Cancelled - SwasthyaConnect",
        text: `Hi Dr. ${doctor.name || "Doctor"},\n\nThe appointment with ${req.user.name || "a patient"} on ${appointment.date} at ${appointment.time} has been cancelled.\n\nSwasthyaConnect`
      });
    } catch (err) {
      console.warn("Failed to send doctor cancellation email:", err.message);
    }
  }

  res.json({
    success: true,
    message: "Appointment cancelled successfully and doctor notified.",
  });
});
