import 'dotenv/config.js';
import mongoose from 'mongoose';
import axios from 'axios';

async function testWithDatabaseUrl() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const reportSchema = new mongoose.Schema({}, { strict: false });
    const Report = mongoose.model('Report', reportSchema, 'reports');
    
    const report = await Report.findById('6970a49825f1a5bd7eed163d');
    
    console.log('=== Database stored URL ===');
    console.log(report.fileUrl);
    
    // Extract version number from stored URL
    const versionMatch = report.fileUrl.match(/\/v(\d+)\//);
    const version = versionMatch ? versionMatch[1] : '1';
    
    // Extract public ID (without extension)
    const pubIdMatch = report.fileUrl.match(/\/v\d+\/(.+?)(?:\?|$)/);
    const pubIdWithExt = pubIdMatch ? pubIdMatch[1] : '';
    const pubId = pubIdWithExt.replace(/\.\w+$/, ''); // Remove extension
    
    console.log('\n=== Extracted info ===');
    console.log('Public ID:', pubId);
    console.log('Version:', version);
    
    // Try the stored URL as-is first
    console.log('\n=== Testing stored URL directly ===');
    let response = await axios.get(report.fileUrl, {
      responseType: "arraybuffer",
      timeout: 5000,
      validateStatus: () => true
    });
    console.log('Status:', response.status, response.headers['x-cld-error']);
    
    // Now check if files in this folder have any special access settings
    console.log('\n=== Checking folder resources ===');
    const cloudinary = (await import('./src/config/cloudinary.js')).default;
    const folderResources = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: 'swasthya-connect/reports/',
      max_results: 5
    });
    
    if (folderResources.resources.length > 0) {
      const sample = folderResources.resources[0];
      console.log('Sample resource:');
      console.log('  Public ID:', sample.public_id);
      console.log('  Access Control:', sample.access_control || 'none');
      console.log('  Type:', sample.type);
      console.log('  Format:', sample.format);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testWithDatabaseUrl();
