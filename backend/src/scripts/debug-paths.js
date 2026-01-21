import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const debug = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected\n");

    const db = mongoose.connection.db;
    const reports = await db.collection("reports").find({fileUrl: {$regex: "^uploads"}}).limit(3).toArray();

    console.log("Sample reports from MongoDB:\n");
    reports.forEach((r, idx) => {
      const fileUrl = r.fileUrl;
      const normalizedPath = fileUrl.replace(/\\/g, "/");
      const localPath = path.join(__dirname, "..", normalizedPath);
      
      console.log(`${idx + 1}. Report: ${r.reportName}`);
      console.log(`   Stored fileUrl: "${fileUrl}"`);
      console.log(`   Normalized: "${normalizedPath}"`);
      console.log(`   Resolved path: ${localPath}`);
      console.log(`   Expected actual file: ${path.basename(fileUrl)}`);
      console.log("");
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

debug();
