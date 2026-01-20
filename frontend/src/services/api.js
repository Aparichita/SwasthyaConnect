import axios from 'axios';

// -------------------- Backend URL --------------------
// Read from .env file: VITE_API_URL=http://localhost:5000/api
// If .env doesn't exist, defaults to http://localhost:5000/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Debug: Log API URL (remove in production)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_URL);
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 8 second timeout (reduced for faster error feedback)
});

// -------------------- Add token to requests --------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------- Handle response errors --------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Network Error:', {
        message: 'Cannot connect to backend server',
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        suggestion: 'Make sure backend is running on http://localhost:5000',
      });
    }

    if (error.code === 'ERR_CORS') {
      console.error('CORS Error:', {
        message: 'CORS policy blocked the request',
        suggestion: 'Check backend CORS configuration',
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// -------------------- API Definitions --------------------

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Patient
export const patientAPI = {
  register: (data) => api.post('/patients/register', data),
  login: (data) => api.post('/patients/login', data),
  getProfile: () => api.get('/patients/me'),
  updateProfile: (data) => api.put('/patients/me', data),
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
};

// Doctor
export const doctorAPI = {
  register: (data) => api.post('/doctors/register', data),
  login: (data) => api.post('/doctors/login', data),
  getProfile: () => api.get('/doctors/me'),
  updateProfile: (data) => api.put('/doctors/me', data),
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  getBySpecialization: (specialization, limit = 5, sortBy = 'rating') => 
    api.get(`/doctors/specialization/${encodeURIComponent(specialization)}?limit=${limit}&sortBy=${sortBy}`),
  getSuggestedDoctors: (specialization, limit = 5) => 
    api.get(`/doctors/suggest/${encodeURIComponent(specialization)}?limit=${limit}&sortBy=rating`),
};

// Appointment
export const appointmentAPI = {
  book: (data) => api.post('/appointments', data),
  getMyAppointments: () => api.get('/appointments/my'),

  // ✅ REQUIRED FOR DOCTOR CHAT
  getDoctorAppointments: () => api.get('/appointments/doctor'),

  updateStatus: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};


// Report
export const reportAPI = {
  upload: (formData) =>
    api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyReports: () => api.get('/reports/my'),
  getByPatient: (patientId) => api.get(`/reports/patient/${patientId}`),
  getById: (id) => api.get(`/reports/${id}`),
  downloadReport: (id) => api.get(`/reports/${id}/download`, { responseType: 'blob' }),
  viewReport: (id) => api.get(`/reports/${id}/view`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/reports/${id}`),
  generatePDF: () => api.post('/reports/generate', {}, { responseType: 'blob' }),
};

// Feedback
export const feedbackAPI = {
  add: (data) => api.post('/feedback', data),
  getAll: () => api.get('/feedback'),
  getForDoctor: (doctorId) => api.get(`/feedback/${doctorId}`),
  getMyFeedback: () => api.get('/feedback/my/feedbacks'),
  delete: (id) => api.delete(`/feedback/${id}`),
};

// Notification
export const notificationAPI = {
  create: (data) => api.post('/notifications', data),
  getMyNotifications: () => api.get('/notifications/my'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
  sendWhatsAppToPatient: (patientId, data) =>
    api.post(`/notifications/patient/${patientId}/whatsapp`, data),
  sendAppointmentReminder: (appointmentId, data) =>
    api.post(`/notifications/appointment/${appointmentId}/reminder`, data),
  sendBulkReminders: (data) => api.post('/notifications/appointments/bulk-reminders', data),
  sendUpcomingReminders: (data) =>
    api.post('/notifications/appointments/upcoming-reminders', data),
};

// AI
export const aiAPI = {
  analyze: (data) => api.post('/ai/analyze', data),
  getMyResults: () => api.get('/ai/my-results'),
  getResultsByPatient: (patientId) => api.get(`/ai/results/${patientId}`),
};

// Gamification
export const gamificationAPI = {
  getProfile: () => api.get('/gamification/me'),
  awardPoints: (data) => api.post('/gamification/award-points', data),
  logActivity: (data) => api.post('/gamification/log-activity', data),
  getLeaderboard: (limit) => api.get(`/gamification/leaderboard?limit=${limit || 10}`),
  getAchievements: () => api.get('/gamification/achievements'),
  createGoal: (data) => api.post('/gamification/goals', data),
  updateGoalProgress: (goalId, data) =>
    api.patch(`/gamification/goals/${goalId}/progress`, data),
  redeemReward: (data) => api.post('/gamification/redeem-reward', data),
  getRewards: () => api.get('/gamification/rewards'),
};




// Verification
export const verificationAPI = {
  sendVerificationEmail: (data) => api.post('/verification/send', data),
  verifyEmail: (token, email, role) => api.get(`/verification/verify?token=${token}&email=${encodeURIComponent(email)}&role=${role}`),
  // New simplified verification endpoint (token only in URL)
  verifyEmailByToken: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
};

// Password Reset
export const passwordAPI = {
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password, confirmPassword) => api.post(`/auth/reset-password/${token}`, { password, confirmPassword }),
};

// Messages
export const messageAPI = {
  // Get or create conversation (appointment based)
  getConversation: (appointmentId) =>
    api.get(`/messages/conversation/${appointmentId}`),

  // ✅ FIX: Get all conversations for sidebar
  getMyConversations: () =>
    api.get("/messages/conversations"),

  // Get messages in a conversation
  getMessages: (conversationId) =>
    api.get(`/messages/${conversationId}`),

  // Send message
  sendMessage: (data) =>
    api.post("/messages/send", data),
};



export default api;
