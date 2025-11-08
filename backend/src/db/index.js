import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("⚠️  MONGO_URI not set in environment variables");
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 2,
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("   Hint: Check username/password and URL-encoding");
    console.error("   Hint: Ensure Atlas IP allowlist includes your IP (or 0.0.0.0/0)");
    return false;
  }
};

export default connectDB;
