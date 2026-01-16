// backend/src/socket/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Conversation from "../models/conversation.model.js";
import Appointment from "../models/appointment.model.js";

/**
 * Initialize Socket.io server with authentication and room management
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
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { id, role } = decoded;

      // Find user in database
      const UserModel = role === "patient" ? Patient : Doctor;
      const user = await UserModel.findById(id).select("+isVerified +isEmailVerified").lean();

      if (!user) {
        return next(new Error("User not found"));
      }

      // Check if user is verified
      const isVerified = user.isVerified !== undefined ? user.isVerified : user.isEmailVerified;
      if (!isVerified) {
        return next(new Error("Email verification required"));
      }

      // Attach user info to socket
      socket.userId = id;
      socket.userRole = role;
      socket.user = user;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.userId} (${socket.userRole})`);

    // Join conversation room
    socket.on("joinConversation", async (conversationId) => {
      try {
        // Verify user belongs to this conversation
        const conversation = await Conversation.findById(conversationId)
          .populate("appointment")
          .lean();

        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        // Check if user is part of this conversation
        const isPatient = socket.userRole === "patient" && conversation.patient.toString() === socket.userId;
        const isDoctor = socket.userRole === "doctor" && conversation.doctor.toString() === socket.userId;

        if (!isPatient && !isDoctor) {
          socket.emit("error", { message: "Unauthorized access to conversation" });
          return;
        }

        // Check if appointment is confirmed
        if (conversation.appointment?.status !== "confirmed") {
          socket.emit("error", { message: "Chat is available only after doctor confirms appointment" });
          return;
        }

        // Join room
        const room = `conversation_${conversationId}`;
        socket.join(room);
        console.log(`📥 User ${socket.userId} joined room: ${room}`);

        socket.emit("joinedConversation", { conversationId });
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
      try {
        const { conversationId, messageText, attachmentUrl, messageType } = data;

        // Verify conversation exists and user has access
        const conversation = await Conversation.findById(conversationId)
          .populate("appointment")
          .lean();

        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        // Check authorization
        const isPatient = socket.userRole === "patient" && conversation.patient.toString() === socket.userId;
        const isDoctor = socket.userRole === "doctor" && conversation.doctor.toString() === socket.userId;

        if (!isPatient && !isDoctor) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        // Check appointment status
        if (conversation.appointment?.status !== "confirmed") {
          socket.emit("error", { message: "Chat is available only after doctor confirms appointment" });
          return;
        }

        // Emit message to all users in the conversation room
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

    // Handle typing indicator
    socket.on("typing", async (data) => {
      try {
        const { conversationId } = data;
        const room = `conversation_${conversationId}`;

        // Broadcast typing to others in the room
        socket.to(room).emit("userTyping", {
          userId: socket.userId,
          userRole: socket.userRole,
          userName: socket.user?.name || "User",
        });
      } catch (error) {
        console.error("Error handling typing:", error);
      }
    });

    // Handle stop typing
    socket.on("stopTyping", async (data) => {
      try {
        const { conversationId } = data;
        const room = `conversation_${conversationId}`;

        socket.to(room).emit("userStoppedTyping", {
          userId: socket.userId,
        });
      } catch (error) {
        console.error("Error handling stop typing:", error);
      }
    });

    // Handle message read
    socket.on("messageRead", async (data) => {
      try {
        const { conversationId, messageId } = data;
        const room = `conversation_${conversationId}`;

        // Broadcast read receipt
        socket.to(room).emit("messageReadReceipt", {
          messageId,
          readBy: socket.userId,
          readAt: new Date(),
        });
      } catch (error) {
        console.error("Error handling message read:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

