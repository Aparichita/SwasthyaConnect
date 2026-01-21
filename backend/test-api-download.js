import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';
import https from 'https';

async function downloadViaApi() {
  return new Promise((resolve, reject) => {
    try {
      const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es';
      
      // Try downloading using cloudinary API endpoint directly
      const auth = Buffer.from(
        `${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`
      ).toString('base64');
      
      const url = new URL(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/resources/image/upload/${publicId}`
      );
      
      console.log('=== Attempting API download ===');
      console.log('URL:', url.toString());
      
      const req = https.get(url, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            console.log('\n✅ API Response:');
            console.log('Public ID:', json.public_id);
            console.log('Secure URL:', json.secure_url);
            console.log('Has format:', json.format);
            
            // Check if theres a download URL or anything useful
            console.log('\nAll keys:', Object.keys(json).join(', '));
            
            resolve(json);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
          }
        });
      });
      
      req.on('error', reject);
      
    } catch (err) {
      reject(err);
    }
  });
}

try {
  const result = await downloadViaApi();
} catch (err) {
  console.error('❌ Error:', err.message);
}
