import React, { useState, useEffect } from 'react';
import { doctorAPI } from '../services/api';
import { User, Star, MapPin, Award, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const DoctorSuggestions = ({ specialization, limit = 5, onSelectDoctor }) => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    if (specialization) {
      fetchDoctors();
    }
  }, [specialization, sortBy, limit]);

  const fetchDoctors = async () => {
    if (!specialization) return;
    
    setLoading(true);
    try {
      console.log('🔍 Fetching doctors for:', specialization);
      const response = await doctorAPI.getBySpecialization(specialization, limit, sortBy);
      console.log('📥 Doctor suggestions response:', response);
      
      // Handle ApiResponse format: { statusCode, data: [...], message }
      // Or success format: { success: true, doctors: [...] }
      let doctorsList = [];
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        // ApiResponse format
        doctorsList = response.data.data;
      } else if (response.data?.doctors && Array.isArray(response.data.doctors)) {
        // Alternative format: { success: true, doctors: [...] }
        doctorsList = response.data.doctors;
      } else if (Array.isArray(response.data)) {
        // Direct array
        doctorsList = response.data;
      }
      
      console.log('✅ Extracted doctors list:', doctorsList);
      console.log(`✅ Found ${doctorsList.length} doctor(s)`);
      
      setDoctors(doctorsList);
    } catch (error) {
      console.error('❌ Failed to fetch doctors:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      toast.error('Failed to load doctor suggestions');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctorId) => {
    if (onSelectDoctor) {
      onSelectDoctor(doctorId);
    } else {
      // Navigate to appointments page with doctor pre-selected
      navigate(`/patient/appointments?doctorId=${doctorId}`);
    }
  };

  if (!specialization) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">Enter a specialization or disease to see doctor suggestions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Suggested Doctors for: <span className="text-primary-600">{specialization}</span>
        </h3>
        <p className="text-gray-500 text-center py-4">
          No doctors found for "{specialization}". Try a different specialization.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Suggested Doctors for: <span className="text-primary-600">{specialization}</span>
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="rating">Sort by Rating</option>
          <option value="experience">Sort by Experience</option>
          <option value="newest">Sort by Newest</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doctor) => (
          <div
            key={doctor._id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleBookAppointment(doctor._id)}
          >
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  Dr. {doctor.name}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{doctor.specialization}</p>
                
                {doctor.qualification && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Award className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500">{doctor.qualification}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.round(doctor.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">
                    {doctor.rating?.toFixed(1) || '0.0'} ({doctor.total_reviews || 0} reviews)
                  </span>
                </div>

                {doctor.experience > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {doctor.experience} years experience
                  </p>
                )}

                {doctor.city && (
                  <div className="flex items-center space-x-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500">{doctor.city}</p>
                  </div>
                )}

                {doctor.consultation_fee > 0 && (
                  <p className="text-sm font-semibold text-primary-600 mt-2">
                    ₹{doctor.consultation_fee}/consultation
                  </p>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookAppointment(doctor._id);
                  }}
                  className="mt-3 w-full bg-primary-600 text-white text-sm py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {doctors.length >= limit && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing top {limit} doctors. Use the search to find more.
          </p>
        </div>
      )}
    </div>
  );
};

export default DoctorSuggestions;

