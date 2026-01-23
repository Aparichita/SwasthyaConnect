// backend/src/routes/health.routes.js
import express from "express";

const router = express.Router();

/**
 * Fast health endpoint for uptime monitoring (UptimeRobot, Render, etc.)
 * 
 * ✅ No database queries
 * ✅ No ML/AI logic
 * ✅ No third-party API calls
 * ✅ Returns 200 instantly
 * ✅ Supports both GET and HEAD methods
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "swasthyaconnect-backend",
    timestamp: new Date().toISOString(),
  });
});

// HEAD method support (required for UptimeRobot)
router.head("/health", (req, res) => {
  res.status(200).end();
});

export default router;

