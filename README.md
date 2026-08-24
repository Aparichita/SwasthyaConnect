# SwasthyaConnect

SwasthyaConnect is a React and Express application for chronic-care workflows between patients and doctors. Patients can manage their profile, appointments, reports, feedback, notifications, health activities, and conversations with doctors. Doctors can manage appointments, patient reports, feedback, and conversations.

## Live Links

- Live app: `https://swasthya-connect-two.vercel.app/`
- API: `https://swasthyaconnect.onrender.com`

## Demo Credentials

```text
Patient: demo.patient@swasthyaconnect.com / SwasthyaDemo123!
Doctor:  demo.doctor@swasthyaconnect.com / SwasthyaDemo123!
```

The backend runs on a Render free tier. After about 15 minutes without traffic, the first request can take roughly 30 seconds while the service wakes up.

## Features

### Patient

- Register, log in, verify email, and reset a forgotten password.
- View and update a profile.
- Browse doctors and filter suggestions by specialization.
- Book, view, and cancel appointments.
- Upload, view, download, and delete medical reports.
- View stored AI analysis results.
- Submit and delete feedback for doctors.
- View, mark as read, and delete notifications.
- View points, achievements, goals, streaks, leaderboard data, and rewards.
- View appointment conversations and send messages to doctors after confirmation.
- Use WhatsApp appointment or report notifications when Twilio is configured.

### Doctor

- Register and log in with professional details.
- View and update a profile.
- View patient lists and assigned appointments.
- Update appointment status.
- View patient reports and upload prescriptions or notes.
- View patient feedback.
- View appointment conversations and send messages to patients after confirmation.
- Send individual, bulk, and upcoming-appointment WhatsApp reminders when Twilio is configured.

## Tech Stack

### Frontend

- React `^18.2.0`
- Vite `^5.0.8`
- React Router `^6.20.0`
- Axios `^1.6.2`
- Socket.IO client `^4.8.3`
- Tailwind CSS `^3.3.6`
- React Toastify `^9.1.3`
- Lucide React `^0.294.0`
- date-fns `^2.30.0`

### Backend

- Node.js with Express `^5.1.0`
- MongoDB with Mongoose `^8.19.3`
- JWT `^9.0.2`
- Socket.IO `^4.8.3`
- Cloudinary `^2.9.0`
- Nodemailer `^7.0.10`
- Multer `^2.0.2`
- PDFKit `^0.17.2`
- Twilio `^5.10.4`
- bcrypt `^6.0.0` and bcryptjs `^3.0.3`
- dotenv `^17.2.3`

## Architecture

```text
React/Vite frontend
        |
        | Axios REST API + Socket.IO
        v
Express backend ---- MongoDB/Mongoose
        |
        +---- Cloudinary for report files
        +---- SMTP/Nodemailer for email
        +---- Twilio for WhatsApp
        +---- External AI prediction URL
```

The frontend uses Axios with `VITE_API_URL`. It stores the JWT and user in `localStorage`, and adds `Authorization: Bearer <token>` to API requests. Protected frontend routes require a token and a verified user.

Patient and doctor records use separate MongoDB collections. JWTs contain the user ID and role. Role middleware protects role-specific endpoints. Socket.IO authenticates connections with the JWT and supports conversation rooms, typing indicators, read receipts, and notifications.

Reports are uploaded through Multer, sent to Cloudinary, and served through report view/download endpoints. Legacy local report files and local message attachments are also supported. Generated patient PDFs are written under `backend/uploads/generated`.

The AI controller accepts symptoms, report text, and location and stores results in MongoDB. Its current prediction target is the literal placeholder URL `https://example-ai-api.com/predict`; `AI_API_BASE_URL` is not used by that controller.

## Running Locally

### 1. Install dependencies

```powershell
git clone <repository-url>
cd SwasthyaConnect1
cd backend
npm install
cd ..\frontend
npm install
```

### 2. Configure the backend

Create `backend/.env`:

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<long-random-secret>
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=<smtp-user>
EMAIL_PASS=<smtp-app-password>

TWILIO_ACCOUNT_SID=<twilio-account-sid>
TWILIO_AUTH_TOKEN=<twilio-auth-token>
TWILIO_WHATSAPP_NUMBER=<twilio-whatsapp-sender>
```

The backend runtime reads these variables:

| Variable | Used for |
| --- | --- |
| `PORT` | HTTP port. Defaults to `5000`. |
| `NODE_ENV` | Production auto-verification and environment behavior. |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | JWT signing. |
| `FRONTEND_URL` | Verification/reset links and Socket.IO CORS. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud. |
| `CLOUDINARY_API_KEY` | Cloudinary authentication. |
| `CLOUDINARY_API_SECRET` | Cloudinary authentication. |
| `EMAIL_HOST` | SMTP host. Defaults to Gmail SMTP in the mail utility. |
| `EMAIL_PORT` | SMTP port. Defaults to `465`. |
| `EMAIL_USER` | SMTP username and sender. |
| `EMAIL_PASS` | SMTP password or app password. |
| `MAIL_HOST` | Alternate SMTP host accepted by one mail utility. |
| `MAIL_PORT` | Alternate SMTP port accepted by one mail utility. |
| `MAIL_USER` | Alternate SMTP username accepted by one mail utility. |
| `MAIL_PASS` | Alternate SMTP password accepted by one mail utility. |
| `TWILIO_ACCOUNT_SID` | Twilio account. |
| `TWILIO_AUTH_TOKEN` | Twilio authentication. |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp sender. |

`MAIL_*` variables are alternate names supported by `backend/src/utils/mail.js`. The notification email utility uses `EMAIL_USER` and `EMAIL_PASS`.

### 3. Configure the frontend

Create `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

`VITE_API_URL` is the Axios API base URL and the base used for Socket.IO connections.

### 4. Seed the database

Run this from the backend directory:

```powershell
cd backend
npm run seed
```

### 5. Start both applications

Backend:

```powershell
cd backend
npm run dev
```

Frontend, in a second terminal:

```powershell
cd frontend
npm run dev
```

The local frontend normally runs at `http://localhost:5173`. The backend health endpoints are `http://localhost:5000/health` and `http://localhost:5000/api/health`.

Do not commit `.env` files. They contain credentials and connection strings.

## Seeding

`npm run seed` runs `backend/src/db/seedData.js`. It clears the existing demo collections first, then creates:

- 4 patients and 5 doctors.
- 8 appointments.
- 4 feedback entries.
- 8 notifications.
- 4 gamification profiles.
- 6 reports.
- 4 AI result records.
- 3 ABHA records.
- 4 conversations and 8 messages.
- Matching `User` records used by notification references.

The script uses the model save hooks, so demo passwords are hashed before storage. It prints the demo credentials at the end and closes the MongoDB connection. The script is destructive: it is safe for an empty demo database, but it deletes existing records from these collections before inserting seed data.

To seed a deployed database from PowerShell:

```powershell
cd backend
$env:MONGO_URI="<deployed-mongodb-connection-string>"
npm run seed
```

A successful run prints `Seed data created successfully.` followed by the record counts and the patient and doctor credentials.

## Project Structure

```text
backend/
  src/
    config/       Cloudinary configuration.
    controllers/  Request handlers for auth, appointments, reports, chat, and other features.
    db/           MongoDB connection and seed script.
    middlewares/  Auth, role, upload, validation, and error middleware.
    models/      Mongoose schemas.
    routes/      Express route definitions.
    services/    Backend service helpers.
    socket/      Socket.IO authentication and event handling.
    utils/       JWT, email, API response/error, and other helpers.
  uploads/       Temporary, message, report, and generated PDF files.

frontend/
  src/
    components/  Shared layout, navigation, chat, and UI components.
    context/     Auth context and application state providers.
    hooks/       Shared React hooks.
    pages/       Patient, doctor, auth, report, appointment, chat, and notification screens.
    services/    Axios API definitions.
    utils/       Frontend utilities, including Socket.IO setup.
  public/        Static frontend assets.
```

## Main API Areas

The backend mounts these route groups:

- `/api/auth`: registration, login, current user, verification, and password reset.
- `/api/patients` and `/api/doctors`: role profiles, lists, and lookups.
- `/api/appointments`: booking, listing, status changes, and cancellation.
- `/api/reports`: multipart upload, listing, viewing, downloading, and deletion.
- `/api/feedback`: create, list, and delete feedback.
- `/api/notifications`: notification CRUD, email tests, and WhatsApp reminders.
- `/api/gamification`: points, activities, achievements, leaderboard, goals, and rewards.
- `/api/messages`: conversations, message history, and message sending.
- `/api/mail` and `/api/whatsapp`: email and WhatsApp operations.
- `/api/ai`: AI analysis and stored result lookup.

## Known Limitations

- Render free-tier cold starts can make the first request after idle take about 30 seconds.
- Seeded report records use placeholder `example.com` URLs. They appear in report lists but do not provide real downloadable files.
- The AI prediction controller calls `https://example-ai-api.com/predict`, which is a placeholder service. `PredictDisease.jsx` also calls an API method that is not defined in the current frontend API service, so that page is not a reliable working flow.
- The gamification page is marked as under construction. Some frontend gamification paths do not match the backend route or field names.
- `reportAPI.generatePDF()` targets a route that is not mounted in the current backend routes.
- ABHA/ABDM has a model but no active mounted ABHA route in the application.
- Appointment chat requires a confirmed appointment. REST messages are persisted; Socket.IO broadcasts live events.
- WhatsApp requires valid Twilio credentials and the required sandbox or recipient setup.
- SMTP, Cloudinary, Twilio, and the external AI service are optional integrations and can fail independently of the main API.
- The backend can start even when MongoDB is unavailable; database-backed requests then fail.
- `/api/test-mail` is an unauthenticated test endpoint and should not be exposed in production.
