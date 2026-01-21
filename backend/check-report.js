import 'dotenv/config.js';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkReport() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const report = await db.collection('reports').findOne({ 
      _id: new mongoose.Types.ObjectId('6970a49825f1a5bd7eed163d') 
    });
    
    if (!report) {
      console.log('Report not found');
      process.exit(1);
    }
    
    console.log('=== Report Document ===');
    console.log(JSON.stringify(report, null, 2));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkReport();
