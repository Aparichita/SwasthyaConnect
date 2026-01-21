import axios from "axios";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Initialize Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testViewDownloadFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Import Report model
    const reportSchema = new mongoose.Schema({}, { strict: false });
    const Report = mongoose.model("Report", reportSchema, "reports");
    
    // Get a report with cloudinaryPublicId
    const report = await Report.findOne({ cloudinaryPublicId: { $exists: true } }).limit(1);
    
    if (!report) {
      console.log("No reports with cloudinaryPublicId found");
      return;
    }

    console.log("\n=== Report Details ===");
    console.log("Report ID:", report._id);
    console.log("Report Name:", report.reportName);
    console.log("Public ID:", report.cloudinaryPublicId);
    console.log("File URL:", report.fileUrl);

    // Generate authenticated URL using SDK (what the backend will do)
    const authenticatedUrl = cloudinary.v2.url(report.cloudinaryPublicId, {
      resource_type: "auto"
    });

    console.log("\n=== Generated Authenticated URL ===");
    console.log(authenticatedUrl);

    // Test fetching with authenticated URL
    console.log("\n=== Testing Axios GET with Authenticated URL ===");
    const response = await axios.get(authenticatedUrl, {
      responseType: "arraybuffer",
      timeout: 10000
    });

    console.log("✅ SUCCESS! File retrieved");
    console.log("Content-Type:", response.headers["content-type"]);
    console.log("Content-Length:", response.data.byteLength, "bytes");

    if (response.data.byteLength === 0) {
      console.log("⚠️ WARNING: File is empty!");
    } else {
      console.log("✅ File has content!");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    if (err.response) {
      console.error("Response Status:", err.response.status);
      console.error("Response Data:", err.response.data?.toString());
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

testViewDownloadFix();
