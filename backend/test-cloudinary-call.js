import 'dotenv/config.js';
import mongoose from 'mongoose';
import cloudinary from './src/config/cloudinary.js';

async function testCloudinaryUrl() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get a report with cloudinaryPublicId
    const reportSchema = new mongoose.Schema({}, { strict: false });
    const Report = mongoose.model('Report', reportSchema, 'reports');
    
    const report = await Report.findById('6970a49825f1a5bd7eed163d');
    
    if (!report) {
      console.log('❌ Report not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n=== Report Details ===');
    console.log('ID:', report._id);
    console.log('Name:', report.reportName);
    console.log('cloudinaryPublicId:', report.cloudinaryPublicId);
    console.log('fileUrl:', report.fileUrl);
    
    if (!report.cloudinaryPublicId && !report.fileUrl) {
      console.log('❌ Report has no file URL or cloudinaryPublicId');
      await mongoose.disconnect();
      return;
    }
    
    // This is what the controller does
    console.log('\n=== Testing cloudinary.url() ===');
    try {
      let publicId = report.cloudinaryPublicId;
      
      // If no publicId but fileUrl is Cloudinary, extract publicId from URL
      if (!publicId && report.fileUrl?.startsWith("https://res.cloudinary.com")) {
        const match = report.fileUrl.match(/\/upload\/v\d+\/(.+?)(?:\?|$)/);
        if (match && match[1]) {
          publicId = match[1];
          console.log('✅ Extracted public ID from URL:', publicId);
        }
      }
      
      if (publicId) {
        const url = cloudinary.url(publicId, {
          resource_type: "auto"
        });
        console.log('✅ Generated authenticated URL:', url);
      } else {
        console.log('❌ Could not extract or find public ID');
      }
    } catch (err) {
      console.log('❌ Error generating URL:', err.message);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testCloudinaryUrl();
