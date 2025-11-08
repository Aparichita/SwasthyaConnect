// src/models/airesult.model.js
import mongoose from "mongoose";

const aiResultSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    inputData: {
      type: Object,
      required: true,
      // Example structure: { symptoms: [...], reportText: "string", location: "city" }
    },
    prediction: {
      type: Object,
      required: true,
      // Example: { riskScore: 0.85, advice: "Use inhaler, avoid pollution" }
    },
  },
  { timestamps: true }
);

const AiResult = mongoose.model("AiResult", aiResultSchema);
export default AiResult;
