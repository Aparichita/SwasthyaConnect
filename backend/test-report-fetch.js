import dotenv from "dotenv";
import axios from "axios";
import mongoose from "mongoose";
import Report from "./src/models/report.model.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const test = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Fetching a report...");
    const report = await Report.findOne().exec();
    
    if (!report) {
      console.log("No reports found");
      process.exit(0);
    }
    
    console.log("Report found:");
    console.log("  Name:", report.reportName);
    console.log("  URL:", report.fileUrl);
    console.log("  Type:", typeof report.fileUrl);
    console.log("  Starts with https?", report.fileUrl.startsWith("https"));
    
    // Try to fetch from Cloudinary
    if (report.fileUrl.startsWith("https://res.cloudinary.com")) {
      console.log("\nTesting Cloudinary fetch...");
      try {
        const response = await axios.get(report.fileUrl, {
          responseType: "arraybuffer",
          timeout: 10000,
          headers: {
            "User-Agent": "Node.js"
          }
        });
        console.log("✅ Cloudinary fetch successful!");
        console.log("  Response size:", response.data.byteLength, "bytes");
        console.log("  Content-Type:", response.headers["content-type"]);
      } catch (err) {
        console.error("❌ Cloudinary fetch failed!");
        console.error("  Error:", err.message);
        if (err.response) {
          console.error("  Status:", err.response.status);
          console.error("  StatusText:", err.response.statusText);
        }
      }
    } else {
      console.log("Report is not Cloudinary URL, skipping fetch test");
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
};

test();
