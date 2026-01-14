// backend/src/routes/message.routes.js
import express from "express";
import {
  getConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  uploadAttachment,
} from "../controllers/message.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get or create conversation for appointment
router.get("/conversation/:appointmentId", getConversation);

// Get all conversations for user
router.get("/conversations", getMyConversations);

// Get messages for a conversation
router.get("/:conversationId", getMessages);

// Send a text message
router.post("/send", sendMessage);

// Upload attachment and send message
router.post("/upload", uploadAttachment);

export default router;

