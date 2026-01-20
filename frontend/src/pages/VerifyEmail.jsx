import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { verificationAPI } from "../services/api";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import Navbar from "../components/Layout/Navbar";
import { toast } from "react-toastify";

const VerifyEmail = () => {
  const { token: tokenFromUrl } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  // 🔒 Prevent double API calls (React 18 StrictMode fix)
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const verify = async () => {
      let token = tokenFromUrl;

      // 🔁 Backward compatibility (old query-based links)
      if (!token) {
        token = searchParams.get("token");
        const email = searchParams.get("email");
        const role = searchParams.get("role");

        if (token && email && role) {
          try {
            const res = await verificationAPI.verifyEmail(token, email, role);
            if (res.data?.statusCode === 200 || res.data?.data?.verified) {
              setStatus("success");
              toast.success("Email verified successfully!");
              setTimeout(() => navigate("/login"), 2000);
              return;
            }
            throw new Error();
          } catch (err) {
            setStatus("error");
            setMessage(
              err.response?.data?.message ||
                "Verification failed. The link may have expired."
            );
            return;
          }
        }
      }

      // ❌ No token found
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      // ✅ New token-only verification
      try {
        const res = await verificationAPI.verifyEmailByToken(token);

        if (res.data?.statusCode === 200 || res.data?.data?.verified) {
          setStatus("success");
          toast.success("Your email has been verified!");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          throw new Error();
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "Invalid or expired verification token"
        );
      }
    };

    verify();
  }, [tokenFromUrl, searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="max-w-md w-full bg-white rounded-squircle shadow-soft-lg p-8 text-center">

          {status === "verifying" && (
            <>
              <Loader className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Email
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-600 mb-4">
                Your email has been verified. Redirecting to login...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => navigate("/login")}
                className="bg-primary-600 text-white px-6 py-2 rounded-xl hover:bg-primary-700 transition"
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
