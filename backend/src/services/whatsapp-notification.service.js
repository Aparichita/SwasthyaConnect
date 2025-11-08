import { sendWhatsApp, sendWhatsAppNotification } from "../utils/whatsapp.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import Doctor from "../models/doctor.model.js";

/**
 * Send WhatsApp notification to patient by patient ID
 * @param {string} patientId - Patient ID
 * @param {string} message - Message to send
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} Result with success status
 */
export const sendWhatsAppToPatient = async (patientId, message, maxRetries = 3) => {
  try {
    // Fetch patient from database
    const patient = await Patient.findById(patientId).select("name phone email");
    
    if (!patient) {
      throw new Error(`Patient with ID ${patientId} not found`);
    }

    // Check if patient has phone number
    if (!patient.phone) {
      throw new Error(`Patient ${patient.name} (${patientId}) does not have a phone number`);
    }

    // Format phone number (ensure it starts with +)
    let phoneNumber = patient.phone.trim();
    if (!phoneNumber.startsWith("+")) {
      // Assume Indian number if no country code
      if (phoneNumber.startsWith("0")) {
        phoneNumber = "+91" + phoneNumber.substring(1);
      } else if (phoneNumber.length === 10) {
        phoneNumber = "+91" + phoneNumber;
      } else {
        phoneNumber = "+91" + phoneNumber;
      }
    }

    // Retry logic
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await sendWhatsApp({
          to: phoneNumber,
          message: message,
        });

        return {
          success: true,
          patientId,
          patientName: patient.name,
          phoneNumber,
          messageSid: result.messageSid,
          attempt,
          message: "WhatsApp sent successfully",
        };
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed for patient ${patientId}:`, error.message);
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to send WhatsApp after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
  } catch (error) {
    return {
      success: false,
      patientId,
      error: error.message,
      message: "Failed to send WhatsApp notification",
    };
  }
};

/**
 * Send appointment reminder to patient
 * @param {string} appointmentId - Appointment ID
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} Result
 */
export const sendAppointmentReminderToPatient = async (appointmentId, maxRetries = 3) => {
  try {
    // Fetch appointment with populated patient and doctor
    const appointment = await Appointment.findById(appointmentId)
      .populate("patient", "name phone email")
      .populate("doctor", "name specialization");

    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const patient = appointment.patient;
    const doctor = appointment.doctor;

    if (!patient.phone) {
      throw new Error(`Patient ${patient.name} does not have a phone number`);
    }

    // Format phone number
    let phoneNumber = patient.phone.trim();
    if (!phoneNumber.startsWith("+")) {
      if (phoneNumber.startsWith("0")) {
        phoneNumber = "+91" + phoneNumber.substring(1);
      } else if (phoneNumber.length === 10) {
        phoneNumber = "+91" + phoneNumber;
      } else {
        phoneNumber = "+91" + phoneNumber;
      }
    }

    // Format date and time
    const appointmentDate = new Date(appointment.date).toLocaleDateString("en-GB");
    const appointmentTime = appointment.time;

    // Retry logic
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await sendWhatsAppNotification(phoneNumber, "appointment_reminder", {
          patientName: patient.name,
          doctorName: doctor.name,
          date: appointmentDate,
          time: appointmentTime,
        });

        return {
          success: true,
          appointmentId,
          patientId: patient._id,
          patientName: patient.name,
          phoneNumber,
          messageSid: result.messageSid,
          attempt,
          message: "Appointment reminder sent successfully",
        };
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed for appointment ${appointmentId}:`, error.message);
        
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw new Error(`Failed to send reminder after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
  } catch (error) {
    return {
      success: false,
      appointmentId,
      error: error.message,
      message: "Failed to send appointment reminder",
    };
  }
};

/**
 * Send appointment reminders to multiple patients (bulk)
 * @param {Array<string>} appointmentIds - Array of appointment IDs
 * @param {number} maxRetries - Maximum retry attempts per message
 * @returns {Promise<Object>} Results summary
 */
export const sendBulkAppointmentReminders = async (appointmentIds, maxRetries = 3) => {
  const results = {
    total: appointmentIds.length,
    successful: 0,
    failed: 0,
    details: [],
  };

  for (const appointmentId of appointmentIds) {
    const result = await sendAppointmentReminderToPatient(appointmentId, maxRetries);
    results.details.push(result);
    
    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
    }

    // Small delay between messages to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
};

/**
 * Send appointment reminders for upcoming appointments (within next 24 hours)
 * @param {number} hoursAhead - Hours ahead to check (default: 24)
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} Results summary
 */
export const sendUpcomingAppointmentReminders = async (hoursAhead = 24, maxRetries = 3) => {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // Find appointments in the next 24 hours
    const upcomingAppointments = await Appointment.find({
      date: {
        $gte: now,
        $lte: futureDate,
      },
      status: { $in: ["pending", "confirmed"] },
    })
      .populate("patient", "name phone email")
      .populate("doctor", "name specialization");

    if (upcomingAppointments.length === 0) {
      return {
        success: true,
        message: "No upcoming appointments found",
        total: 0,
        successful: 0,
        failed: 0,
        details: [],
      };
    }

    const appointmentIds = upcomingAppointments.map((apt) => apt._id.toString());
    const results = await sendBulkAppointmentReminders(appointmentIds, maxRetries);

    return {
      success: true,
      message: `Processed ${results.total} upcoming appointments`,
      ...results,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to send upcoming appointment reminders",
    };
  }
};

