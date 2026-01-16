// frontend/src/utils/socket.js
import { io } from "socket.io-client";

let socket = null;

/**
 * Initialize Socket.io connection
 * @param {string} token - JWT token for authentication
 * @returns {Socket} Socket instance
 */
export const initializeSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseURL = API_URL.replace("/api", "");

  socket = io(baseURL, {
    auth: {
      token: token,
    },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  return socket;
};

/**
 * Get current socket instance
 * @returns {Socket|null} Socket instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { initializeSocket, getSocket, disconnectSocket };

