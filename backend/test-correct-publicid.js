import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';
import axios from 'axios';

async function testCorrectPublicId() {
  try {
    // The correct public ID (without extension)
    const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es';
    
    console.log('=== Testing with correct public ID ===');
    console.log('Public ID:', publicId);
    
    // Generate URL with image type
    const url = cloudinary.url(publicId, {
      resource_type: "image"
    });
    
    console.log('\n=== Generated URL ===');
    console.log(url);
    
    // Try to fetch
    console.log('\n=== Testing fetch ===');
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('Response Status:', response.status);
    if (response.status === 200) {
      console.log('✅ SUCCESS! File fetched');
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Content-Length:', response.data.byteLength);
    } else {
      console.log('❌ ERROR Status:', response.status);
      console.log('Error:', response.headers['x-cld-error']);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testCorrectPublicId();
