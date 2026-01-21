import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const diagnoseReports = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;
    const reportsCollection = db.collection("reports");

    // Get all reports
    const allReports = await reportsCollection.find({}).toArray();
    console.log(`📊 Total reports in MongoDB: ${allReports.length}\n`);

    // Categorize reports by storage type
    const cloudinaryReports = allReports.filter(
      (r) => r.fileUrl && r.fileUrl.includes("res.cloudinary.com")
    );
    const localReports = allReports.filter(
      (r) => r.fileUrl && r.fileUrl.includes("uploads")
    );
    const otherReports = allReports.filter(
      (r) =>
        r.fileUrl &&
        !r.fileUrl.includes("res.cloudinary.com") &&
        !r.fileUrl.includes("uploads")
    );
    const noUrlReports = allReports.filter((r) => !r.fileUrl);

    console.log(`✅ Cloudinary URLs: ${cloudinaryReports.length}`);
    console.log(`❌ Local paths: ${localReports.length}`);
    console.log(`❓ Other paths: ${otherReports.length}`);
    console.log(`⚠️  No URL: ${noUrlReports.length}\n`);

    // Show local report details
    if (localReports.length > 0) {
      console.log("📄 Local Reports Details:");
      console.log("=".repeat(70));
      localReports.forEach((report, idx) => {
        console.log(
          `\n${idx + 1}. ${report.reportType} - ${
            report.description || "No description"
          }`
        );
        console.log(`   ID: ${report._id}`);
        console.log(`   Path: ${report.fileUrl}`);
        console.log(`   Cloudinary ID: ${report.cloudinaryPublicId || "Not set"}`);
      });
    }

    // Check local file system
    console.log("\n\n📁 Checking Local File System:");
    console.log("=".repeat(70));

    const uploadsDir = path.join(__dirname, "../../uploads/reports");
    const reportsDir = path.join(__dirname, "../../reports/uploads");

    console.log(`\n1. Checking: ${uploadsDir}`);
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`   ✅ Directory exists with ${files.length} files`);
      if (files.length > 0) {
        console.log("   Files:");
        files.slice(0, 10).forEach((f) => console.log(`   - ${f}`));
        if (files.length > 10) console.log(`   ... and ${files.length - 10} more`);
      }
    } else {
      console.log(`   ❌ Directory does not exist`);
    }

    console.log(`\n2. Checking: ${reportsDir}`);
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir);
      console.log(`   ✅ Directory exists with ${files.length} files`);
      if (files.length > 0) {
        console.log("   Files:");
        files.slice(0, 10).forEach((f) => console.log(`   - ${f}`));
        if (files.length > 10) console.log(`   ... and ${files.length - 10} more`);
      }
    } else {
      console.log(`   ❌ Directory does not exist`);
    }

    // Check backend root
    console.log(`\n3. Checking: ${path.join(__dirname, "..", "..", "uploads")}`);
    const backendUploads = path.join(__dirname, "..", "..", "uploads");
    if (fs.existsSync(backendUploads)) {
      const contents = fs.readdirSync(backendUploads);
      console.log(`   ✅ Directory exists with contents: ${contents.join(", ")}`);
    } else {
      console.log(`   ❌ Directory does not exist`);
    }

    // Summary
    console.log("\n\n📋 DIAGNOSIS SUMMARY:");
    console.log("=".repeat(70));
    console.log(`Total MongoDB reports: ${allReports.length}`);
    console.log(`  - Already on Cloudinary: ${cloudinaryReports.length} ✅`);
    console.log(`  - Need migration (local): ${localReports.length} ❌`);
    console.log(`  - Other storage: ${otherReports.length}`);
    console.log(`  - No URL stored: ${noUrlReports.length}`);

    if (localReports.length > 0) {
      console.log(
        `\n⚠️  ACTION REQUIRED: ${localReports.length} reports need migration`
      );
      console.log("IMPORTANT: File paths reference files that don't exist locally");
      console.log("These may have been previously uploaded and files deleted.");
    } else {
      console.log("\n✅ All reports are properly migrated to Cloudinary!");
    }

    console.log("\n\n💡 NEXT STEPS:");
    console.log("=".repeat(70));
    if (localReports.length > 0) {
      console.log("Option 1: Delete reports with missing local files");
      console.log("  → Run: node src/scripts/delete-missing-reports.js");
      console.log("\nOption 2: Ask users to re-upload their reports");
      console.log("  → Update frontend to handle missing files gracefully");
      console.log("\nOption 3: Check if files exist in backend/uploads directory");
      console.log("  → Verify the exact file paths on the server");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

diagnoseReports();
