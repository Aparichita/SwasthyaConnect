import mongoose from "mongoose";

const abhaSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true,
    },
    abhaNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    abhaAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["M", "F", "O"],
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    // ABDM Authentication tokens
    accessToken: {
      type: String,
      select: false, // Don't return in queries by default
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiry: {
      type: Date,
    },
    // Consent management
    consentStatus: {
      type: String,
      enum: ["pending", "granted", "revoked"],
      default: "pending",
    },
    consentArtifactId: {
      type: String,
    },
    // Health record sharing preferences
    sharePreferences: {
      shareWithDoctors: { type: Boolean, default: true },
      shareWithHospitals: { type: Boolean, default: false },
      shareWithFamily: { type: Boolean, default: false },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastSyncedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const ABHA = mongoose.model("ABHA", abhaSchema);
export default ABHA;

