import mongoose from "mongoose";
import bcrypt from "bcrypt";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
    },
    qualification: {
      type: String,
      required: [true, "Qualification is required"],
    },
    hospital_name: {
      type: String,
    },
    experience: {
      type: Number,
      default: 0,
    },
    consultation_fee: {
      type: Number,
      default: 0,
    },
    telemedicine_link: {
      type: String,
      default: "",
    },
    available_slots: [
      {
        date: String,
        time: String,
        isBooked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    total_reviews: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ["doctor"],
      default: "doctor",
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
doctorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
