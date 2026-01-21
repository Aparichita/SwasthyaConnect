import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';
import axios from 'axios';

async function testTransformationUrls() {
  const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es';
  
  const tests = [
    {
      name: 'with fetch_format=auto',
      params: { resource_type: "image", fetch_format: "auto" }
    },
    {
      name: 'with width and fetch',
      params: { resource_type: "image", width: 1000, fetch_format: "auto" }
    },
    {
      name: 'with dpr_auto',
      params: { resource_type: "image", dpr: "auto" }
    },
    {
      name: 'with default image transformation',
      params: { resource_type: "image", quality: "auto" }
    }
  ];
  
  for (const test of tests) {
    try {
      const url = cloudinary.url(publicId, test.params);
      console.log(`\n=== ${test.name} ===`);
      console.log('URL:', url.substring(0, 120) + '...');
      
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 3000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        console.log(`✅ SUCCESS (${response.data.byteLength} bytes)`);
      } else {
        console.log(`❌ Status ${response.status}`);
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }
}

testTransformationUrls();
