import { sendWhatsApp, sendWhatsAppNotification } from "../utils/whatsapp.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

/**
 * @desc Test sending WhatsApp message
 * @route POST /api/whatsapp/test
 * @access Private (for testing)
 */
export const testWhatsApp = asyncHandler(async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    throw new ApiError(400, "Recipient phone number (to) and message are required");
  }

  // Check if Twilio credentials are configured
  const hasAccountSid = !!process.env.TWILIO_ACCOUNT_SID;
  const hasAuthToken = !!process.env.TWILIO_AUTH_TOKEN;
  const hasWhatsappNumber = !!process.env.TWILIO_WHATSAPP_NUMBER;

  if (!hasAccountSid || !hasAuthToken) {
    const missing = [];
    if (!hasAccountSid) missing.push("TWILIO_ACCOUNT_SID");
    if (!hasAuthToken) missing.push("TWILIO_AUTH_TOKEN");
    
    throw new ApiError(
      500,
      `Twilio credentials not configured. Missing: ${missing.join(", ")}. ` +
      `Please add these to your .env file in the backend directory and restart the server. ` +
      `Required variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER`
    );
  }

  try {
    const result = await sendWhatsApp({ to, message });

    return res
      .status(200)
      .json(new ApiResponse(200, result, "WhatsApp message sent successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to send WhatsApp: " + error.message);
  }
});

/**
 * @desc Send appointment confirmation via WhatsApp
 * @route POST /api/whatsapp/appointment-confirmation
 * @access Private
 */
export const sendAppointmentConfirmationWhatsApp = asyncHandler(async (req, res) => {
  const { to, patientName, doctorName, date, time } = req.body;

  if (!to || !patientName || !doctorName || !date || !time) {
    throw new ApiError(400, "All fields are required");
  }

  const result = await sendWhatsAppNotification(to, "appointment_confirmation", {
    patientName,
    doctorName,
    date,
    time,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Appointment confirmation sent via WhatsApp"));
});

/**
 * @desc Send appointment reminder via WhatsApp
 * @route POST /api/whatsapp/appointment-reminder
 * @access Private
 */
export const sendAppointmentReminder = asyncHandler(async (req, res) => {
  const { to, patientName, doctorName, date, time } = req.body;

  if (!to || !patientName || !doctorName || !date || !time) {
    throw new ApiError(400, "All fields are required");
  }

  const result = await sendWhatsAppNotification(to, "appointment_reminder", {
    patientName,
    doctorName,
    date,
    time,
  });

  return res.status(200).json(new ApiResponse(200, result, "Reminder sent via WhatsApp"));
});

/**
 * @desc Send report ready notification via WhatsApp
 * @route POST /api/whatsapp/report-ready
 * @access Private
 */
export const sendReportReadyWhatsApp = asyncHandler(async (req, res) => {
  const { to, patientName, reportType } = req.body;

  if (!to || !patientName) {
    throw new ApiError(400, "Recipient phone and patient name are required");
  }

  const result = await sendWhatsAppNotification(to, "report_ready", {
    patientName,
    reportType,
  });

  return res.status(200).json(new ApiResponse(200, result, "Report notification sent via WhatsApp"));
});

/**
 * @desc Send health tip via WhatsApp
 * @route POST /api/whatsapp/health-tip
 * @access Private
 */
export const sendHealthTip = asyncHandler(async (req, res) => {
  const { to, tip } = req.body;

  if (!to || !tip) {
    throw new ApiError(400, "Recipient phone and health tip are required");
  }

  const result = await sendWhatsAppNotification(to, "health_tip", {
    tip,
  });

  return res.status(200).json(new ApiResponse(200, result, "Health tip sent via WhatsApp"));
});

