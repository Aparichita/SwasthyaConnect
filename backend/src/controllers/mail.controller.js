import { sendMail } from "../utils/mail.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

/**
 * @desc Test sending email
 * @route POST /api/mail/test
 * @access Private (for testing)
 */
export const testMail = asyncHandler(async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject) {
    throw new ApiError(400, "Recipient email (to) and subject are required");
  }

  try {
    const info = await sendMail({
      to,
      subject,
      text: text || "This is a test email from SwasthyaConnect",
      html: html || `<p>This is a test email from SwasthyaConnect</p>`,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
          },
          "Email sent successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to send email: " + error.message);
  }
});

/**
 * @desc Send appointment confirmation email
 * @route POST /api/mail/appointment-confirmation
 * @access Private
 */
export const sendAppointmentConfirmation = asyncHandler(async (req, res) => {
  const { to, patientName, doctorName, date, time } = req.body;

  if (!to || !patientName || !doctorName || !date || !time) {
    throw new ApiError(400, "All fields are required");
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Appointment Confirmation</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment with <strong>Dr. ${doctorName}</strong> has been confirmed.</p>
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
      </div>
      <p>Thank you for using SwasthyaConnect!</p>
    </div>
  `;

  const text = `Appointment Confirmation\n\nDear ${patientName},\n\nYour appointment with Dr. ${doctorName} has been confirmed.\n\nDate: ${date}\nTime: ${time}\n\nThank you for using SwasthyaConnect!`;

  const info = await sendMail({
    to,
    subject: "Appointment Confirmation - SwasthyaConnect",
    text,
    html,
  });

  return res.status(200).json(new ApiResponse(200, { messageId: info.messageId }, "Confirmation email sent"));
});

/**
 * @desc Send report ready notification email
 * @route POST /api/mail/report-ready
 * @access Private
 */
export const sendReportReady = asyncHandler(async (req, res) => {
  const { to, patientName, reportType } = req.body;

  if (!to || !patientName) {
    throw new ApiError(400, "Recipient email and patient name are required");
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Your Report is Ready</h2>
      <p>Dear ${patientName},</p>
      <p>Your ${reportType || "medical"} report is now available in your SwasthyaConnect account.</p>
      <p>Please log in to view and download your report.</p>
      <p>Thank you for using SwasthyaConnect!</p>
    </div>
  `;

  const info = await sendMail({
    to,
    subject: "Your Report is Ready - SwasthyaConnect",
    html,
  });

  return res.status(200).json(new ApiResponse(200, { messageId: info.messageId }, "Report notification sent"));
});

