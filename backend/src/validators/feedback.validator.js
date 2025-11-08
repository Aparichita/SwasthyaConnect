// src/middleware/feedback.validator.js
import { body, param, validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

/**
 * Middleware to handle validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((err) => err.msg).join(", ");
    return next(new ApiError(400, errorMsg));
  }
  next();
};

/**
 * Validation rules for creating feedback
 */
export const createFeedbackValidator = [
  body("message")
    .notEmpty()
    .withMessage("Feedback message is required")
    .isString()
    .withMessage("Message must be a string"),
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  validate,
];

/**
 * Validation rules for deleting feedback
 */
export const deleteFeedbackValidator = [
  param("id")
    .notEmpty()
    .withMessage("Feedback ID is required")
    .isMongoId()
    .withMessage("Invalid Feedback ID"),
  validate,
];
