import 'dotenv/config.js';
import mongoose from 'mongoose';
import cloudinary from './src/config/cloudinary.js';
import axios from 'axios';

async function testAxiosFetch() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the report
    const reportSchema = new mongoose.Schema({}, { strict: false });
    const Report = mongoose.model('Report', reportSchema, 'reports');
    
    const report = await Report.findById('6970a49825f1a5bd7eed163d');
    
    if (!report) {
      console.log('❌ Report not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n=== Report Details ===');
    console.log('Name:', report.reportName);
    
    // Extract public ID from URL
    let publicId = report.cloudinaryPublicId;
    if (!publicId && report.fileUrl?.startsWith("https://res.cloudinary.com")) {
      const match = report.fileUrl.match(/\/upload\/v\d+\/(.+?)(?:\?|$)/);
      if (match && match[1]) {
        publicId = match[1];
      }
    }
    
    if (!publicId) {
      console.log('❌ Could not extract public ID');
      await mongoose.disconnect();
      return;
    }
    
    // Generate authenticated URL
    const authenticatedUrl = cloudinary.url(publicId, {
      resource_type: publicId.endsWith('.pdf') ? "raw" : "image"
    });
    
    console.log('\n=== Generated Authenticated URL ===');
    console.log(authenticatedUrl);
    
    // Try fetching with axios
    console.log('\n=== Testing Axios GET ===');
    try {
      const response = await axios.get(authenticatedUrl, {
        responseType: "arraybuffer",
        timeout: 10000,
        validateStatus: () => true  // Don't throw on any status code
      });
      
      console.log('Response Status:', response.status);
      console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
      
      if (response.status === 200) {
        console.log('✅ SUCCESS! File fetched');
        console.log('Content-Type:', response.headers["content-type"]);
        console.log('Content-Length:', response.data.byteLength, 'bytes');
        
        if (response.data.byteLength === 0) {
          console.log('⚠️  WARNING: File is empty!');
        } else {
          console.log('✅ File has content!');
        }
      } else {
        console.log('❌ ERROR Status:', response.status);
        console.log('Response Body:', response.data.toString().substring(0, 500));
      }
    } catch (err) {
      console.error('❌ Request Error:', err.message);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

testAxiosFetch();
