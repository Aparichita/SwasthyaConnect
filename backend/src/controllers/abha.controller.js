import ABHA from "../models/abha.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import axios from "axios";

/**
 * @desc Generate ABHA address (Health ID)
 * @route POST /api/abha/generate
 * @access Patient
 */
export const generateABHA = asyncHandler(async (req, res) => {
  const { name, gender, dateOfBirth, mobile, email } = req.body;
  const patientId = req.user.id;

  if (!name || !gender || !dateOfBirth || !mobile) {
    throw new ApiError(400, "Name, gender, date of birth, and mobile are required");
  }

  // Check if ABHA already exists
  const existing = await ABHA.findOne({ patient: patientId });
  if (existing) {
    throw new ApiError(400, "ABHA Health ID already exists for this patient");
  }

  try {
    // Call ABDM API to generate ABHA
    const abdmResponse = await axios.post(
      `${process.env.ABDM_BASE_URL}/v1/registration/aadhaar/generateOtp`,
      {
        aadhaar: req.body.aadhaar, // If using Aadhaar-based generation
      },
      {
        headers: {
          "X-HIU-ID": process.env.ABDM_HIU_ID,
          "X-CM-ID": process.env.ABDM_CM_ID,
          Authorization: `Bearer ${process.env.ABDM_API_KEY}`,
        },
      }
    );

    // For demo/development, generate mock ABHA
    const abhaNumber = `ABHA${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const abhaAddress = `${name.toLowerCase().replace(/\s+/g, "")}@abdm`;

    const abha = await ABHA.create({
      patient: patientId,
      abhaNumber,
      abhaAddress,
      name,
      gender,
      dateOfBirth,
      mobile,
      email: email || "",
      isVerified: false,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          {
            abhaNumber: abha.abhaNumber,
            abhaAddress: abha.abhaAddress,
            message: "ABHA Health ID generated successfully. Please verify to activate.",
          },
          "ABHA Health ID generated"
        )
      );
  } catch (error) {
    console.error("ABHA Generation Error:", error.message);
    throw new ApiError(500, "Failed to generate ABHA Health ID: " + error.message);
  }
});

/**
 * @desc Verify ABHA with OTP
 * @route POST /api/abha/verify
 * @access Patient
 */
export const verifyABHA = asyncHandler(async (req, res) => {
  const { otp, transactionId } = req.body;
  const patientId = req.user.id;

  if (!otp || !transactionId) {
    throw new ApiError(400, "OTP and transaction ID are required");
  }

  const abha = await ABHA.findOne({ patient: patientId });
  if (!abha) {
    throw new ApiError(404, "ABHA Health ID not found. Please generate first.");
  }

  try {
    // Verify OTP with ABDM
    const verifyResponse = await axios.post(
      `${process.env.ABDM_BASE_URL}/v1/registration/aadhaar/verifyOtp`,
      {
        otp,
        transactionId,
      },
      {
        headers: {
          "X-HIU-ID": process.env.ABDM_HIU_ID,
          Authorization: `Bearer ${process.env.ABDM_API_KEY}`,
        },
      }
    );

    // Update ABHA with verified status and tokens
    abha.isVerified = true;
    abha.accessToken = verifyResponse.data.accessToken;
    abha.refreshToken = verifyResponse.data.refreshToken;
    abha.tokenExpiry = new Date(Date.now() + verifyResponse.data.expiresIn * 1000);
    await abha.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { verified: true }, "ABHA Health ID verified successfully"));
  } catch (error) {
    console.error("ABHA Verification Error:", error.message);
    throw new ApiError(400, "OTP verification failed: " + error.message);
  }
});

/**
 * @desc Get patient's ABHA details
 * @route GET /api/abha/me
 * @access Patient
 */
export const getMyABHA = asyncHandler(async (req, res) => {
  const abha = await ABHA.findOne({ patient: req.user.id }).select("-accessToken -refreshToken");
  if (!abha) {
    throw new ApiError(404, "ABHA Health ID not found");
  }

  return res.status(200).json(new ApiResponse(200, abha, "ABHA details fetched"));
});

/**
 * @desc Share health records via ABHA
 * @route POST /api/abha/share-records
 * @access Patient
 */
export const shareHealthRecords = asyncHandler(async (req, res) => {
  const { doctorId, hospitalId, recordTypes, consentDuration } = req.body;
  const patientId = req.user.id;

  const abha = await ABHA.findOne({ patient: patientId });
  if (!abha || !abha.isVerified) {
    throw new ApiError(400, "ABHA Health ID not verified");
  }

  if (!recordTypes || recordTypes.length === 0) {
    throw new ApiError(400, "At least one record type must be specified");
  }

  try {
    // Create consent artifact via ABDM
    const consentResponse = await axios.post(
      `${process.env.ABDM_BASE_URL}/v1/consent/init`,
      {
        purpose: {
          text: "Treatment",
          code: "TREATMENT",
        },
        patient: {
          id: abha.abhaNumber,
        },
        hiTypes: recordTypes, // ["Prescription", "DiagnosticReport", "OPConsultation"]
        permission: {
          accessMode: "VIEW",
          dateRange: {
            from: new Date().toISOString(),
            to: new Date(Date.now() + (consentDuration || 30) * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        requester: {
          name: doctorId || hospitalId ? "Healthcare Provider" : "Self",
          identifier: {
            type: doctorId ? "DOCTOR" : "HOSPITAL",
            value: doctorId || hospitalId,
          },
        },
      },
      {
        headers: {
          "X-HIU-ID": process.env.ABDM_HIU_ID,
          Authorization: `Bearer ${abha.accessToken}`,
        },
      }
    );

    abha.consentStatus = "granted";
    abha.consentArtifactId = consentResponse.data.consentId;
    await abha.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            consentId: consentResponse.data.consentId,
            message: "Health records shared successfully",
          },
          "Records shared via ABHA"
        )
      );
  } catch (error) {
    console.error("ABHA Share Error:", error.message);
    throw new ApiError(500, "Failed to share records: " + error.message);
  }
});

/**
 * @desc Fetch health records from ABDM
 * @route GET /api/abha/fetch-records
 * @access Patient
 */
export const fetchHealthRecords = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const abha = await ABHA.findOne({ patient: patientId });

  if (!abha || !abha.isVerified) {
    throw new ApiError(400, "ABHA Health ID not verified");
  }

  try {
    // Fetch records from ABDM Health Information User (HIU)
    const recordsResponse = await axios.get(
      `${process.env.ABDM_BASE_URL}/v1/health-information/hip/fetch`,
      {
        headers: {
          "X-HIU-ID": process.env.ABDM_HIU_ID,
          Authorization: `Bearer ${abha.accessToken}`,
        },
        params: {
          consentId: abha.consentArtifactId,
        },
      }
    );

    abha.lastSyncedAt = new Date();
    await abha.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, recordsResponse.data, "Health records fetched successfully")
      );
  } catch (error) {
    console.error("ABHA Fetch Error:", error.message);
    throw new ApiError(500, "Failed to fetch records: " + error.message);
  }
});

