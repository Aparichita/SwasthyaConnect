import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const healthLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  bloodPressure: { type: String },
  sugarLevel: { type: String },
  weight: { type: Number },
  mood: { type: String },
});

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    age: {
      type: Number,
      required: false,
    },
    city: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^(\+91)?[0-9]{10}$/, "Invalid phone number format"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    location: {
      type: String,
    },
    existing_conditions: [
      {
        type: String,
      },
    ],
    symptoms: [
      {
        type: String,
      },
    ],
    daily_logs: [healthLogSchema],
    role: {
      type: String,
      default: "patient",
    },
  },
  { timestamps: true }
);

// Encrypt password before saving
patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
patientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
