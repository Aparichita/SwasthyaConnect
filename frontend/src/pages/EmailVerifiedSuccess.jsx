// frontend/src/pages/EmailVerifiedSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';

const EmailVerifiedSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="max-w-md w-full bg-white rounded-squircle shadow-soft-lg p-8 border-0 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600 mb-4">
            Your email has been verified successfully. You can now log in to your account.
          </p>
          <p className="text-sm text-gray-500">Redirecting to login page in 3 seconds...</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerifiedSuccess;