// src/controllers/ai.controller.js
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import AiResult from "../models/airesult.model.js";
import axios from "axios";

/**
 * @desc Analyze a report or patient data using AI
 * @route POST /api/ai/analyze
 * @access Patient
 */
export const analyzeData = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const { symptoms, reportText, location } = req.body;

  if (!symptoms && !reportText) {
    throw new ApiError(400, "Either symptoms or reportText is required for analysis");
  }

  // Example: Call external AI API or ML model
  let aiPrediction;
  try {
    const response = await axios.post("https://example-ai-api.com/predict", {
      symptoms,
      reportText,
      location,
    });
    aiPrediction = response.data;
  } catch (error) {
    throw new ApiError(500, "AI service failed: " + error.message);
  }

  // Save AI result in DB
  const result = await AiResult.create({
    patient: patientId,
    inputData: { symptoms, reportText, location },
    prediction: aiPrediction,
  });

  return res.status(200).json(new ApiResponse(200, result, "AI analysis completed"));
});

/**
 * @desc Get AI analysis results for logged-in patient
 * @route GET /api/ai/my-results
 * @access Patient
 */
export const getMyAiResults = asyncHandler(async (req, res) => {
  const results = await AiResult.find({ patient: req.user.id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, results, "Fetched AI results"));
});

/**
 * @desc Get AI results by patient id (doctor/patient)
 * @route GET /api/ai/results/:patientId
 */
export const getResultsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const results = await AiResult.find({ patient: patientId }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, results, "Fetched AI results for patient"));
});