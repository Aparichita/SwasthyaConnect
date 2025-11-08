import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { doctorAPI, appointmentAPI, patientAPI, feedbackAPI } from '../services/api';
import { Calendar, Users, MessageSquare, Clock, FileText, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    appointments: 0,
    patients: 0,
    feedback: 0,
    pendingAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profile: doctorAPI.getProfile() // GET /api/doctors/me
      // Fetch appointments: appointmentAPI.getMyAppointments() // GET /api/appointments/my
      // Fetch feedback: feedbackAPI.getForDoctor(doctorId) // GET /api/feedback/:doctorId
      const [profileRes, appointmentsRes, patientsRes, feedbackRes] = await Promise.all([
        doctorAPI.getProfile().catch(() => ({ data: { data: null } })),
        appointmentAPI.getMyAppointments().catch(() => ({ data: { data: [] } })),
        patientAPI.getAll().catch(() => ({ data: { data: [] } })),
        user?._id ? feedbackAPI.getForDoctor(user._id).catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
      ]);

      setProfile(profileRes.data?.data || null);
      const appointments = appointmentsRes.data?.data || [];
      const patients = patientsRes.data?.data || [];
      const feedback = feedbackRes.data?.data || [];

      const pendingAppointments = appointments.filter(
        (apt) => apt.status === 'pending'
      ).length;

      setStats({
        appointments: appointments.length,
        patients: patients.length,
        feedback: feedback.length,
        pendingAppointments,
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
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your practice efficiently</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Appointments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.appointments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Link
              to="/doctor/appointments"
              className="text-blue-600 text-sm mt-4 inline-block hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.patients}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-green-600 text-sm mt-4">All patients</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Appointments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingAppointments}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <Link
              to="/doctor/appointments"
              className="text-yellow-600 text-sm mt-4 inline-block hover:underline"
            >
              Review now →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Feedback</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.feedback}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <Link
              to="/doctor/feedback"
              className="text-purple-600 text-sm mt-4 inline-block hover:underline"
            >
              View all →
            </Link>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
            <Link
              to="/doctor/appointments"
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
                        {appointment.patient?.name || 'Patient'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                      {appointment.symptoms && (
                        <p className="text-sm text-gray-500 mt-1">
                          Symptoms: {appointment.symptoms}
                        </p>
                      )}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/doctor/appointments"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <Calendar className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Manage Appointments</h3>
            <p className="text-gray-600 text-sm">View and update appointment status</p>
          </Link>

          <Link
            to="/doctor/reports"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <FileText className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">View Reports</h3>
            <p className="text-gray-600 text-sm">Access patient medical reports</p>
          </Link>

          <Link
            to="/doctor/feedback"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <MessageSquare className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">View Feedback</h3>
            <p className="text-gray-600 text-sm">See patient feedback and reviews</p>
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
                <h3 className="text-xl font-semibold text-gray-900">Dr. {profile.name}</h3>
                <p className="text-gray-600">{profile.email}</p>
                {profile.specialization && <p className="text-gray-500 text-sm">{profile.specialization}</p>}
                {profile.city && <p className="text-gray-500 text-sm">{profile.city}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;

