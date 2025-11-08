// src/middleware/report.validator.js
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
 * Validation rules for uploading a report
 */
export const uploadReportValidator = [
  body("reportType")
    .notEmpty()
    .withMessage("Report type is required")
    .isString()
    .withMessage("Report type must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("doctor")
    .optional()
    .isMongoId()
    .withMessage("Doctor ID must be a valid Mongo ID"),
  (req, res, next) => {
    // Check if file is uploaded
    if (!req.file) {
      return next(new ApiError(400, "Report file is required"));
    }
    next();
  },
  validate,
];

/**
 * Validation rules for deleting a report
 */
export const deleteReportValidator = [
  param("id")
    .notEmpty()
    .withMessage("Report ID is required")
    .isMongoId()
    .withMessage("Invalid Report ID"),
  validate,
];
