import 'dotenv/config.js';
import mongoose from 'mongoose';
import axios from 'axios';

async function testStoredUrl() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const reportSchema = new mongoose.Schema({}, { strict: false });
    const Report = mongoose.model('Report', reportSchema, 'reports');
    
    const report = await Report.findById('6970a49825f1a5bd7eed163d');
    
    if (!report) {
      console.log('❌ Report not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('=== Stored URL ===');
    console.log(report.fileUrl);
    
    // Try to fetch the stored URL
    console.log('\n=== Testing fetch of stored URL ===');
    const response = await axios.get(report.fileUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('Response Status:', response.status);
    if (response.status === 200) {
      console.log('✅ SUCCESS! Stored URL works');
      console.log('Content-Length:', response.data.byteLength);
    } else {
      console.log('❌ ERROR Status:', response.status);
      console.log('Error:', response.headers['x-cld-error']);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    await mongoose.disconnect();
  }
}

testStoredUrl();
