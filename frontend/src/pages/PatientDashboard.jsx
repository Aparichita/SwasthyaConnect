import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { patientAPI, appointmentAPI, reportAPI, notificationAPI, gamificationAPI } from '../services/api';
import {
  Calendar,
  FileText,
  Bell,
  Award,
  TrendingUp,
  User,
  Shield,
  Brain,
  Search,
  MessageSquare
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import DoctorSuggestions from '../components/DoctorSuggestions';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    appointments: 0,
    reports: 0,
    notifications: 0,
    points: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [searchSpecialization, setSearchSpecialization] = useState('');

  // Common specializations for quick access
  const commonSpecializations = [
    'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics',
    'Neurology', 'Gastroenterology', 'Ophthalmology', 'ENT',
    'Gynecology', 'Psychiatry', 'General Medicine', 'Dentistry'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile: patientAPI.getProfile() // GET /api/patients/me
      // Fetch appointments: appointmentAPI.getMyAppointments() // GET /api/appointments/my
      // Fetch reports: reportAPI.getMyReports() // GET /api/reports/my
      // Fetch notifications: notificationAPI.getMyNotifications() // GET /api/notifications/my
      // Fetch gamification: gamificationAPI.getProfile() // GET /api/gamification/me
      const [profileRes, appointmentsRes, reportsRes, notificationsRes, gamificationRes] = await Promise.all([
        patientAPI.getProfile().catch(() => ({ data: { data: null } })),
        appointmentAPI.getMyAppointments().catch(() => ({ data: { data: [] } })),
        reportAPI.getMyReports().catch(() => ({ data: { data: [] } })),
        notificationAPI.getMyNotifications().catch(() => ({ data: { data: [] } })),
        gamificationAPI.getProfile().catch(() => ({ data: { data: { totalPoints: 0 } } })),
      ]);

      setProfile(profileRes.data?.data || null);
      const appointments = appointmentsRes.data?.data || [];
      const reports = reportsRes.data?.data || [];
      const notifications = notificationsRes.data?.data || [];
      const points = gamificationRes.data?.data?.totalPoints || 0;

      setStats({
        appointments: appointments.length,
        reports: reports.length,
        notifications: notifications.length,
        points,
      });

      setRecentAppointments(appointments.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your health overview</p>
        </div>

        {/* Stats Grid - Bento Box Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-squircle shadow-soft p-6 border-0 hover:shadow-soft-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Appointments</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.appointments}</p>
              </div>
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-primary-600" />
              </div>
            </div>
            <Link
              to="/patient/appointments"
              className="text-primary-600 text-sm mt-4 inline-block hover:underline font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-squircle shadow-soft p-6 border-0 hover:shadow-soft-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Reports</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.reports}</p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-green-600" />
              </div>
            </div>
            <Link
              to="/patient/reports"
              className="text-green-600 text-sm mt-4 inline-block hover:underline font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-squircle shadow-soft p-6 border-0 hover:shadow-soft-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Notifications</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.notifications}</p>
              </div>
              <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center">
                <Bell className="w-7 h-7 text-yellow-600" />
              </div>
            </div>
            <Link
              to="/patient/notifications"
              className="text-yellow-600 text-sm mt-4 inline-block hover:underline font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-squircle shadow-soft p-6 border-0 hover:shadow-soft-lg transition-shadow lg:col-span-2 lg:row-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Health Points</p>
                <p className="text-5xl font-bold text-gray-900 mt-2">{stats.points}</p>
                <div className="mt-4 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-gray-600">Keep earning points!</span>
                </div>
              </div>
              <div className="w-20 h-20 bg-primary-200 rounded-3xl flex items-center justify-center">
                <Award className="w-10 h-10 text-primary-700" />
              </div>
            </div>
            <p className="text-purple-600 text-sm mt-4">Keep earning! 🎉</p>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
            <Link
              to="/patient/appointments"
              className="text-primary-600 hover:underline text-sm"
            >
              View all
            </Link>
          </div>
          {recentAppointments.length > 0 ? (
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {appointment.doctor?.name || 'Doctor'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Status: <span className={`font-semibold ${
                          appointment.status === 'confirmed' ? 'text-green-600' :
                          appointment.status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{appointment.status}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No appointments yet</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => setShowDoctorSearch(!showDoctorSearch)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
          >
            <Search className="w-8 h-8 text-green-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Find Doctors</h3>
            <p className="text-gray-600 text-sm">Search by specialization</p>
          </button>
          <Link
            to="/patient/appointments"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <Calendar className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Book Appointment</h3>
            <p className="text-gray-600 text-sm">Schedule a new appointment with a doctor</p>
          </Link>

          <Link
            to="/patient/reports"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <FileText className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Upload Report</h3>
            <p className="text-gray-600 text-sm">Upload your medical reports</p>
          </Link>

          <Link
            to="/patient/feedback"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <TrendingUp className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Give Feedback</h3>
            <p className="text-gray-600 text-sm">Share your experience</p>
          </Link>

          <Link
            to="/patient/appointments"
            className="bg-white rounded-squircle shadow-soft p-6 border-0 hover:shadow-soft-lg transition-all"
          >
            <MessageSquare className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Messages</h3>
            <p className="text-gray-600 text-sm">Chat with your doctors</p>
          </Link>
        </div>

        {/* Profile Info */}
        {profile && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
                <p className="text-gray-600">{profile.email}</p>
                {profile.city && <p className="text-gray-500 text-sm">{profile.city}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Doctor Search Section */}
        {showDoctorSearch && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Find Doctors by Specialization</h2>
                <button
                  onClick={() => {
                    setShowDoctorSearch(false);
                    setSearchSpecialization('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={searchSpecialization}
                  onChange={(e) => setSearchSpecialization(e.target.value)}
                  placeholder="e.g., Cardiology, Dermatology, Orthopedics"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Search:</p>
                <div className="flex flex-wrap gap-2">
                  {commonSpecializations.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => {
                        setSearchSpecialization(spec);
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-primary-100 hover:text-primary-700 transition-colors"
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {searchSpecialization && (
              <DoctorSuggestions
                specialization={searchSpecialization}
                limit={5}
                onSelectDoctor={(doctorId) => {
                  navigate(`/patient/appointments?doctorId=${doctorId}`);
                }}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;

