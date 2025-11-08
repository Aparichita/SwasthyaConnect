import twilio from "twilio";

/**
 * Send WhatsApp message via Twilio
 * @param {Object} options - WhatsApp options
 * @param {string} options.to - Recipient phone number (with country code, e.g., +919876543210)
 * @param {string} options.message - Message body
 * @returns {Promise<Object>} Twilio message result
 */
export const sendWhatsApp = async ({ to, message }) => {
  try {
    // Check for required environment variables with detailed error messages
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid) {
      throw new Error("TWILIO_ACCOUNT_SID is not set in environment variables. Please add it to your .env file.");
    }

    if (!authToken) {
      throw new Error("TWILIO_AUTH_TOKEN is not set in environment variables. Please add it to your .env file.");
    }

    const client = twilio(accountSid, authToken);

    // Twilio Sandbox number (always use this for testing)
    // For production, use your verified WhatsApp Business number
    const from = whatsappNumber || "whatsapp:+14155238886";
    
    // Format recipient number: ensure it starts with whatsapp: prefix
    // User should provide: +919876543210 (without whatsapp: prefix)
    const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    console.log(`Sending WhatsApp from ${from} to ${toFormatted}`);

    const result = await client.messages.create({
      from, // Sandbox number: whatsapp:+14155238886
      to: toFormatted, // Your number: whatsapp:+919876543210
      body: message,
    });

    console.log("WhatsApp message sent:", result.sid);
    return {
      success: true,
      messageSid: result.sid,
      status: result.status,
      from,
      to: toFormatted,
    };
  } catch (error) {
    console.error("Error sending WhatsApp message:", error.message);
    // Return more helpful error message
    if (error.message.includes("not set in environment variables")) {
      throw new Error(error.message);
    }
    throw new Error("WhatsApp sending failed: " + error.message);
  }
};

/**
 * Send WhatsApp notification template
 * @param {string} to - Recipient phone number
 * @param {string} templateType - Type of notification (appointment, report, reminder)
 * @param {Object} data - Template data
 */
export const sendWhatsAppNotification = async (to, templateType, data) => {
  const templates = {
    appointment_confirmation: `✅ Appointment Confirmed!\n\nDear ${data.patientName},\n\nYour appointment with Dr. ${data.doctorName} is confirmed.\n\n📅 Date: ${data.date}\n⏰ Time: ${data.time}\n\nThank you for using SwasthyaConnect!`,
    
    appointment_reminder: `🔔 Appointment Reminder\n\nDear ${data.patientName},\n\nThis is a reminder for your appointment with Dr. ${data.doctorName}.\n\n📅 Date: ${data.date}\n⏰ Time: ${data.time}\n\nPlease arrive 10 minutes early.\n\nSwasthyaConnect`,
    
    report_ready: `📄 Your Report is Ready!\n\nDear ${data.patientName},\n\nYour ${data.reportType || "medical"} report is now available.\n\nPlease log in to SwasthyaConnect to view and download.\n\nThank you!`,
    
    health_tip: `💡 Health Tip of the Day\n\n${data.tip}\n\nStay healthy with SwasthyaConnect!`,
    
    feedback_request: `📝 We'd love your feedback!\n\nDear ${data.patientName},\n\nHow was your experience with Dr. ${data.doctorName}?\n\nPlease share your feedback on SwasthyaConnect.\n\nThank you!`,
  };

  const message = templates[templateType] || data.message || "Notification from SwasthyaConnect";
  
  return await sendWhatsApp({ to, message });
};

