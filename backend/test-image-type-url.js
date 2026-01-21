import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';
import axios from 'axios';

async function testImageTypeUrl() {
  // The public ID from the stored URL
  const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es.pdf';
  
  // Generate URL with image type (what Cloudinary used when storing)
  const imageTypeUrl = cloudinary.url(publicId, {
    resource_type: "image"
  });
  
  console.log('=== Generated URL with resource_type: image ===');
  console.log(imageTypeUrl);
  
  // Try to fetch
  console.log('\n=== Testing fetch ===');
  try {
    const response = await axios.get(imageTypeUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('Response Status:', response.status);
    if (response.status === 200) {
      console.log('✅ SUCCESS! File fetched');
      console.log('Content-Length:', response.data.byteLength);
    } else {
      console.log('❌ ERROR Status:', response.status);
      console.log('Error:', response.headers['x-cld-error']);
    }
  } catch (err) {
    console.error('❌ Request Error:', err.message);
  }
}

testImageTypeUrl();
