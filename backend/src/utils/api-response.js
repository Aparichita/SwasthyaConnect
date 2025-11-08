// backend/src/utils/api-response.js

// Class-based standard API response
export class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }
}

// Optional: helper functions similar to your old code
export const successResponse = (res, data, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message = "Error", statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};
