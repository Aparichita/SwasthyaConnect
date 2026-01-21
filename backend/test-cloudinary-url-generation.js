import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';

// Test what cloudinary.url() actually generates
const publicId = 'swasthya-connect/reports/nkipei5cltotuqiqb0es.pdf';

const url1 = cloudinary.url(publicId, {
  resource_type: "auto"
});

const url2 = cloudinary.url(publicId, {
  resource_type: "raw"
});

const url3 = cloudinary.url(publicId);

console.log('URL with resource_type: auto');
console.log(url1);
console.log('\nURL with resource_type: raw');
console.log(url2);
console.log('\nURL with default options');
console.log(url3);
