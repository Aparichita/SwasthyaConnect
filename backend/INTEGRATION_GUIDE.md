# ABHA & Gamification Integration Guide

## ✅ What Has Been Integrated

### 1. ABHA Health ID Integration
- **Model**: `src/models/abha.model.js` - Stores ABHA credentials and consent
- **Controller**: `src/controllers/abha.controller.js` - Handles ABDM API calls
- **Routes**: `src/routes/abha.routes.js` - API endpoints for ABHA operations

**Features:**
- Generate ABHA Health ID
- Verify ABHA with OTP
- Share health records with doctors/hospitals
- Fetch health records from ABDM
- Consent management

### 2. Gamified Health Engagement
- **Model**: `src/models/gamification.model.js` - Points, levels, achievements, streaks
- **Controller**: `src/controllers/gamification.controller.js` - Reward system logic
- **Routes**: `src/routes/gamification.routes.js` - Gamification API endpoints
- **Helper**: `src/utils/gamification-helper.js` - Easy integration with existing controllers

**Features:**
- Points system for health activities
- Level progression
- Daily streaks tracking
- Achievements and badges
- Health goals
- Leaderboard
- Reward redemption

## 📋 API Endpoints

### ABHA Routes (`/api/abha`)

1. **Generate ABHA Health ID**
   ```
   POST /api/abha/generate
   Body: { name, gender, dateOfBirth, mobile, email, aadhaar }
   ```

2. **Verify ABHA**
   ```
   POST /api/abha/verify
   Body: { otp, transactionId }
   ```

3. **Get My ABHA**
   ```
   GET /api/abha/me
   ```

4. **Share Health Records**
   ```
   POST /api/abha/share-records
   Body: { doctorId, hospitalId, recordTypes, consentDuration }
   ```

5. **Fetch Health Records**
   ```
   GET /api/abha/fetch-records
   ```

### Gamification Routes (`/api/gamification`)

1. **Get My Profile**
   ```
   GET /api/gamification/me
   ```

2. **Award Points** (Internal/System)
   ```
   POST /api/gamification/award-points
   Body: { activityType, points }
   ```

3. **Log Activity**
   ```
   POST /api/gamification/log-activity
   Body: { activityType }
   ```

4. **Leaderboard**
   ```
   GET /api/gamification/leaderboard?limit=10
   ```

5. **Get Achievements**
   ```
   GET /api/gamification/achievements
   ```

6. **Create Health Goal**
   ```
   POST /api/gamification/goals
   Body: { goalType, target, deadline, pointsReward }
   ```

7. **Update Goal Progress**
   ```
   PUT /api/gamification/goals/:goalId
   Body: { currentProgress, status }
   ```

8. **Redeem Reward**
   ```
   POST /api/gamification/redeem
   Body: { rewardType, description, pointsRequired }
   ```

## 🔗 Integrating Gamification with Existing Controllers

To automatically award points when patients perform actions, add this to your controllers:

### Example: Award points when booking appointment

In `appointment.controller.js`:
```javascript
import { awardPointsForActivity } from "../utils/gamification-helper.js";

export const bookAppointment = asyncHandler(async (req, res) => {
  // ... existing appointment booking code ...
  
  // After successful booking, award points
  await awardPointsForActivity(req.user.id, "appointment_booking");
  
  // ... rest of code ...
});
```

### Example: Award points when uploading report

In `report.controller.js`:
```javascript
import { awardPointsForActivity } from "../utils/gamification-helper.js";

export const uploadReport = asyncHandler(async (req, res) => {
  // ... existing upload code ...
  
  // After successful upload, award points
  await awardPointsForActivity(req.user.id, "report_upload");
  
  // ... rest of code ...
});
```

### Available Activity Types:
- `daily_log` - 10 points
- `appointment_booking` - 25 points
- `report_upload` - 30 points
- `feedback_given` - 15 points
- `abha_linked` - 100 points

## 📝 .env File Setup

See `ENV_SETUP.md` for complete environment variable documentation.

**Required for ABHA:**
```env
ABDM_BASE_URL=https://dev.abdm.gov.in
ABDM_API_KEY=your-api-key
ABDM_HIU_ID=your-hiu-id
ABDM_CM_ID=your-cm-id
```

## 🚀 Testing the Integration

### Test ABHA Integration:

1. **Generate ABHA** (Patient must be logged in):
   ```bash
   POST http://localhost:5000/api/abha/generate
   Authorization: Bearer <patient-token>
   Body: {
     "name": "John Doe",
     "gender": "M",
     "dateOfBirth": "1990-01-01",
     "mobile": "9876543210",
     "email": "john@example.com"
   }
   ```

2. **Get ABHA Details**:
   ```bash
   GET http://localhost:5000/api/abha/me
   Authorization: Bearer <patient-token>
   ```

### Test Gamification:

1. **Get Gamification Profile**:
   ```bash
   GET http://localhost:5000/api/gamification/me
   Authorization: Bearer <patient-token>
   ```

2. **Log Activity**:
   ```bash
   POST http://localhost:5000/api/gamification/log-activity
   Authorization: Bearer <patient-token>
   Body: { "activityType": "daily_log" }
   ```

3. **View Leaderboard**:
   ```bash
   GET http://localhost:5000/api/gamification/leaderboard
   ```

## 📦 Next Steps

1. **Update .env file** with ABDM credentials (see ENV_SETUP.md)
2. **Integrate gamification** into existing controllers using `awardPointsForActivity()`
3. **Test ABHA flow** with real or mock credentials
4. **Customize points** in `gamification.controller.js` → `POINTS_CONFIG`
5. **Add reward types** in the gamification model and controller

## 🔒 Security Notes

- ABHA tokens are stored with `select: false` - not returned in queries by default
- All ABHA routes require patient authentication
- Consent management ensures patient control over data sharing
- Gamification points cannot be manually manipulated (only through activities)

## 📚 Resources

- [ABDM Developer Portal](https://sandbox.abdm.gov.in/)
- [ABDM API Documentation](https://docs.abdm.gov.in/)
- [National Digital Health Mission](https://ndhm.gov.in/)

