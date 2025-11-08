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
    description: {
      type: String,
      maxlength: 500,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
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
      type: String, // optional field if analyzed by AI model
    },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;