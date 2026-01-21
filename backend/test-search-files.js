import 'dotenv/config.js';
import cloudinary from './src/config/cloudinary.js';

async function searchForFile() {
  try {
    const fileName = 'nkipei5cltotuqiqb0es';
    
    console.log('=== Searching for file across resource types ===\n');
    
    // Try different resource types
    const resourceTypes = ['image', 'raw', 'video', 'auto'];
    
    for (const type of resourceTypes) {
      try {
        console.log(`Checking ${type} resources...`);
        const resources = await cloudinary.api.resources({
          type: 'upload',
          resource_type: type,
          prefix: 'swasthya-connect/reports/',
          max_results: 100
        });
        
        const matching = resources.resources.filter(r => 
          r.public_id.includes(fileName)
        );
        
        if (matching.length > 0) {
          console.log(`✅ Found in ${type}!`);
          matching.forEach(r => {
            console.log(`  - ${r.public_id}`);
            console.log(`    Type: ${r.type}, Resource Type: ${r.resource_type}, Format: ${r.format}`);
          });
        } else {
          console.log(`  (not found)`);
        }
      } catch (err) {
        console.log(`  Error: ${err.error?.message || err.message}`);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

searchForFile();
