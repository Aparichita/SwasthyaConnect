import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Appointments from './pages/Appointments';
import Reports from './pages/Reports';
import Feedback from './pages/Feedback';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Home from './pages/Home';
import VerifyEmail from './pages/VerifyEmail';
import DoctorMessages from './pages/DoctorMessages';
import PatientMessages from './pages/PatientMessages';
import DoctorMessagesList from './pages/DoctorMessagesList';
import PatientMessagesList from './pages/PatientMessagesList';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmailRequired from './pages/VerifyEmailRequired';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading, token } = useAuth();

  // Show loading only if we're still checking auth
  if (loading && !token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check authentication - use token from localStorage as fallback
  const hasToken = token || localStorage.getItem('token');
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  // If we have a token but user is still loading, wait a bit
  if (loading && hasToken && !user) {
    // Try to get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      // User exists in storage, allow access (will be set by AuthContext)
      return children;
    }
    // Otherwise show loading
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0) {
    const userRole = user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  // Check if user is verified (mandatory for protected routes)
  const isVerified = user?.isVerified === true || user?.isEmailVerified === true;
  if (!isVerified) {
    return <Navigate to="/verify-email-required" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'patient') {
      return <Navigate to="/patient/dashboard" replace />;
    } else if (user?.role === 'doctor') {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email/:token"
        element={<VerifyEmail />}
      />
      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email-required"
        element={<VerifyEmailRequired />}
      />

      {/* Patient Routes */}
      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Appointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/reports"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/feedback"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/notifications"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/messages"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientMessagesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/messages/:appointmentId"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientMessages />
          </ProtectedRoute>
        }
      />

      {/* Doctor Routes */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Appointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/reports"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/feedback"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/notifications"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/messages"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorMessagesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/messages/:appointmentId"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorMessages />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </AuthProvider>
  );
}

export default App;

