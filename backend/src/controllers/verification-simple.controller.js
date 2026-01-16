// backend/src/controllers/verification-simple.controller.js
import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

/**
 * @desc Verify email using token
 * @route GET /api/verify-email/:token
 * @access Public
 * 
 * This endpoint:
 * 1. Finds a user (patient or doctor) with the given verificationToken
 * 2. If found, sets isVerified = true and clears verificationToken
 * 3. Returns success message
 * 4. If not found, returns error
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  // Search for user in both Patient and Doctor collections
  // We need to select verificationToken field explicitly since it's set to select: false
  // Also check if token hasn't expired (if emailVerificationExpires exists)
  let user = await Patient.findOne({ 
    verificationToken: token,
    $or: [
      { emailVerificationExpires: { $gt: new Date() } },
      { emailVerificationExpires: { $exists: false } }
    ]
  })
    .select("+verificationToken +emailVerificationExpires")
    .lean();

  let userModel = Patient;
  let userRole = "patient";

  // If not found in Patient, check Doctor collection
  if (!user) {
    user = await Doctor.findOne({ 
      verificationToken: token,
      $or: [
        { emailVerificationExpires: { $gt: new Date() } },
        { emailVerificationExpires: { $exists: false } }
      ]
    })
      .select("+verificationToken +emailVerificationExpires")
      .lean();
    userModel = Doctor;
    userRole = "doctor";
  }

  // If still not found, token is invalid
  if (!user) {
    throw new ApiError(400, "Invalid or expired token");
  }

  // Token found - verify the user
  // We need to use findByIdAndUpdate since we're using lean() above
  const updatedUser = await userModel.findByIdAndUpdate(
    user._id,
    {
      $set: {
        isVerified: true,
        isEmailVerified: true, // Also set legacy field for backward compatibility
      },
      $unset: {
        verificationToken: "", // Clear the token after verification
        emailVerificationToken: "", // Clear legacy token too
        emailVerificationExpires: "", // Clear expiry
      },
    },
    {
      new: true, // Return updated document
      runValidators: true,
    }
  );

  if (!updatedUser) {
    throw new ApiError(500, "Failed to verify account");
  }

  // Return success response
  res.status(200).json(
    new ApiResponse(
      200,
      { verified: true, role: userRole },
      "Your account has been verified!"
    )
  );
});

