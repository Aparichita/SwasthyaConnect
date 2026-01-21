import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Report from "./src/models/report.model.js";
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
    
    console.log("Fetching reports...");
    const reports = await Report.find().limit(5).exec();
    
    if (reports.length === 0) {
      console.log("No reports found");
      process.exit(0);
    }
    
    console.log(`Found ${reports.length} reports\n`);
    
    for (const report of reports) {
      console.log("Report:", report.reportName);
      console.log("  cloudinaryPublicId:", report.cloudinaryPublicId);
      console.log("  fileUrl:", report.fileUrl);
      
      if (report.cloudinaryPublicId) {
        try {
          // Generate authenticated download URL
          const downloadUrl = cloudinary.url(report.cloudinaryPublicId, {
            type: 'authenticated',
            resource_type: 'auto'
          });
          console.log("  Generated download URL:", downloadUrl);
          
          // Also try regular URL with secure flag
          const secureUrl = cloudinary.url(report.cloudinaryPublicId, {
            secure: true,
            resource_type: 'auto'
          });
          console.log("  Generated secure URL:", secureUrl);
        } catch (err) {
          console.log("  Error generating URL:", err.message);
        }
      }
      console.log("");
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
};

test();
