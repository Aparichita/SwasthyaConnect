# SwasthyaConnect Frontend

Smart Healthcare Platform Frontend built with React and Vite.

## Features

- ✅ Patient Dashboard
- ✅ Doctor Dashboard
- ✅ Appointment Management
- ✅ Reports Management
- ✅ Feedback System
- ✅ Notifications
- ✅ Profile Management
- ✅ Authentication (Login/Register)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Tech Stack

- React 18
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- React Toastify
- Lucide React Icons

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── context/        # React Context (Auth)
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static files
└── package.json
```

## Backend Integration

The frontend is fully integrated with the backend API:
- All routes are configured
- Authentication is handled via JWT tokens
- API calls use axios interceptors
- Error handling is implemented

## Available Routes

- `/` - Home page
- `/login` - Login page
- `/register` - Register page
- `/patient/dashboard` - Patient dashboard
- `/patient/appointments` - Patient appointments
- `/patient/reports` - Patient reports
- `/patient/feedback` - Patient feedback
- `/patient/notifications` - Patient notifications
- `/patient/profile` - Patient profile
- `/doctor/dashboard` - Doctor dashboard
- `/doctor/appointments` - Doctor appointments
- `/doctor/reports` - Doctor reports
- `/doctor/feedback` - Doctor feedback
- `/doctor/notifications` - Doctor notifications
- `/doctor/profile` - Doctor profile

