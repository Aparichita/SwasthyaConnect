// backend/src/utils/api-error.js

export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
