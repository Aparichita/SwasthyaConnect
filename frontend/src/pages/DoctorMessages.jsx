import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { messageAPI, appointmentAPI } from '../services/api';
import { MessageSquare, Send, Paperclip, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const DoctorMessages = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Optional verification guard
  useEffect(() => {
    if (user && !user.isVerified) {
      toast.warning('Your account must be verified to access chat');
      navigate('/doctor/verification');
    }
  }, [user, navigate]);

  /* ---------- INITIAL LOAD ---------- */
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await fetchAppointment();
        await fetchConversation();
      } finally {
        setLoading(false);
      }
    };
    if (appointmentId) init();
  }, [appointmentId]);

  /* ---------- FETCH APPOINTMENT ---------- */
  const fetchAppointment = async () => {
    try {
      const res = await appointmentAPI.getMyAppointments(); // doctor sees own appointments
      const apt = res.data?.data?.find(a => a._id === appointmentId);

      if (!apt) {
        toast.error('Appointment not found');
        navigate('/doctor/appointments');
        return;
      }

      setAppointment(apt);
    } catch (err) {
      toast.error('Failed to load appointment');
      navigate('/doctor/appointments');
    }
  };

  /* ---------- FETCH / CREATE CONVERSATION ---------- */
  const fetchConversation = async () => {
    try {
      const res = await messageAPI.getConversation(appointmentId);
      if (res.data?.success || res.data?.statusCode === 200) {
        setConversation(res.data.data);
        await fetchMessages(res.data.data._id);

        // Optional: mark patient messages as read
        if (res.data.data._id) {
          await messageAPI.markAsRead(res.data.data._id); // ensure API endpoint exists
        }
      }
    } catch (err) {
      toast.error('Unable to load chat');
      navigate('/doctor/appointments');
    }
  };

  /* ---------- FETCH MESSAGES ---------- */
  const fetchMessages = async (conversationId) => {
    try {
      const res = await messageAPI.getMessages(conversationId);
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error('Message fetch failed');
    }
  };

  /* ---------- SEND MESSAGE ---------- */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    try {
      setSending(true);
      const response = await messageAPI.sendMessage({
        conversationId: conversation._id,
        messageText: newMessage,
      });
      if (response.data?.success || response.data?.statusCode === 201) {
        setNewMessage('');
        await fetchMessages(conversation._id);
        // refresh conversation for lastMessage & unread count
        const convRes = await messageAPI.getConversation(appointmentId);
        if (convRes.data?.success) setConversation(convRes.data.data);
      } else {
        toast.error('Failed to send message');
      }
    } catch {
      toast.error('Message failed');
    } finally {
      setSending(false);
    }
  };

  /* ---------- FILE UPLOAD ---------- */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !conversation) return;

    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, PDF allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('attachment', file);
      formData.append('conversationId', conversation._id);
      formData.append(
        'messageType',
        file.type.startsWith('image/') ? 'image' : 'pdf'
      );

      await messageAPI.uploadAttachment(formData);
      await fetchMessages(conversation._id);

      // Refresh conversation for lastMessage & unread count
      const convRes = await messageAPI.getConversation(appointmentId);
      if (convRes.data?.success) setConversation(convRes.data.data);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center h-64 items-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-primary-600 rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  /* ---------- UI ---------- */
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/doctor/appointments')}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Patient Messages</h1>
            <p className="text-gray-600">
              {appointment?.patient?.name} •{' '}
              {new Date(appointment?.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex gap-2">
            <AlertTriangle className="text-yellow-600" />
            <p className="text-sm text-yellow-800">
              This chat is for non-emergency medical queries only.
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white p-6 rounded-lg shadow h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <MessageSquare className="mx-auto mb-2" />
              No messages yet
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg._id}
                className={`flex ${msg.senderRole === 'doctor' ? 'justify-end' : 'justify-start'} mb-3`}
              >
                <div className={`p-3 rounded-xl max-w-md ${msg.senderRole === 'doctor' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>
                  {msg.messageText}
                  {msg.attachmentUrl && (
                    msg.messageType === 'image' ? (
                      <img src={msg.attachmentUrl} alt="attachment" className="max-w-xs mt-2 rounded" />
                    ) : (
                      <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block mt-2">
                        View PDF
                      </a>
                    )
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-1 border rounded p-3"
            placeholder="Type message..."
          />
          <label>
            <input type="file" hidden onChange={handleFileUpload} />
            <Paperclip className="cursor-pointer mt-3" />
          </label>
          <button
            disabled={sending}
            className="bg-primary-600 text-white px-4 rounded"
          >
            <Send />
          </button>
        </form>

      </div>
    </DashboardLayout>
  );
};

export default DoctorMessages;
