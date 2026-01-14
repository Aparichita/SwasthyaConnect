// src/controllers/feedback.controller.js
import Feedback from "../models/feedback.model.js";
import Doctor from "../models/doctor.model.js"; // needed to verify doctor exists
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

/**
 * @desc Add feedback (general or for a doctor)
 * @route POST /api/feedback
 * @access Patient
 */
export const addFeedback = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const { doctorId, rating, comment, message } = req.body;

  // Determine comment content (optional)
  const feedbackComment = message || comment || "";

  // Default rating if not provided
  const feedbackRating = rating ? Number(rating) : 5;
  if (feedbackRating < 1 || feedbackRating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  // If doctorId is provided, verify it exists
  let doctor = null;
  if (doctorId) {
    doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new ApiError(400, "Doctor not found");
    }
  }

  // Create feedback
  const feedback = await Feedback.create({
    doctor: doctor ? doctor._id : undefined, // undefined for general feedback
    patient: patientId,
    rating: feedbackRating,
    comment: feedbackComment,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, feedback, "Feedback submitted successfully"));
});

/**
 * @desc Get all feedback (list all)
 * @route GET /api/feedback
 * @access Private (authenticated users)
 */
export const getAllFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find()
    .populate("patient", "name email")
    .populate("doctor", "name specialization")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, feedbacks, "All feedback fetched successfully"));
});

/**
 * @desc Get all feedback for a doctor
 * @route GET /api/feedback/:doctorId
 * @access Public
 */
export const getFeedbackForDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const feedbacks = await Feedback.find({ doctor: doctorId })
    .populate("patient", "name email")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, feedbacks, "Doctor feedback fetched successfully"));
});

/**
 * @desc Get feedbacks submitted by logged-in patient
 * @route GET /api/feedback/my/feedbacks
 * @access Patient
 */
export const getMyFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ patient: req.user.id })
    .populate("doctor", "name specialization")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, feedbacks, "Your feedback fetched successfully"));
});

/**
 * @desc Delete feedback (patient can delete their own)
 * @route DELETE /api/feedback/:id
 * @access Patient
 */
export const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new ApiError(404, "Feedback not found");

  if (feedback.patient.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized to delete this feedback");
  }

  await feedback.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Feedback deleted successfully"));
});
