# Environment Variables Setup

## Required Environment Variables

Add these to your `.env` file in the `backend` directory:

### Database
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Server
```env
PORT=5000
NODE_ENV=development
```

### JWT Authentication
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### ABDM (ABHA Health ID Integration)

**For Production (Real ABDM Integration):**
```env
# ABDM Base URL (Sandbox/Production)
ABDM_BASE_URL=https://dev.abdm.gov.in
# OR for production: https://abdm.gov.in

# ABDM API Key (Get from ABDM portal after registration)
ABDM_API_KEY=your-abdm-api-key-here

# Health Information User ID (HIU ID) - Your registered HIU ID
ABDM_HIU_ID=your-hiu-id-here

# Consent Manager ID (CM ID) - Your registered CM ID
ABDM_CM_ID=your-cm-id-here
```

**For Development/Testing (Mock Mode):**
If you don't have ABDM credentials yet, the system will work in mock mode:
```env
ABDM_BASE_URL=https://dev.abdm.gov.in
ABDM_API_KEY=mock-key-for-development
ABDM_HIU_ID=mock-hiu-id
ABDM_CM_ID=mock-cm-id
```

**How to Get ABDM Credentials:**
1. Register at [ABDM Developer Portal](https://sandbox.abdm.gov.in/)
2. Create a Health Information User (HIU) application
3. Get your API keys and IDs from the dashboard
4. For production, register at the official ABDM portal

### Email (Optional - for notifications)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### AQI API (Optional - for health reports)
```env
AQI_API_KEY=your-aqi-api-key
```

## Example .env File

```env
# Database
MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/swasthyaconnect?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=my-super-secret-jwt-key-12345

# ABDM (ABHA Integration)
ABDM_BASE_URL=https://dev.abdm.gov.in
ABDM_API_KEY=your-abdm-api-key
ABDM_HIU_ID=your-hiu-id
ABDM_CM_ID=your-cm-id

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AQI (Optional)
AQI_API_KEY=your-aqi-api-key
```

## Important Notes

1. **Never commit `.env` file to Git** - Add it to `.gitignore`
2. **Use different keys for development and production**
3. **ABDM credentials are required for real ABHA integration**
4. **For testing, you can use mock values but real ABHA features won't work**

