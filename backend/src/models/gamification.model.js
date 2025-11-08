import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "daily_log",
      "appointment_booking",
      "report_upload",
      "streak_7",
      "streak_30",
      "health_goal",
      "abha_linked",
      "feedback_given",
    ],
    required: true,
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
  points: {
    type: Number,
    default: 0,
  },
});

const healthStreakSchema = new mongoose.Schema({
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  lastActivityDate: {
    type: Date,
  },
});

const gamificationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    // Points needed for next level (increases with level)
    pointsForNextLevel: {
      type: Number,
      default: 100,
    },
    achievements: [achievementSchema],
    streak: healthStreakSchema,
    // Daily activity tracking
    dailyActivities: [
      {
        date: { type: Date, default: Date.now },
        activities: [
          {
            type: {
              type: String,
              enum: ["log", "appointment", "report", "feedback"],
            },
            points: Number,
            timestamp: Date,
          },
        ],
        totalPoints: { type: Number, default: 0 },
      },
    ],
    // Rewards redeemed
    rewardsRedeemed: [
      {
        rewardType: {
          type: String,
          enum: ["discount", "badge", "feature_unlock"],
        },
        description: String,
        redeemedAt: { type: Date, default: Date.now },
        pointsUsed: Number,
      },
    ],
    // Health goals
    activeGoals: [
      {
        goalType: {
          type: String,
          enum: ["weight_loss", "exercise", "medication", "checkup"],
        },
        target: String,
        currentProgress: String,
        deadline: Date,
        pointsReward: Number,
        status: {
          type: String,
          enum: ["active", "completed", "expired"],
          default: "active",
        },
      },
    ],
  },
  { timestamps: true }
);

// Calculate level based on total points
gamificationSchema.methods.calculateLevel = function () {
  const basePoints = 100;
  const multiplier = 1.5;
  let level = 1;
  let pointsNeeded = basePoints;
  let totalPointsForLevel = 0;

  while (this.totalPoints >= totalPointsForLevel + pointsNeeded) {
    totalPointsForLevel += pointsNeeded;
    level++;
    pointsNeeded = Math.floor(basePoints * Math.pow(multiplier, level - 1));
  }

  this.level = level;
  this.pointsForNextLevel = totalPointsForLevel + pointsNeeded - this.totalPoints;
  return level;
};

// Update streak
gamificationSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.streak) {
    this.streak = {
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
    };
    return;
  }

  const lastDate = this.streak.lastActivityDate
    ? new Date(this.streak.lastActivityDate)
    : null;
  if (lastDate) lastDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today - (lastDate || today)) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Same day, no change
    return;
  } else if (daysDiff === 1) {
    // Consecutive day
    this.streak.currentStreak += 1;
  } else {
    // Streak broken
    if (this.streak.currentStreak > this.streak.longestStreak) {
      this.streak.longestStreak = this.streak.currentStreak;
    }
    this.streak.currentStreak = 1;
  }

  this.streak.lastActivityDate = today;
};

const Gamification = mongoose.model("Gamification", gamificationSchema);
export default Gamification;

