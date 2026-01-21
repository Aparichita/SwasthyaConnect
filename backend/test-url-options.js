import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';
import axios from 'axios';

async function testUrlOptions() {
  try {
    const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es';
    
    const options = [
      {
        name: 'authenticated type',
        params: { resource_type: "image", type: "authenticated" }
      },
      {
        name: 'sign_url',
        params: { resource_type: "image", sign_url: true, auth_token: true }
      }
    ];
    
    for (const opt of options) {
      console.log(`\n=== Testing: ${opt.name} ===`);
      const url = cloudinary.url(publicId, opt.params);
      console.log('URL:', url.substring(0, 100) + '...');
      
      try {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 5000,
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          console.log(`✅ SUCCESS! (${response.data.byteLength} bytes)`);
        } else {
          console.log(`❌ Status ${response.status}: ${response.headers['x-cld-error']}`);
        }
      } catch (err) {
        console.log(`❌ Request error: ${err.message}`);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testUrlOptions();
