import 'dotenv/config.js';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';

async function testWithAuth() {
  try {
    const fileUrl = 'https://res.cloudinary.com/dhvs7hsuh/image/upload/v1768989846/swasthya-connect/reports/nkipei5cltotuqiqb0es.pdf';
    
    // Try with API key auth in header
    console.log('=== Test 1: X-Cld-Request-Id header ===');
    let response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        'X-Cld-Request-Id': 'internal-api'
      }
    });
    console.log('Status:', response.status, response.headers['x-cld-error']);
    
    // Try with Authorization header
    console.log('\n=== Test 2: Authorization header ===');
    const auth = Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64');
    response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    console.log('Status:', response.status, response.headers['x-cld-error']);
    
    // Try with custom User-Agent
    console.log('\n=== Test 3: CloudinaryNodeJS User-Agent ===');
    response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'CloudinaryNodeJS/2.9.0'
      }
    });
    console.log('Status:', response.status, response.headers['x-cld-error']);
    
    // Try accessing via /secure endpoint
    console.log('\n=== Test 4: Modify URL to /authenticated ===');
    const authUrl = fileUrl.replace('/upload/', '/authenticated/');
    response = await axios.get(authUrl, {
      responseType: "arraybuffer",
      timeout: 5000,
      validateStatus: () => true
    });
    console.log('Status:', response.status, response.headers['x-cld-error']);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testWithAuth();
