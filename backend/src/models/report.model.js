// backend/src/models/report.model.js - WITH CLOUDINARY SUPPORT

import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    reportName: {
      type: String,
      required: [true, "Report name is required"],
      trim: true,
    },
    reportType: {
      type: String,
      default: "Medical Report",
    },
    description: {
      type: String,
      maxlength: 500,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    // 🔥 NEW: Store Cloudinary public_id for deletion
    cloudinaryPublicId: {
      type: String,
      required: false,
    },
    fileType: {
      type: String,
      enum: ["pdf", "image", "other"],
      default: "pdf",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    aiInsights: {
      type: String,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;