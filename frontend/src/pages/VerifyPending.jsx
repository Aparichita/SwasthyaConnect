import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { verificationAPI } from '../services/api';
import { Mail, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const VerifyPending = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    if (!user?.email || !user?.role) {
      toast.error('Unable to resend verification email. Please try logging in again.');
      return;
    }

    setResending(true);
    setResendSuccess(false);
    try {
      const response = await verificationAPI.resendVerification({
        email: user.email,
        role: user.role,
      });

      if (response.data?.statusCode === 200 || response.data?.message) {
        setResendSuccess(true);
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        throw new Error('Failed to resend email');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(errorMsg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="max-w-md w-full bg-white rounded-squircle shadow-soft-lg p-8 border-0 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification Required</h2>
          <p className="text-gray-600 mb-6">
            Please verify your email before accessing the dashboard.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800 font-medium mb-1">Check your inbox</p>
                <p className="text-xs text-blue-700">
                  A verification email has been sent to <strong>{user?.email || 'your email'}</strong>.
                  Please click the verification link in the email to activate your account.
                </p>
              </div>
            </div>
          </div>

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-green-800 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Verification email sent successfully!</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all shadow-soft hover:shadow-soft-lg"
            >
              {resending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>

            <Link
              to="/login"
              className="block text-gray-600 hover:text-primary-600 text-sm"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPending;

