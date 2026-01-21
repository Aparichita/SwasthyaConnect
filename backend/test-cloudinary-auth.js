import dotenv from "dotenv";
import axios from "axios";
import mongoose from "mongoose";
import Report from "./src/models/report.model.js";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    
    console.log("Report found:", report.reportName);
    const url = report.fileUrl;
    console.log("URL:", url);
    
    // Extract public_id from URL
    const matches = url.match(/\/v\d+\/(.+?)(\.pdf|\.jpg|\.png)?$/);
    if (matches) {
      const publicId = matches[1];
      console.log("\nExtracted public_id:", publicId);
      
      // Try to get file info from Cloudinary
      try {
        const resource = await cloudinary.api.resource(publicId);
        console.log("✅ Resource found in Cloudinary!");
        console.log("  Secure URL:", resource.secure_url);
        console.log("  Type:", resource.type);
        console.log("  Format:", resource.format);
      } catch (err) {
        console.error("❌ Error getting resource:", err.message);
      }
    }
    
    // Try direct axios fetch with Basic Auth
    console.log("\nTrying axios with Basic Auth...");
    const credentials = Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString("base64");
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: {
          "Authorization": `Basic ${credentials}`,
          "User-Agent": "Node.js"
        }
      });
      console.log("✅ Fetch with auth successful!");
      console.log("  Response size:", response.data.byteLength, "bytes");
    } catch (err) {
      console.error("❌ Fetch with auth failed:", err.message);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
};

test();
