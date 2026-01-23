import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get directory path (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
import testRoutes from "./routes/test.routes.js";

// Middlewares
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

// ✅ Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
    ];

    if (
      allowedOrigins.includes(origin) ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all (dev-safe)
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Length", "Content-Type"],
  maxAge: 86400,
}));

// ✅ Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Static files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(
  "/images",
  express.static(path.join(__dirname, "..", "..", "frontend", "public", "images"))
);

// ✅ API Routes
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

// ✅ Health check — GET (for browsers / manual checks)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Health check — HEAD (REQUIRED for UptimeRobot)
app.head("/api/health", (req, res) => {
  res.status(200).end();
});

// Test routes
app.use("/api", testRoutes);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/auth/login",
      "/api/auth/register",
      "/api/doctors",
      "/api/patients",
      "/api/appointments",
      "/api/reports",
      "/api/feedback",
      "/api/notifications",
      "/api/health",
    ],
  });
});

// ✅ Global Error Handler
app.use(errorHandler);

export default app;
