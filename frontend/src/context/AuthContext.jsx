import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, patientAPI, doctorAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Define fetchCurrentUser before useEffect
  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Don't logout if we have user data in localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        // Only logout if we have no stored user data
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if user is already in localStorage (from login/register)
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);
          setLoading(false);
          // Optionally fetch fresh data in background (non-blocking)
          fetchCurrentUser().catch(() => {
            // If fetch fails, keep using stored user data
            console.warn('Could not fetch fresh user data, using stored data');
          });
          return;
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }

      // If no stored user but we have a token, try to fetch from API
      if (storedToken && !storedUser) {
        await fetchCurrentUser();
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  const login = async (email, password, role) => {
    try {
      let response;
      if (role === 'patient') {
        response = await patientAPI.login({ email, password });
      } else if (role === 'doctor') {
        response = await doctorAPI.login({ email, password });
      } else {
        response = await authAPI.login({ email, password, role });
      }

      console.log('📥 Login API Response:', JSON.stringify(response.data, null, 2));

      // Handle ApiResponse format: { statusCode, data: { patient/doctor, token }, message }
      // Backend returns: res.json(new ApiResponse(201, { patient: {...}, token }, "message"))
      // Axios wraps it: response.data = { statusCode: 201, data: { patient: {...}, token }, message: "..." }
      
      let token, userData;
      const responseData = response.data;
      
      // Check for ApiResponse format (backend uses this)
      // Format: { statusCode, data: { patient/doctor, token }, message }
      if (responseData.data && typeof responseData.data === 'object' && responseData.data !== null) {
        const data = responseData.data;
        token = data.token;
        userData = data.patient || data.doctor || data.user;
        console.log('✅ Found ApiResponse format - Extracted token:', !!token, 'userData:', !!userData);
      } 
      // Check for direct token format (fallback)
      else if (responseData.token) {
        token = responseData.token;
        userData = responseData.patient || responseData.doctor || responseData.user;
        console.log('✅ Found direct token format');
      }
      // Check for success format (fallback)
      else if (responseData.success && responseData.data) {
        token = responseData.data.token || responseData.token;
        userData = responseData.data.patient || responseData.data.doctor || responseData.data.user || responseData.data;
        console.log('✅ Found success format');
      }

      if (!token || !userData) {
        console.error('❌ Invalid response format:', responseData);
        console.error('   Response structure:', Object.keys(responseData));
        throw new Error('Invalid response format - missing token or user data');
      }

      // Ensure role is set on userData
      if (!userData.role) {
        // Try to infer role from the response structure
        if (response.data.data?.data?.patient || response.data.patient) {
          userData.role = 'patient';
        } else if (response.data.data?.data?.doctor || response.data.doctor) {
          userData.role = 'doctor';
        } else if (role) {
          userData.role = role;
        }
      }

      // Set token and user immediately
      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set loading to false so dashboard can render
      setLoading(false);

      console.log('✅ Login successful - User:', userData);
      console.log('✅ Token stored, redirecting to dashboard...');
      
      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (data, role) => {
    try {
      let response;
      if (role === 'patient') {
        response = await patientAPI.register(data);
      } else if (role === 'doctor') {
        response = await doctorAPI.register(data);
      } else {
        response = await authAPI.register({ ...data, role });
      }

      console.log('📥 Registration API Response:', JSON.stringify(response.data, null, 2));

      // Handle ApiResponse format: { statusCode, data: { patient/doctor, token }, message }
      // Backend returns: res.json(new ApiResponse(201, { patient: {...}, token }, "message"))
      // Axios wraps it: response.data = { statusCode: 201, data: { patient: {...}, token }, message: "..." }
      
      let token, userData;
      const responseData = response.data;
      
      // Check for ApiResponse format (backend uses this)
      // Format: { statusCode, data: { patient/doctor, token }, message }
      if (responseData.data && typeof responseData.data === 'object' && responseData.data !== null) {
        const data = responseData.data;
        token = data.token;
        userData = data.patient || data.doctor || data.user;
        console.log('✅ Found ApiResponse format - Extracted token:', !!token, 'userData:', !!userData);
      } 
      // Check for direct token format (fallback)
      else if (responseData.token) {
        token = responseData.token;
        userData = responseData.patient || responseData.doctor || responseData.user;
        console.log('✅ Found direct token format');
      }
      // Check for success format (fallback)
      else if (responseData.success && responseData.data) {
        token = responseData.data.token || responseData.token;
        userData = responseData.data.patient || responseData.data.doctor || responseData.data.user || responseData.data;
        console.log('✅ Found success format');
      }

      if (!token || !userData) {
        console.error('❌ Invalid response format:', responseData);
        console.error('   Response structure:', Object.keys(responseData));
        throw new Error('Invalid response format - missing token or user data');
      }

      // Ensure role is set on userData
      if (!userData.role) {
        // Try to infer role from the response structure
        if (response.data.data?.patient || response.data.patient) {
          userData.role = 'patient';
        } else if (response.data.data?.doctor || response.data.doctor) {
          userData.role = 'doctor';
        } else if (role) {
          userData.role = role;
        }
      }

      // Set token and user immediately
      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set loading to false so dashboard can render
      setLoading(false);

      console.log('✅ Registration successful - User:', userData);
      console.log('✅ Token stored, redirecting to dashboard...');
      
      toast.success('Registration successful!');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('Logged out successfully');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isPatient: user?.role === 'patient',
    isDoctor: user?.role === 'doctor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

