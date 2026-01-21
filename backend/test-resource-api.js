import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';

async function checkResource() {
  try {
    const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es.pdf';
    
    console.log('=== Checking resource via Cloudinary API ===');
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: 'image'
    });
    
    console.log('✅ Resource found');
    console.log('Type:', resource.type);
    console.log('Resource Type:', resource.resource_type);
    console.log('Format:', resource.format);
    console.log('Access Control:', JSON.stringify(resource.access_control, null, 2));
    console.log('Secure:', resource.secure_url);
    console.log('URL:', resource.url);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
  }
}

checkResource();
