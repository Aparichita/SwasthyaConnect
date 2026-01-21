// backend/scripts/migrate-reports-to-cloudinary.js
// Run this ONCE to migrate all old reports to Cloudinary

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: Load .env BEFORE importing modules that use process.env
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

// Configure cloudinary with loaded env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// NOW import modules that depend on environment variables
import mongoose from "mongoose";
import Report from "../models/report.model.js";

const migrateReports = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find all reports with local file paths (handles both / and \ separators)
    const reports = await Report.find({
      fileUrl: { $regex: "^uploads", $options: "i" },
    });

    console.log(`\n📊 Found ${reports.length} reports to migrate\n`);

    if (reports.length === 0) {
      console.log("✅ No reports need migration");
      process.exit(0);
    }

    let migrated = 0;
    let failed = 0;
    let notFound = 0;

    for (const report of reports) {
      try {
        // Normalize path separators - handle both / and \
        const normalizedPath = report.fileUrl.replace(/\\/g, "/");
        // __dirname is src/scripts, need to go up to backend root then into uploads
        const localPath = path.join(__dirname, "..", "..", normalizedPath);
        
        console.log(`\n📄 Processing: ${report.reportName}`);
        console.log(`   Local path: ${report.fileUrl}`);
        
        // Check if file exists
        if (!fs.existsSync(localPath)) {
          console.log(`   ❌ File not found locally - SKIPPING`);
          notFound++;
          continue;
        }

        // Upload to Cloudinary
        console.log(`   📤 Uploading to Cloudinary...`);
        const result = await cloudinary.uploader.upload(localPath, {
          folder: "swasthya-connect/reports",
          resource_type: "auto",
          use_filename: true,
          unique_filename: true,
        });

        // Update database
        report.fileUrl = result.secure_url;
        report.cloudinaryPublicId = result.public_id;
        await report.save();

        console.log(`   ✅ Migrated successfully`);
        console.log(`   🔗 New URL: ${result.secure_url}`);
        migrated++;

        // Optional: Delete local file after successful migration
        // Uncomment if you want to clean up local files
        // fs.unlinkSync(localPath);
        // console.log(`   🗑️ Local file deleted`);

      } catch (error) {
        console.log(`   ❌ Migration failed: ${error.message}`);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total reports found:  ${reports.length}`);
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`❌ Failed:               ${failed}`);
    console.log(`🔍 Not found locally:    ${notFound}`);
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  }
};

migrateReports();