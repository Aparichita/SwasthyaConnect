import {
  sendWhatsAppToPatient,
  sendAppointmentReminderToPatient,
  sendBulkAppointmentReminders,
  sendUpcomingAppointmentReminders,
} from "../services/whatsapp-notification.service.js";
import { sendWhatsApp } from "../utils/whatsapp.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

/**
 * @desc Send WhatsApp message to a specific patient
 * @route POST /api/notifications/patient/:patientId/whatsapp
 * @access Private (Doctor/Admin)
 */
export const sendWhatsAppToPatientById = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { message, maxRetries } = req.body;

  if (!message) {
    throw new ApiError(400, "Message is required");
  }

  const result = await sendWhatsAppToPatient(patientId, message, maxRetries || 3);

  if (!result.success) {
    throw new ApiError(500, result.error || "Failed to send WhatsApp");
  }

  return res.status(200).json(
    new ApiResponse(200, result, "WhatsApp sent to patient successfully")
  );
});

/**
 * @desc Send appointment reminder to patient
 * @route POST /api/notifications/appointment/:appointmentId/reminder
 * @access Private (Doctor/Admin)
 */
export const sendAppointmentReminder = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { maxRetries } = req.body;

  const result = await sendAppointmentReminderToPatient(appointmentId, maxRetries || 3);

  if (!result.success) {
    throw new ApiError(500, result.error || "Failed to send appointment reminder");
  }

  return res.status(200).json(
    new ApiResponse(200, result, "Appointment reminder sent successfully")
  );
});

/**
 * @desc Send appointment reminders to multiple patients (bulk)
 * @route POST /api/notifications/appointments/bulk-reminders
 * @access Private (Doctor/Admin)
 */
export const sendBulkReminders = asyncHandler(async (req, res) => {
  const { appointmentIds, maxRetries } = req.body;

  if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
    throw new ApiError(400, "appointmentIds array is required and must not be empty");
  }

  const results = await sendBulkAppointmentReminders(appointmentIds, maxRetries || 3);

  return res.status(200).json(
    new ApiResponse(
      200,
      results,
      `Processed ${results.total} appointments: ${results.successful} successful, ${results.failed} failed`
    )
  );
});

/**
 * @desc Send reminders for all upcoming appointments (next 24 hours)
 * @route POST /api/notifications/appointments/upcoming-reminders
 * @access Private (Doctor/Admin)
 */
export const sendUpcomingReminders = asyncHandler(async (req, res) => {
  const { hoursAhead = 24, maxRetries = 3 } = req.body;

  const results = await sendUpcomingAppointmentReminders(hoursAhead, maxRetries);

  if (!results.success && results.error) {
    throw new ApiError(500, results.error);
  }

  return res.status(200).json(
    new ApiResponse(200, results, results.message || "Upcoming appointment reminders processed")
  );
});

/**
 * @desc Send custom WhatsApp message to patient by phone number
 * @route POST /api/notifications/whatsapp/send
 * @access Private
 */
export const sendCustomWhatsApp = asyncHandler(async (req, res) => {
  const { phoneNumber, message, maxRetries = 3 } = req.body;

  if (!phoneNumber || !message) {
    throw new ApiError(400, "Phone number and message are required");
  }

  // Format phone number
  let formattedPhone = phoneNumber.trim();
  if (!formattedPhone.startsWith("+")) {
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+91" + formattedPhone.substring(1);
    } else if (formattedPhone.length === 10) {
      formattedPhone = "+91" + formattedPhone;
    } else {
      formattedPhone = "+91" + formattedPhone;
    }
  }

  // Retry logic
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendWhatsApp({
        to: formattedPhone,
        message: message,
      });

      return res.status(200).json(
        new ApiResponse(200, {
          success: true,
          phoneNumber: formattedPhone,
          messageSid: result.messageSid,
          attempt,
        }, "WhatsApp sent successfully")
      );
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new ApiError(500, `Failed to send WhatsApp after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
});

