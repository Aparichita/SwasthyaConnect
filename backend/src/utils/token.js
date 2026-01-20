// src/utils/token.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

// Generate token
export const generateToken = (payload, expiresIn = '1d') => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured. Please add JWT_SECRET to your .env file.");
  }

  if (!payload || !payload.id) {
    throw new Error("Token payload must include 'id' field");
  }

  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  } catch (error) {
    throw new Error("Failed to generate token: " + error.message);
  }
};

// Verify token
export const verifyToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured. Please add JWT_SECRET to your .env file.");
  }

  if (!token) {
    throw new Error("Token is required");
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    } else if (err.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    } else {
      throw new Error("Token verification failed: " + err.message);
    }
  }
};
console.log('JWT_SECRET:', process.env.JWT_SECRET);
