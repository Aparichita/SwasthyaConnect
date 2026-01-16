import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { appointmentAPI, doctorAPI, patientAPI, gamificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, User, Plus, Check, X, Search, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import DoctorSuggestions from '../components/DoctorSuggestions';

const Appointments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isPatient, isDoctor } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSpecialization, setSearchSpecialization] = useState('');
  const [suggestedDoctors, setSuggestedDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    symptoms: '',
    specialization: '', // Add specialization field
  });

  useEffect(() => {
    fetchData();
    
    // Check if doctorId is in URL params (from suggestions)
    const doctorIdFromUrl = searchParams.get('doctorId');
    if (doctorIdFromUrl && isPatient) {
      setFormData(prev => ({ ...prev, doctorId: doctorIdFromUrl }));
      setShowModal(true);
    }
  }, [searchParams, isPatient]);

  // Fetch suggested doctors when specialization changes
  useEffect(() => {
    if (formData.specialization && formData.specialization.trim()) {
      fetchSuggestedDoctors(formData.specialization);
    } else {
      setSuggestedDoctors([]);
    }
  }, [formData.specialization]);

  const fetchSuggestedDoctors = async (specialization) => {
    if (!specialization || !specialization.trim()) {
      setSuggestedDoctors([]);
      return;
    }

    setLoadingDoctors(true);
    try {
      console.log('🔍 Fetching doctors for specialization:', specialization);
      const response = await doctorAPI.getSuggestedDoctors(specialization, 5);
      console.log('📥 Doctor suggestions response:', response);
      console.log('📥 Response data:', response.data);
      
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
      
      setSuggestedDoctors(doctorsList);
      
      // If only one doctor found, auto-select it
      if (doctorsList.length === 1) {
        console.log('✅ Auto-selecting single doctor:', doctorsList[0].name);
        setFormData(prev => ({ ...prev, doctorId: doctorsList[0]._id }));
      }
    } catch (error) {
      console.error('❌ Failed to fetch suggested doctors:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      setSuggestedDoctors([]);
      toast.error('Failed to load doctor suggestions. Please try again.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchData = async () => {
    try {
      const appointmentsRes = await appointmentAPI.getMyAppointments();
      setAppointments(appointmentsRes.data?.data || []);

      if (isPatient) {
        const doctorsRes = await doctorAPI.getAll();
        setDoctors(doctorsRes.data?.data || []);
      } else if (isDoctor) {
        const patientsRes = await patientAPI.getAll();
        setPatients(patientsRes.data?.data || []);
      }
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (submitting) {
      console.warn('⚠️ Already submitting, please wait...');
      return;
    }
    
    setSubmitting(true);
    
    try {
      console.log('📤 Booking appointment with data:', formData);
      const response = await appointmentAPI.book(formData);
      console.log('📥 Appointment booking response:', response);
      console.log('📥 Response data:', response.data);
      
      // Check if booking was successful
      // Backend returns: { success: true, message: "...", data: {...} }
      const isSuccess = response.data?.success === true || response.data?.data;
      
      console.log('🔍 Success check:', {
        'response.data.success': response.data?.success,
        'response.data.data': !!response.data?.data,
        'isSuccess': isSuccess
      });
      
      if (isSuccess) {
        console.log('✅ Appointment booking successful!');
        toast.success('Appointment booked successfully!');
        
        // Award gamification points for booking appointment (only for patients)
        if (isPatient && user?._id) {
          try {
            console.log('🎮 Awarding gamification points...');
            await gamificationAPI.logActivity({
              activity: 'Booked Appointment',
              description: `Appointment booked for ${formData.date} at ${formData.time}`,
            });
            console.log('✅ Gamification points awarded for booking appointment');
          } catch (gamError) {
            console.warn('⚠️ Failed to award gamification points:', gamError);
            // Don't block the flow if gamification fails
          }
        }
        
        // Close modal and reset form
        setShowModal(false);
        setFormData({ doctorId: '', date: '', time: '', symptoms: '', specialization: '' });
        setSuggestedDoctors([]);
        
        // Refresh appointments list (don't await - do it in background)
        fetchData().catch(err => console.warn('Failed to refresh appointments:', err));
        
        // Navigate immediately - don't wait for fetchData
        console.log('🔄 Navigating to /patient/dashboard...');
        console.log('🔄 Current path:', window.location.pathname);
        console.log('🔄 Navigate function available:', typeof navigate);
        
        if (isPatient) {
          // Use window.location as fallback if navigate doesn't work
          try {
            navigate('/patient/dashboard', { replace: false });
            console.log('✅ Navigate called successfully');
          } catch (navError) {
            console.error('❌ Navigation error:', navError);
            // Fallback to window.location
            window.location.href = '/patient/dashboard';
          }
        }
      } else {
        console.error('❌ Booking failed - invalid response:', response.data);
        throw new Error('Booking failed - invalid response');
      }
    } catch (error) {
      console.error('❌ Appointment booking error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to book appointment';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const response = await appointmentAPI.updateStatus(id, { status });
      
      if (response.data.success || response.data.data) {
        toast.success(`Appointment ${status}!`);
        
        // Award gamification points if doctor confirms appointment (for patient)
        if (status === 'confirmed' && isDoctor && user?._id) {
          try {
            // Note: This awards points to the patient, not the doctor
            // The patient's ID would be in the appointment data
            const appointment = appointments.find(apt => apt._id === id);
            if (appointment?.patient?._id) {
              // This would need to be handled on the backend or via a different endpoint
              // For now, we'll just log it
              console.log('✅ Appointment confirmed - patient should receive points');
            }
          } catch (gamError) {
            console.warn('⚠️ Failed to award gamification points:', gamError);
          }
        }
        
        await fetchData();
      }
    } catch (error) {
      console.error('❌ Status update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentAPI.delete(id);
      toast.success('Appointment cancelled');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel appointment');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-2">Manage your appointments</p>
          </div>
          {isPatient && (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Find Doctors</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Book Appointment</span>
              </button>
            </div>
          )}
        </div>

        {/* Doctor Suggestions Section */}
        {isPatient && showSuggestions && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Doctors by Specialization</h2>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={searchSpecialization}
                  onChange={(e) => setSearchSpecialization(e.target.value)}
                  placeholder="e.g., Cardiology, Dermatology, Orthopedics"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => setSearchSpecialization('')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Enter a specialization or disease name to see suggested doctors
              </p>
            </div>
            
            {searchSpecialization && (
              <DoctorSuggestions
                specialization={searchSpecialization}
                limit={5}
                onSelectDoctor={(doctorId) => {
                  setFormData(prev => ({ ...prev, doctorId }));
                  setShowModal(true);
                  setShowSuggestions(false);
                }}
              />
            )}
          </div>
        )}

        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isPatient
                            ? appointment.doctor?.name || 'Doctor'
                            : appointment.patient?.name || 'Patient'}
                        </h3>
                        {isDoctor && appointment.patient?.email && (
                          <p className="text-sm text-gray-600">{appointment.patient.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <span>{new Date(appointment.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-5 h-5" />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>

                    {appointment.symptoms && (
                      <p className="text-gray-600 mb-4">
                        <span className="font-semibold">Symptoms:</span> {appointment.symptoms}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    {isDoctor && appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-all shadow-soft hover:shadow-soft-lg"
                        >
                          <Check className="w-4 h-4" />
                          <span>✅ Approve</span>
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, 'rejected')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-all shadow-soft hover:shadow-soft-lg"
                        >
                          <X className="w-4 h-4" />
                          <span>❌ Reject</span>
                        </button>
                      </>
                    )}
                    {isDoctor && appointment.status === 'confirmed' && (
                      <Link
                        to={`/doctor/messages/${appointment._id}`}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2 transition-all shadow-soft hover:shadow-soft-lg text-center justify-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Open Chat</span>
                      </Link>
                    )}
                    {isPatient && appointment.status === 'confirmed' && (
                      <Link
                        to={`/patient/messages/${appointment._id}`}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2 transition-all shadow-soft hover:shadow-soft-lg text-center justify-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Open Chat</span>
                      </Link>
                    )}
                    {isPatient && appointment.status !== 'confirmed' && (
                      <button
                        onClick={() => handleDelete(appointment._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all shadow-soft hover:shadow-soft-lg"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No appointments found</p>
            {isPatient && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Book Your First Appointment
              </button>
            )}
          </div>
        )}

        {/* Book Appointment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Book Appointment</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Specialization/Disease Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization / Disease <span className="text-gray-500 text-xs font-normal">(Optional - helps find matching doctors)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => {
                      setFormData({ ...formData, specialization: e.target.value, doctorId: '' });
                      setSuggestedDoctors([]);
                    }}
                    placeholder="e.g., Cardiology, Dermatology, Orthopedics"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    list="common-specializations"
                  />
                  <datalist id="common-specializations">
                    <option value="Cardiology" />
                    <option value="Dermatology" />
                    <option value="Orthopedics" />
                    <option value="Pediatrics" />
                    <option value="Neurology" />
                    <option value="Gastroenterology" />
                    <option value="Ophthalmology" />
                    <option value="ENT" />
                    <option value="Gynecology" />
                    <option value="Psychiatry" />
                    <option value="General Medicine" />
                    <option value="Dentistry" />
                  </datalist>
                  {formData.specialization && (
                    <p className="text-xs text-gray-500 mt-1">
                      {loadingDoctors ? (
                        <span className="text-blue-600">Loading doctors...</span>
                      ) : suggestedDoctors.length > 0 ? (
                        <span className="text-green-600">✓ Found {suggestedDoctors.length} doctor(s) for "{formData.specialization}"</span>
                      ) : (
                        <span className="text-gray-500">No doctors found. You can still select from all doctors below.</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor <span className="text-red-500">*</span>
                  </label>
                  {suggestedDoctors.length > 0 ? (
                    <>
                      <p className="text-xs text-green-700 mb-2 font-semibold">
                        ⭐ Suggested doctors for "{formData.specialization}":
                      </p>
                      <select
                        value={formData.doctorId}
                        onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-green-300 bg-green-50 rounded-lg focus:ring-2 focus:ring-primary-500 mb-2"
                        required
                      >
                        <option value="">Select a suggested doctor</option>
                        {suggestedDoctors.map((doctor) => (
                          <option key={doctor._id} value={doctor._id}>
                            Dr. {doctor.name} - {doctor.specialization} 
                            {doctor.rating > 0 && ` ⭐ ${doctor.rating.toFixed(1)}`}
                            {doctor.experience > 0 && ` (${doctor.experience} yrs exp)`}
                            {doctor.city && ` - ${doctor.city}`}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setSuggestedDoctors([]);
                          setFormData(prev => ({ ...prev, specialization: '', doctorId: '' }));
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Or select from all doctors
                      </button>
                    </>
                  ) : null}
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 ${suggestedDoctors.length > 0 ? 'mt-2' : ''}`}
                    required={suggestedDoctors.length === 0}
                    disabled={suggestedDoctors.length > 0 && !formData.doctorId}
                  >
                    <option value="">
                      {suggestedDoctors.length > 0 
                        ? 'Or select from all doctors...' 
                        : 'Select a doctor'}
                    </option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time <span className="text-xs text-gray-500">(30-minute slots, starting from 10:00 AM)</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(() => {
                      const slots = [];
                      for (let hour = 10; hour < 20; hour++) {
                        slots.push(`${hour.toString().padStart(2, '0')}:00`);
                        slots.push(`${hour.toString().padStart(2, '0')}:30`);
                      }
                      return slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData({ ...formData, time: slot })}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            formData.time === slot
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-300'
                          }`}
                        >
                          {slot}
                        </button>
                      ));
                    })()}
                  </div>
                  {!formData.time && (
                    <p className="text-red-500 text-xs mt-1">Please select a time slot</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms (optional)
                  </label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Booking...' : 'Book Appointment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Appointments;

