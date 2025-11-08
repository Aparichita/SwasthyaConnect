import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // allows either email or phone
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^\d{10}$/, "Invalid phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      default: "patient",
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const bcrypt = await import("bcrypt");
  const salt = await bcrypt.default.genSalt(10);
  this.password = await bcrypt.default.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  const bcrypt = await import("bcrypt");
  return bcrypt.default.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
