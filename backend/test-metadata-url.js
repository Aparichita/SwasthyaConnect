import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';
import axios from 'axios';

async function testMetadataUrl() {
  try {
    const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es';
    
    console.log('=== Get secure_url from metadata ===\n');
    
    // Get the resource metadata
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: 'image'
    });
    
    console.log('Secure URL from API:', resource.secure_url);
    
    // Try to fetch it
    console.log('\n=== Testing fetch ===');
    const response = await axios.get(resource.secure_url, {
      responseType: "arraybuffer",
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('Response Status:', response.status);
    if (response.status === 200) {
      console.log('✅ SUCCESS!');
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Content-Length:', response.data.byteLength);
    } else {
      console.log('❌ ERROR Status:', response.status);
      console.log('Error:', response.headers['x-cld-error']);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.error?.message || err.message);
  }
}

testMetadataUrl();
