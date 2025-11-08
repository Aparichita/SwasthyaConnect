// src/middleware/notification.validator.js
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
 * Validation rules for creating notification
 */
export const createNotificationValidator = [
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isString()
    .withMessage("Message must be a string"),
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID"),
  body("type")
    .optional()
    .isString()
    .withMessage("Type must be a string"),
  validate,
];

/**
 * Validation rules for marking notification as read
 */
export const markNotificationReadValidator = [
  param("id")
    .notEmpty()
    .withMessage("Notification ID is required")
    .isMongoId()
    .withMessage("Invalid Notification ID"),
  validate,
];

/**
 * Validation rules for deleting notification
 */
export const deleteNotificationValidator = [
  param("id")
    .notEmpty()
    .withMessage("Notification ID is required")
    .isMongoId()
    .withMessage("Invalid Notification ID"),
  validate,
];
