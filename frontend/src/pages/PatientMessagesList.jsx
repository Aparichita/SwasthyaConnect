import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../services/api';
import { MessageSquare, ArrowRight, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const PatientMessagesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMyConversations();
      if (response.data?.success) {
        setConversations(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load messages');
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Chat with your doctors about confirmed appointments</p>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-squircle shadow-soft p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No messages yet</p>
            <p className="text-gray-400 text-sm">
              Messages will appear here once you have confirmed appointments with doctors.
            </p>
            <button
              onClick={() => navigate('/patient/appointments')}
              className="mt-6 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-all"
            >
              View Appointments
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => navigate(`/patient/messages/${conversation.appointment._id}`)}
                className="bg-white rounded-squircle shadow-soft border-0 p-6 hover:shadow-soft-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {conversation.doctor?.name || 'Doctor'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {conversation.doctor?.specialization || 'General Medicine'}
                        </p>
                      </div>
                    </div>
                    
                    {conversation.appointment && (
                      <div className="flex items-center space-x-4 text-sm text-gray-500 ml-16 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(conversation.appointment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{conversation.appointment.time}</span>
                        </div>
                      </div>
                    )}

                    {conversation.lastMessage && (
                      <p className="text-gray-600 text-sm ml-16 truncate">
                        {conversation.lastMessage}
                      </p>
                    )}

                    {conversation.unreadCount?.patient > 0 && (
                      <span className="ml-16 mt-2 inline-block bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                        {conversation.unreadCount.patient} unread
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientMessagesList;

