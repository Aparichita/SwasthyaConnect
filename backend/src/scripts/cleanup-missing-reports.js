import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Report from "../models/report.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const cleanupMissingReports = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find all reports with local file paths
    const reportsWithLocalPaths = await Report.find({
      fileUrl: { $regex: "^uploads", $options: "i" },
    });

    console.log(`📊 Found ${reportsWithLocalPaths.length} reports with local paths\n`);

    let deleted = 0;
    let found = 0;

    for (const report of reportsWithLocalPaths) {
      const normalizedPath = report.fileUrl.replace(/\\/g, "/");
      const localPath = path.join(__dirname, "..", "..", normalizedPath);

      console.log(`\n📄 Checking: ${report.reportName}`);
      console.log(`   Path: ${report.fileUrl}`);

      if (fs.existsSync(localPath)) {
        console.log(`   ✅ File exists locally - KEEPING`);
        found++;
      } else {
        console.log(`   ❌ File not found - DELETING from MongoDB`);
        await Report.deleteOne({ _id: report._id });
        deleted++;
        console.log(`   ✅ Deleted`);
      }
    }

    console.log("\n\n==================================================");
    console.log("📊 CLEANUP SUMMARY");
    console.log("==================================================");
    console.log(`Total reports checked: ${reportsWithLocalPaths.length}`);
    console.log(`✅ Files found locally: ${found}`);
    console.log(`🗑️  Deleted (no file): ${deleted}`);
    console.log("==================================================\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

cleanupMissingReports();
