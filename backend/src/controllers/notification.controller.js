// src/controllers/notification.controller.js
import Notification from "../models/notification.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { sendMail } from "../utils/sendEmail.js"; // Use your utility here

/**
 * @desc Create a notification (for a user) and send email
 * @route POST /api/notification
 * @access Private (any authenticated user)
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type, email } = req.body;

  if (!userId || !title || !message) {
    throw new ApiError(400, "userId, title, and message are required");
  }

  // Create notification in DB
  const notification = await Notification.create({
    userId,
    title,
    message,
    type: type || "general",
    isRead: false,
  });

  // Send email if email is provided
  if (email) {
    try {
      await sendMail({
        to: email,
        subject: `New Notification: ${title}`,
        text: message,
        html: `<h3>${title}</h3><p>${message}</p>`,
      });
    } catch (err) {
      console.warn("Failed to send notification email:", err.message);
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, notification, "Notification created successfully"));
});

/**
 * @desc Get notifications for logged-in user
 * @route GET /api/notification/my
 * @access Private
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Fetched your notifications"));
});

/**
 * @desc Mark a notification as read
 * @route PATCH /api/notification/:id/read
 * @access Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, "Notification not found");

  if (notification.userId.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized to update this notification");
  }

  notification.isRead = true;
  await notification.save();

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

/**
 * @desc Delete a notification
 * @route DELETE /api/notification/:id
 * @access Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, "Notification not found");

  if (notification.userId.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized to delete this notification");
  }

  await notification.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Notification deleted successfully"));
});

/**
 * @desc Send a test notification email
 * @route POST /api/notification/send-test
 * @access Private
 */
export const sendTestEmail = asyncHandler(async (req, res) => {
  const { email, subject, message } = req.body;

  if (!email) throw new ApiError(400, "Recipient email is required");

  try {
    await sendMail({
      to: email,
      subject: subject || "Test Email from SwasthyaConnect",
      text: message || "This is a test email.",
      html: `<p>${message || "This is a test email."}</p>`,
    });
  } catch (err) {
    throw new ApiError(500, "Failed to send test email: " + err.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Test email sent successfully"));
});
