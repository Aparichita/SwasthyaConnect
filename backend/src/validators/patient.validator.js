// src/middleware/patient.validator.js
import { body, validationResult } from "express-validator";
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
 * Validation rules for patient registration
 */
export const registerPatientValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 32 })
    .withMessage("Password must be between 8 and 32 characters")
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/)
    .withMessage("Password must contain at least one letter, one number, and one special character"),
  body("city")
    .notEmpty()
    .withMessage("City is required")
    .isString()
    .withMessage("City must be a string"),
  body("age")
    .notEmpty()
    .withMessage("Age is required")
    .isInt({ min: 0 })
    .withMessage("Age must be a positive integer"),
  validate,
];

/**
 * Validation rules for updating patient profile
 */
export const updatePatientValidator = [
  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string"),
  body("city")
    .optional()
    .isString()
    .withMessage("City must be a string"),
  body("age")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Age must be a positive integer"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  validate,
];
