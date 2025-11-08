// backend/src/index.js
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import app from "./app.js";
import connectDB from "./db/index.js";

// Get directory path (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

// Debug: Check if .env file exists
const envExists = fs.existsSync(envPath);
if (!envExists) {
  console.error("\n❌ .env file not found!");
  console.error(`   Expected location: ${envPath}`);
  console.error("\n📝 QUICK FIX: Create a .env file in the backend directory");
  console.error("   Copy the content below into backend/.env file:\n");
  console.error("   JWT_SECRET=swasthyaconnect-secret-key-2024-production-safe-1234567890");
  console.error("   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname");
  console.error("   TWILIO_ACCOUNT_SID=your-account-sid");
  console.error("   TWILIO_AUTH_TOKEN=your-auth-token");
  console.error("   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886");
  console.error("\n   Then restart your server.\n");
}

// Validate critical environment variables
console.log("\n📋 Checking environment variables...\n");

const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
};

const optionalEnvVars = {
  MONGO_URI: process.env.MONGO_URI,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
};

// Check required variables
const missingRequired = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingRequired.length > 0) {
  console.error("❌ Missing REQUIRED environment variables:");
  missingRequired.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error("\n⚠️  Server will start but authentication won't work.\n");
}

// Check optional variables
const missingOptional = Object.entries(optionalEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingOptional.length > 0) {
  console.warn("⚠️  Missing optional environment variables:");
  missingOptional.forEach((varName) => {
    console.warn(`   - ${varName}`);
  });
  console.warn("   Related features may not work.\n");
}

// Validate JWT_SECRET strength
if (process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET.length < 32) {
    console.warn("⚠️  WARNING: JWT_SECRET is too short (less than 32 characters)");
    console.warn("   For production, use a strong secret key (at least 32 characters)");
    console.warn("   Example: JWT_SECRET=my-super-secret-key-12345678901234567890\n");
  } else {
    console.log("✅ JWT_SECRET is configured");
  }
}

// Check Twilio configuration
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  console.log("✅ Twilio credentials are configured");
} else {
  console.warn("⚠️  Twilio not configured - WhatsApp features won't work");
}

// Start the server first (don't wait for MongoDB)
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (non-blocking, doesn't prevent server from starting)
console.log("\n🔌 Connecting to MongoDB...\n");
connectDB()
  .then((connected) => {
    if (connected) {
      console.log("✅ MongoDB connection successful\n");
    } else {
      console.warn("⚠️  MongoDB not connected - Database features won't work\n");
      console.warn("   Note: Twilio WhatsApp routes work independently and don't require MongoDB\n");
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.warn("   Server will continue running without database connection\n");
  });

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`\n✅ API endpoints are available at http://localhost:${PORT}/api`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health\n`);
  
  // Show available routes
  console.log("📋 Available API Routes:");
  console.log("   - POST /api/patients/register");
  console.log("   - POST /api/doctors/register");
  console.log("   - POST /api/auth/login");
  console.log("   - GET /api/health\n");
});
