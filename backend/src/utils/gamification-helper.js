import { awardPointsInternal } from "../controllers/gamification.controller.js";

/**
 * Helper function to award points when patient performs actions
 * Call this after successful operations in other controllers
 */
export const awardPointsForActivity = async (patientId, activityType) => {
  try {
    const pointsConfig = {
      daily_log: 10,
      appointment_booking: 25,
      report_upload: 30,
      feedback_given: 15,
      abha_linked: 100,
    };

    const points = pointsConfig[activityType] || 10;
    await awardPointsInternal(patientId, activityType, points);
  } catch (error) {
    // Don't fail the main operation if gamification fails
    console.error("Gamification error:", error.message);
  }
};

