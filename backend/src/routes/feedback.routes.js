import express from "express";
import {
  addFeedback,
  getAllFeedback,
  getFeedbackForDoctor,
  getMyFeedback,
  deleteFeedback,
} from "../controllers/feedback.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// 🧾 Add feedback (only for patients)
router.post("/", verifyToken, authorizeRoles("patient"), addFeedback);

// 📋 List all feedback (authenticated users)
router.get("/", verifyToken, getAllFeedback);

// 👩‍⚕️ Get all feedback for a doctor (public)
router.get("/:doctorId", getFeedbackForDoctor);

// 🙍‍♀️ Get feedbacks given by logged-in patient
router.get("/my/feedbacks", verifyToken, authorizeRoles("patient"), getMyFeedback);

// 🗑️ Delete feedback
router.delete("/:id", verifyToken, authorizeRoles("patient"), deleteFeedback);

export default router;