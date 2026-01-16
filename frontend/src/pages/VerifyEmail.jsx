// frontend/src/pages/VerifyEmail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { verificationAPI } from '../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
  // Support both URL param (/:token) and query param (?token=...) for backward compatibility
  const { token: tokenFromUrl } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      // Try URL param first (new format: /verify-email/:token)
      let token = tokenFromUrl;
      
      // Fallback to query param (old format: /verify-email?token=...&email=...&role=...)
      if (!token) {
        token = searchParams.get('token');
        const email = searchParams.get('email');
        const role = searchParams.get('role');
        
        // If using old format, use old API
        if (token && email && role) {
          try {
            const response = await verificationAPI.verifyEmail(token, email, role);
            if (response.data?.statusCode === 200 || response.data?.data?.verified) {
              setStatus('success');
              setMessage('Email verified successfully! You can now log in.');
              toast.success('Email verified successfully! You can now log in.');
              setTimeout(() => {
                navigate('/login');
              }, 3000);
            } else {
              throw new Error('Verification failed');
            }
          } catch (error) {
            setStatus('error');
            const errorMsg = error.response?.data?.message || 'Verification failed. The link may have expired.';
            setMessage(errorMsg);
            toast.error(errorMsg);
          }
          return;
        }
      }

      // New simplified format - token only
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email.');
        toast.error('Invalid verification link');
        return;
      }

      try {
        // Use new simplified API endpoint
        const response = await verificationAPI.verifyEmailByToken(token);
        if (response.data?.statusCode === 200 || response.data?.data?.verified) {
          setStatus('success');
          setMessage('Your account has been verified!');
          toast.success('Your account has been verified!');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          throw new Error('Verification failed');
        }
      } catch (error) {
        setStatus('error');
        const errorMsg = error.response?.data?.message || 'Invalid or expired token';
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    };

    verify();
  }, [tokenFromUrl, searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="max-w-md w-full bg-white rounded-squircle shadow-soft-lg p-8 border-0 text-center">
          {status === 'verifying' && (
            <>
              <Loader className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-4">Your email has been verified. You can now login.</p>
              <p className="text-sm text-gray-500">Redirecting to login page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 transition-colors"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

