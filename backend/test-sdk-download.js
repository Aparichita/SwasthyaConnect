import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';
import fs from 'fs';

async function testSdkDownload() {
  try {
    const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es';
    
    console.log('=== Using Cloudinary SDK to access file ===\n');
    
    // Option 1: Use cloudinary.api.resource to get metadata
    console.log('Option 1: Get resource metadata');
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: 'image'
    });
    
    console.log('✅ Resource found!');
    console.log('Secure URL:', resource.secure_url);
    console.log('URL:', resource.url);
    
    // Option 2: Use cloudinary.api.download() if it exists
    console.log('\nChecking available methods...');
    const methods = Object.keys(cloudinary.api).sort();
    const downloadMethods = methods.filter(m => 
      m.toLowerCase().includes('download') || 
      m.toLowerCase().includes('file') ||
      m.toLowerCase().includes('blob')
    );
    console.log('Related methods:', downloadMethods);
    
  } catch (err) {
    console.error('❌ Error:', err.error?.message || err.message);
  }
}

testSdkDownload();
