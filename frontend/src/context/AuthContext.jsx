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

  // ---------------- FETCH CURRENT USER ----------------
  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
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
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          setLoading(false);
          fetchCurrentUser().catch(() =>
            console.warn('Using cached user data')
          );
          return;
        } catch {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }

      if (storedToken && !storedUser) {
        await fetchCurrentUser();
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ---------------- LOGIN ----------------
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

      const responseData = response.data;
      const data = responseData.data;

      const token = data?.token;
      const userData = data?.patient || data?.doctor || data?.user;

      if (!token || !userData) {
        throw new Error('Invalid login response');
      }

      if (!userData.role) userData.role = role;

      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setLoading(false);

      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // ---------------- REGISTER (NO TOASTS HERE) ----------------
  const register = async (data, role) => {
    try {
      console.log('📤 Registering:', data.email, role);

      const response = await authAPI.register({ ...data, role });
      const responseData = response.data;

      if (responseData.statusCode === 201) {
        return {
          success: true,
          message: responseData.message,
          requiresVerification: true,
        };
      }

      throw new Error('Registration failed');
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, error: message };
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('Logged out successfully');
  };

  const isVerified =
    user?.isVerified === true || user?.isEmailVerified === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
        isPatient: user?.role === 'patient',
        isDoctor: user?.role === 'doctor',
        isVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
