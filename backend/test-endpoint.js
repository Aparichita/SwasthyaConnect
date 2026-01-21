import axios from 'axios';
import 'dotenv/config.js';

async function testViewEndpoint() {
  try {
    const reportId = '6970a49825f1a5bd7eed163d';
    
    // For testing, we'll use a test token (in real scenario, user needs to be logged in)
    // The endpoint is protected by auth middleware, so this will likely fail
    // But we can see if it reaches our code
    
    const url = `http://localhost:5000/api/reports/${reportId}/view`;
    console.log('Testing:', url);
    
    // Make request without auth (will fail auth check)
    try {
      const response = await axios.get(url, {
        responseType: 'blob',
        validateStatus: () => true,
        timeout: 10000
      });
      
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      
      if (response.status === 200) {
        console.log('✅ SUCCESS! File served');
        console.log('Size:', response.data.size);
      } else {
        console.log('Response:', response.data);
      }
    } catch (err) {
      console.error('Request error:', err.message);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Wait for server to start
setTimeout(testViewEndpoint, 2000);
