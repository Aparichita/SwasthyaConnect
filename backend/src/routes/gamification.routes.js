import express from "express";
import {
  getMyGamification,
  awardPoints,
  logActivity,
  getLeaderboard,
  getAchievements,
  createHealthGoal,
  updateGoalProgress,
  redeemReward,
} from "../controllers/gamification.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Get gamification profile (patient only)
router.get("/me", verifyToken, authorizeRoles("patient"), getMyGamification);

// Award points (internal/system use)
router.post("/award-points", verifyToken, authorizeRoles("patient"), awardPoints);

// Log activity
router.post("/log-activity", verifyToken, authorizeRoles("patient"), logActivity);

// Leaderboard (public)
router.get("/leaderboard", getLeaderboard);

// Get achievements (patient only)
router.get("/achievements", verifyToken, authorizeRoles("patient"), getAchievements);

// Health goals (patient only)
router.post("/goals", verifyToken, authorizeRoles("patient"), createHealthGoal);
router.put("/goals/:goalId", verifyToken, authorizeRoles("patient"), updateGoalProgress);

// Redeem rewards (patient only)
router.post("/redeem", verifyToken, authorizeRoles("patient"), redeemReward);

export default router;

