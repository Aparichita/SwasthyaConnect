import Gamification from "../models/gamification.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

// Points configuration
const POINTS_CONFIG = {
  daily_log: 10,
  appointment_booking: 25,
  report_upload: 30,
  feedback_given: 15,
  abha_linked: 100,
  streak_7: 50,
  streak_30: 200,
  health_goal_completed: 75,
};

/**
 * @desc Get patient's gamification profile
 * @route GET /api/gamification/me
 * @access Patient
 */
export const getMyGamification = asyncHandler(async (req, res) => {
  let gamification = await Gamification.findOne({ patient: req.user.id });

  if (!gamification) {
    // Create new gamification profile
    gamification = await Gamification.create({
      patient: req.user.id,
      totalPoints: 0,
      level: 1,
      pointsForNextLevel: 100,
    });
  }

  // Calculate current level
  gamification.calculateLevel();

  return res
    .status(200)
    .json(new ApiResponse(200, gamification, "Gamification profile fetched"));
});

/**
 * @desc Award points for activity (internal function, can be called directly)
 * @param {string} patientId - Patient ID
 * @param {string} activityType - Type of activity
 * @param {number} points - Points to award
 * @returns {Promise<Object>} Updated gamification data
 */
export const awardPointsInternal = async (patientId, activityType, points) => {
  let gamification = await Gamification.findOne({ patient: patientId });

  if (!gamification) {
    gamification = await Gamification.create({
      patient: patientId,
      totalPoints: 0,
      level: 1,
      pointsForNextLevel: 100,
    });
  }

  // Update streak
  gamification.updateStreak();

  // Add points
  const oldLevel = gamification.level;
  gamification.totalPoints += points;
  gamification.calculateLevel();

  // Add to daily activities
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayActivity = gamification.dailyActivities.find(
    (a) => new Date(a.date).setHours(0, 0, 0, 0) === today.getTime()
  );

  if (!todayActivity) {
    todayActivity = {
      date: today,
      activities: [],
      totalPoints: 0,
    };
    gamification.dailyActivities.push(todayActivity);
  }

  todayActivity.activities.push({
    type: activityType,
    points,
    timestamp: new Date(),
  });
  todayActivity.totalPoints += points;

  // Check for streak achievements
  if (gamification.streak.currentStreak === 7 && !gamification.achievements.some((a) => a.type === "streak_7")) {
    gamification.achievements.push({
      type: "streak_7",
      points: POINTS_CONFIG.streak_7,
      earnedAt: new Date(),
    });
    gamification.totalPoints += POINTS_CONFIG.streak_7;
  }

  if (gamification.streak.currentStreak === 30 && !gamification.achievements.some((a) => a.type === "streak_30")) {
    gamification.achievements.push({
      type: "streak_30",
      points: POINTS_CONFIG.streak_30,
      earnedAt: new Date(),
    });
    gamification.totalPoints += POINTS_CONFIG.streak_30;
  }

  await gamification.save();
  gamification.calculateLevel();

  return {
    pointsAwarded: points,
    totalPoints: gamification.totalPoints,
    level: gamification.level,
    leveledUp: gamification.level > oldLevel,
    currentStreak: gamification.streak.currentStreak,
  };
};

/**
 * @desc Award points for activity (API endpoint)
 * @route POST /api/gamification/award-points
 * @access Patient
 */
export const awardPoints = asyncHandler(async (req, res) => {
  const { activityType, points } = req.body;
  const patientId = req.user.id;

  if (!activityType || !points) {
    throw new ApiError(400, "Activity type and points are required");
  }

  const result = await awardPointsInternal(patientId, activityType, points);

  return res.status(200).json(
    new ApiResponse(200, result, "Points awarded successfully")
  );
});

/**
 * @desc Record daily health log activity
 * @route POST /api/gamification/log-activity
 * @access Patient
 */
export const logActivity = asyncHandler(async (req, res) => {
  const { activityType } = req.body;
  const patientId = req.user.id;

  const points = POINTS_CONFIG[activityType] || 10;

  // Award points
  const result = await awardPointsInternal(patientId, activityType, points);

  return res.status(200).json(
    new ApiResponse(200, { points, ...result, message: "Activity logged and points awarded" }, "Activity logged")
  );
});

/**
 * @desc Get leaderboard
 * @route GET /api/gamification/leaderboard
 * @access Public
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const leaderboard = await Gamification.find()
    .populate("patient", "name email")
    .sort({ totalPoints: -1 })
    .limit(parseInt(limit))
    .select("patient totalPoints level streak");

  return res.status(200).json(new ApiResponse(200, leaderboard, "Leaderboard fetched"));
});

/**
 * @desc Get achievements
 * @route GET /api/gamification/achievements
 * @access Patient
 */
export const getAchievements = asyncHandler(async (req, res) => {
  const gamification = await Gamification.findOne({ patient: req.user.id });

  if (!gamification) {
    return res.status(200).json(new ApiResponse(200, { achievements: [] }, "No achievements yet"));
  }

  return res.status(200).json(
    new ApiResponse(200, { achievements: gamification.achievements }, "Achievements fetched")
  );
});

/**
 * @desc Create health goal
 * @route POST /api/gamification/goals
 * @access Patient
 */
export const createHealthGoal = asyncHandler(async (req, res) => {
  const { goalType, target, deadline, pointsReward } = req.body;
  const patientId = req.user.id;

  if (!goalType || !target || !deadline) {
    throw new ApiError(400, "Goal type, target, and deadline are required");
  }

  let gamification = await Gamification.findOne({ patient: patientId });

  if (!gamification) {
    gamification = await Gamification.create({
      patient: patientId,
      totalPoints: 0,
      level: 1,
      pointsForNextLevel: 100,
    });
  }

  gamification.activeGoals.push({
    goalType,
    target,
    currentProgress: "0",
    deadline: new Date(deadline),
    pointsReward: pointsReward || POINTS_CONFIG.health_goal_completed,
    status: "active",
  });

  await gamification.save();

  return res.status(201).json(new ApiResponse(201, gamification.activeGoals, "Health goal created"));
});

/**
 * @desc Update health goal progress
 * @route PUT /api/gamification/goals/:goalId
 * @access Patient
 */
export const updateGoalProgress = asyncHandler(async (req, res) => {
  const { goalId } = req.params;
  const { currentProgress, status } = req.body;
  const patientId = req.user.id;

  const gamification = await Gamification.findOne({ patient: patientId });
  if (!gamification) {
    throw new ApiError(404, "Gamification profile not found");
  }

  const goal = gamification.activeGoals.id(goalId);
  if (!goal) {
    throw new ApiError(404, "Goal not found");
  }

  if (currentProgress !== undefined) {
    goal.currentProgress = currentProgress;
  }

  if (status === "completed") {
    goal.status = "completed";
    // Award points
    gamification.totalPoints += goal.pointsReward;
    gamification.achievements.push({
      type: "health_goal",
      points: goal.pointsReward,
      earnedAt: new Date(),
    });
    gamification.calculateLevel();
  }

  await gamification.save();

  return res.status(200).json(new ApiResponse(200, goal, "Goal updated"));
});

/**
 * @desc Redeem reward
 * @route POST /api/gamification/redeem
 * @access Patient
 */
export const redeemReward = asyncHandler(async (req, res) => {
  const { rewardType, description, pointsRequired } = req.body;
  const patientId = req.user.id;

  if (!rewardType || !pointsRequired) {
    throw new ApiError(400, "Reward type and points required are needed");
  }

  const gamification = await Gamification.findOne({ patient: patientId });
  if (!gamification) {
    throw new ApiError(404, "Gamification profile not found");
  }

  if (gamification.totalPoints < pointsRequired) {
    throw new ApiError(400, "Insufficient points");
  }

  gamification.totalPoints -= pointsRequired;
  gamification.rewardsRedeemed.push({
    rewardType,
    description: description || "Reward redeemed",
    pointsUsed: pointsRequired,
  });

  gamification.calculateLevel();
  await gamification.save();

  return res.status(200).json(
    new ApiResponse(200, { remainingPoints: gamification.totalPoints }, "Reward redeemed successfully")
  );
});

