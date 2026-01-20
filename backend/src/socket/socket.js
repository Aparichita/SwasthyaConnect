// backend/src/socket/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Conversation from "../models/conversation.model.js";
import Appointment from "../models/appointment.model.js";

/**
 * Initialize Socket.io server with authentication, room management, and notifications
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication token required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { id, role } = decoded;

      const UserModel = role === "patient" ? Patient : Doctor;
      const user = await UserModel.findById(id)
        .select("+isVerified +isEmailVerified")
        .lean();

      if (!user) return next(new Error("User not found"));

      const isVerified = user.isVerified ?? user.isEmailVerified;
      if (!isVerified) return next(new Error("Email verification required"));

      // Attach user info
      socket.userId = id;
      socket.userRole = role;
      socket.user = user;

      // Join a private room for user-specific notifications
      socket.join(`user_${id}`);

      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.userId} (${socket.userRole})`);

    // -------------------------
    // Conversation Chat Events
    // -------------------------
    socket.on("joinConversation", async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId)
          .populate("appointment")
          .lean();

        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const isPatient =
          socket.userRole === "patient" &&
          conversation.patient.toString() === socket.userId;
        const isDoctor =
          socket.userRole === "doctor" &&
          conversation.doctor.toString() === socket.userId;

        if (!isPatient && !isDoctor) {
          socket.emit("error", { message: "Unauthorized access to conversation" });
          return;
        }

        if (conversation.appointment?.status !== "confirmed") {
          socket.emit("error", { message: "Chat available only after confirmation" });
          return;
        }

        const room = `conversation_${conversationId}`;
        socket.join(room);
        console.log(`📥 User ${socket.userId} joined room: ${room}`);

        socket.emit("joinedConversation", { conversationId });
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { conversationId, messageText, attachmentUrl, messageType } = data;
        const conversation = await Conversation.findById(conversationId)
          .populate("appointment")
          .lean();

        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const isPatient =
          socket.userRole === "patient" &&
          conversation.patient.toString() === socket.userId;
        const isDoctor =
          socket.userRole === "doctor" &&
          conversation.doctor.toString() === socket.userId;

        if (!isPatient && !isDoctor) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        if (conversation.appointment?.status !== "confirmed") {
          socket.emit("error", { message: "Chat available only after confirmation" });
          return;
        }

        const room = `conversation_${conversationId}`;
        const messageData = {
          conversationId,
          senderId: socket.userId,
          senderRole: socket.userRole,
          messageText,
          attachmentUrl,
          messageType: messageType || "text",
          createdAt: new Date(),
        };

        io.to(room).emit("receiveMessage", messageData);
        console.log(`💬 Message sent in room ${room} by ${socket.userId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", ({ conversationId }) => {
      const room = `conversation_${conversationId}`;
      socket.to(room).emit("userTyping", {
        userId: socket.userId,
        userRole: socket.userRole,
        userName: socket.user?.name || "User",
      });
    });

    socket.on("stopTyping", ({ conversationId }) => {
      const room = `conversation_${conversationId}`;
      socket.to(room).emit("userStoppedTyping", { userId: socket.userId });
    });

    socket.on("messageRead", ({ conversationId, messageId }) => {
      const room = `conversation_${conversationId}`;
      socket.to(room).emit("messageReadReceipt", {
        messageId,
        readBy: socket.userId,
        readAt: new Date(),
      });
    });

    // -------------------------
    // User-specific Notifications
    // -------------------------
    socket.on("sendNotification", ({ toUserId, message, type, meta }) => {
      // Emit only to the specific user's room
      io.to(`user_${toUserId}`).emit("receiveNotification", {
        message,
        type: type || "info",
        meta: meta || {},
        timestamp: new Date(),
      });
      console.log(`🔔 Notification sent to user ${toUserId}: ${message}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};
