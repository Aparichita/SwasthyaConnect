import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: false,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient", // updated
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Minimum rating is 1"],
      max: [5, "Maximum rating is 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate feedback for the same doctor by the same patient
feedbackSchema.index(
  { doctor: 1, patient: 1 },
  { unique: true, partialFilterExpression: { doctor: { $exists: true } } }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
