import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';
import axios from 'axios';

async function testWithAuth() {
  try {
    const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es';
    
    console.log('=== Testing with different URL generation options ===\n');
    
    // Try 1: With type: 'authenticated'
    console.log('Option 1: type: "authenticated"');
    let url1 = cloudinary.url(publicId, {
      resource_type: "image",
      type: "authenticated"
    });
    console.log(url1);
    
    // Try 2: With sign_url
    console.log('\nOption 2: sign_url: true');
    let url2 = cloudinary.url(publicId, {
      resource_type: "image",
      sign_url: true,
      auth_token: true
    });
    console.log(url2);
    
    // Try 3: With custom auth token
    console.log('\nOption 3: custom auth token');
    const token = cloudinary.utils.compute_auth_token({
      public_id: publicId,
      resource_type: "image"
    });
    const url3 = `${cloudinary.url(publicId, { resource_type: "image" })}?__cld_token__=${token}`;
    console.log(url3);
    
    // Try fetching with option 3
    console.log('\n=== Testing fetch with auth token ===');
    const response = await axios.get(url3, {
      responseType: "arraybuffer",
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('Response Status:', response.status);
    if (response.status === 200) {
      console.log('✅ SUCCESS!');
      console.log('Content-Length:', response.data.byteLength);
    } else {
      console.log('❌ ERROR:', response.status, response.headers['x-cld-error']);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testWithAuth();
