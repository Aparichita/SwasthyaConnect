import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/auth.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import reportRoutes from "./routes/report.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import gamificationRoutes from "./routes/gamification.routes.js";
import mailRoutes from "./routes/mail.routes.js";
import whatsappRoutes from "./routes/whatsapp.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import messageRoutes from "./routes/message.routes.js";

// Middlewares
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

// ✅ Global Middlewares
// CORS configuration - allow all frontend origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5175',
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body
app.use("/uploads", express.static("uploads")); // Serve uploaded files

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// ✅ Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "success", message: "API is running 🚀" });
});

// ✅ Global Error Handler (must be last)
app.use(errorHandler);

export default app;
