// backend/src/controllers/message.controller.js
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Appointment from "../models/appointment.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/messages";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG, PNG, and PDF files are allowed"));
  },
}).single("attachment");

/**
 * @desc Get or create conversation for an appointment
 * @route GET /api/messages/conversation/:appointmentId
 * @access Protected
 */
export const getConversation = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Verify appointment exists and user is part of it
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (
    (userRole === "patient" && appointment.patient.toString() !== userId) ||
    (userRole === "doctor" && appointment.doctor.toString() !== userId)
  ) {
    throw new ApiError(403, "Not authorized to access this conversation");
  }

  // 🔒 CRITICAL: Chat only enabled for confirmed appointments
  if (appointment.status !== "confirmed") {
    throw new ApiError(403, `Chat is only available for confirmed appointments. Current status: ${appointment.status}. Please wait for doctor approval.`);
  }

  // Find or create conversation
  let conversation = await Conversation.findOne({ appointment: appointmentId })
    .populate("doctor", "name email")
    .populate("patient", "name email");

  if (!conversation) {
    conversation = await Conversation.create({
      doctor: appointment.doctor,
      patient: appointment.patient,
      appointment: appointmentId,
    });
    await conversation.populate("doctor", "name email");
    await conversation.populate("patient", "name email");
  }

  res.status(200).json(new ApiResponse(200, conversation, "Conversation fetched successfully"));
});

/**
 * @desc Get all conversations for logged-in user
 * @route GET /api/messages/conversations
 * @access Protected
 */
export const getMyConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  const filter = userRole === "doctor" ? { doctor: userId } : { patient: userId };

  const conversations = await Conversation.find(filter)
    .populate("doctor", "name email specialization")
    .populate("patient", "name email")
    .populate("appointment", "date time status")
    .sort({ lastMessageAt: -1 });

  res.status(200).json(new ApiResponse(200, conversations, "Conversations fetched successfully"));
});

/**
 * @desc Get messages for a conversation
 * @route GET /api/messages/:conversationId
 * @access Protected
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Verify user is part of conversation
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  if (
    (userRole === "patient" && conversation.patient.toString() !== userId) ||
    (userRole === "doctor" && conversation.doctor.toString() !== userId)
  ) {
    throw new ApiError(403, "Not authorized to access this conversation");
  }

  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: 1 })
    .limit(100);

  // Mark messages as read
  await Message.updateMany(
    {
      conversation: conversationId,
      senderRole: { $ne: userRole },
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  // Update unread count
  if (userRole === "doctor") {
    conversation.unreadCount.doctor = 0;
  } else {
    conversation.unreadCount.patient = 0;
  }
  await conversation.save();

  res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

/**
 * @desc Send a message
 * @route POST /api/messages/send
 * @access Protected
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, messageText, messageType } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!conversationId) {
    throw new ApiError(400, "Conversation ID is required");
  }

  // Verify user is part of conversation
  const conversation = await Conversation.findById(conversationId)
    .populate("appointment");
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  if (
    (userRole === "patient" && conversation.patient.toString() !== userId) ||
    (userRole === "doctor" && conversation.doctor.toString() !== userId)
  ) {
    throw new ApiError(403, "Not authorized to send messages in this conversation");
  }

  // 🔒 CRITICAL: Chat only enabled for confirmed appointments
  if (!conversation.appointment || conversation.appointment.status !== "confirmed") {
    throw new ApiError(403, `Chat is only available for confirmed appointments. Current status: ${conversation.appointment?.status || 'unknown'}.`);
  }

  const message = await Message.create({
    conversation: conversationId,
    senderRole: userRole,
    senderId: userId,
    messageText: messageText || "",
    messageType: messageType || "text",
  });

  // Update conversation
  conversation.lastMessage = messageText || "Attachment";
  conversation.lastMessageAt = new Date();
  if (userRole === "doctor") {
    conversation.unreadCount.patient += 1;
  } else {
    conversation.unreadCount.doctor += 1;
  }
  await conversation.save();

  res.status(201).json(new ApiResponse(201, message, "Message sent successfully"));
});

/**
 * @desc Upload attachment and send message
 * @route POST /api/messages/upload
 * @access Protected
 */
export const uploadAttachment = asyncHandler(async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { conversationId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!conversationId || !req.file) {
      return res.status(400).json({ success: false, message: "Conversation ID and file are required" });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId)
      .populate("appointment");
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (
      (userRole === "patient" && conversation.patient.toString() !== userId) ||
      (userRole === "doctor" && conversation.doctor.toString() !== userId)
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // 🔒 CRITICAL: Chat only enabled for confirmed appointments
    if (!conversation.appointment || conversation.appointment.status !== "confirmed") {
      return res.status(403).json({ 
        success: false, 
        message: `Chat is only available for confirmed appointments. Current status: ${conversation.appointment?.status || 'unknown'}.` 
      });
    }

    const fileType = req.file.mimetype.startsWith("image/") ? "image" : "pdf";
    const attachmentUrl = `/uploads/messages/${req.file.filename}`;

    const message = await Message.create({
      conversation: conversationId,
      senderRole: userRole,
      senderId: userId,
      messageText: req.body.messageText || "",
      attachmentUrl,
      messageType: fileType,
    });

    // Update conversation
    conversation.lastMessage = req.body.messageText || `Sent a ${fileType}`;
    conversation.lastMessageAt = new Date();
    if (userRole === "doctor") {
      conversation.unreadCount.patient += 1;
    } else {
      conversation.unreadCount.doctor += 1;
    }
    await conversation.save();

    res.status(201).json(new ApiResponse(201, message, "File uploaded and message sent successfully"));
  });
});

