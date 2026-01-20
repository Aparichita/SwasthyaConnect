import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { feedbackAPI, doctorAPI, gamificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Star, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const Feedback = () => {
  const { user, isPatient, isDoctor } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    message: '',
    rating: 5,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (isPatient) {
        const res = await feedbackAPI.getMyFeedback();
        setFeedbacks(res.data?.data || []);
        const doctorsRes = await doctorAPI.getAll();
        setDoctors(doctorsRes.data?.data || []);
      } else if (isDoctor) {
        const res = await feedbackAPI.getForDoctor(user._id);
        setFeedbacks(res.data?.data || []);
      }
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedMessage = formData.message.trim();

    if (isPatient && !formData.doctorId) {
      toast.error('Please select a doctor');
      return;
    }

    const payload = {
      doctorId: formData.doctorId || undefined,
      message: trimmedMessage,
      rating: formData.rating,
    };

    try {
      const response = await feedbackAPI.add(payload);
      
      // Check if feedback was submitted successfully
      if (response.data.success || response.data.data) {
        toast.success('Feedback submitted successfully!');
        
        // Award gamification points for submitting feedback (only for patients)
        if (isPatient && user?._id) {
          try {
            await gamificationAPI.logActivity({
              activity: 'Submitted Feedback',
              description: `Feedback submitted with ${formData.rating} star rating`,
            });
            console.log('✅ Gamification points awarded for submitting feedback');
          } catch (gamError) {
            console.warn('⚠️ Failed to award gamification points:', gamError);
            // Don't block the flow if gamification fails
          }
        }
        
        setShowModal(false);
        setFormData({ doctorId: '', message: '', rating: 5 });
        await fetchData();
      } else {
        throw new Error('Feedback submission failed - invalid response');
      }
    } catch (error) {
      console.error('❌ Feedback submission error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to submit feedback');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await feedbackAPI.delete(id);
      toast.success('Feedback deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete feedback');
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
            <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
            <p className="text-gray-600 mt-2">
              {isPatient ? 'Share your experience' : 'View patient feedback'}
            </p>
          </div>
          {isPatient && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Feedback</span>
            </button>
          )}
        </div>

        {feedbacks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isPatient
                            ? feedback.doctor?.name || 'Doctor'
                            : feedback.patient?.name || 'Patient'}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (feedback.rating || 5)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700">{feedback.message}</p>
                  </div>
                  {isPatient && (
                    <button
                      onClick={() => handleDelete(feedback._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {isPatient ? 'No feedback submitted yet' : 'No feedback received yet'}
            </p>
            {isPatient && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Add Your First Feedback
              </button>
            )}
          </div>
        )}

        {/* Add Feedback Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Feedback</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor
                  </label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: i + 1 })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            i < formData.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={4}
                    placeholder="Share your experience (optional)"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                  >
                    Submit
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

export default Feedback;

