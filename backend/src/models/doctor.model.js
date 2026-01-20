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
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    // New simplified verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
   password: {
  type: String,
  required: [true, "Password is required"],
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
    medical_registration_number: {
      type: String,
      required: [true, "Medical registration number is required"],
      trim: true,
      match: [/^[A-Z0-9]{6,20}$/i, "Registration number must be 6-20 alphanumeric characters"],
    },
    state_medical_council: {
      type: String,
      required: [true, "State medical council is required"],
    },
    hospital_name: {
      type: String,
    },
    clinic_name: {
      type: String,
    },
    consultation_type: {
      type: String,
      enum: ["Online", "Offline", "Both"],
      default: "Both",
    },
    experience: {
      type: Number,
      required: [true, "Years of experience is required"],
      default: 0,
    },
    verification_status: {
      type: String,
      enum: ["unverified", "partially_verified", "fully_verified"],
      default: "partially_verified",
    },
    medical_certificate: {
      type: String, // URL or file path
    },
    degree_certificate: {
      type: String, // URL or file path
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
