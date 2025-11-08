import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

// Load JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET on module load
if (!JWT_SECRET) {
  console.error("⚠️  WARNING: JWT_SECRET is not defined in environment variables");
  console.error("Please add JWT_SECRET to your .env file in the backend directory");
  console.error("Example: JWT_SECRET=your-super-secret-key-at-least-32-characters-long");
}

if (JWT_SECRET && JWT_SECRET.length < 32) {
  console.warn("⚠️  WARNING: JWT_SECRET is too short (less than 32 characters). This may cause security issues.");
  console.warn("For production, use a strong secret key (at least 32 characters long)");
}

export const verifyToken = asyncHandler(async (req, res, next) => {
  // Check if JWT_SECRET is configured
  if (!JWT_SECRET) {
    throw new ApiError(
      500,
      "JWT_SECRET is not configured. Please add JWT_SECRET to your .env file and restart the server."
    );
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization token missing or invalid");
  }

  try {
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(401, "Token is missing");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ensure decoded token has required fields
    if (!decoded || !decoded.id) {
      throw new ApiError(401, "Invalid token structure");
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token");
    } else if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Token has expired");
    } else if (err instanceof ApiError) {
      throw err;
    } else {
      throw new ApiError(401, "Token verification failed: " + err.message);
    }
  }
});
