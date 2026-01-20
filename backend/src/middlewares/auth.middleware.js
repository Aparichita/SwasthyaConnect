import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization token missing");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ NORMALIZE USER OBJECT (CRITICAL FIX)
    req.user = {
      _id: decoded._id || decoded.id,
      id: decoded._id || decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };

    if (!req.user.id || !req.user.role) {
      throw new ApiError(401, "Invalid token structure");
    }

    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
});
