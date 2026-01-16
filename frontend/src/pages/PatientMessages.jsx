import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { messageAPI, appointmentAPI } from '../services/api';
import { MessageSquare, Send, Paperclip, ArrowLeft, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { initializeSocket, getSocket, disconnectSocket } from '../utils/socket';

const PatientMessages = () => {
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
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* ---------- SAFETY & VERIFICATION ---------- */
  useEffect(() => {
    if (!appointmentId) {
      toast.error('Invalid message link');
      navigate('/patient/appointments');
    }

    if (user && !user.isVerified) {
      toast.warning('Your account must be verified to access chat');
      navigate('/patient/verification');
    }
  }, [appointmentId, navigate, user]);

  /* ---------- SOCKET.IO SETUP ---------- */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user?.isVerified) return;

    // Initialize socket
    const socket = initializeSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (error.message?.includes('verification')) {
        toast.error('Please verify your email to use chat');
        navigate('/verify-pending');
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
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
      const res = await appointmentAPI.getMyAppointments();
      const apt = res.data?.data?.find(a => a._id === appointmentId);

      if (!apt) {
        toast.error('Appointment not found');
        navigate('/patient/appointments');
        return;
      }

      if (apt.status !== 'confirmed') {
        toast.warning('Chat is only available for confirmed appointments');
        navigate('/patient/appointments');
        return;
      }

      setAppointment(apt);
    } catch (err) {
      toast.error('Failed to load appointment');
      navigate('/patient/appointments');
    }
  };

  /* ---------- FETCH / CREATE CONVERSATION ---------- */
  const fetchConversation = async () => {
    try {
      const res = await messageAPI.getConversation(appointmentId);
      if (res.data?.success || res.data?.statusCode === 200) {
        setConversation(res.data.data);
        await fetchMessages(res.data.data._id);
      }
    } catch (err) {
      toast.error('Unable to load chat');
      navigate('/patient/appointments');
    }
  };

  /* ---------- FETCH MESSAGES ---------- */
  const fetchMessages = async (conversationId) => {
    try {
      const res = await messageAPI.getMessages(conversationId);
      setMessages(res.data?.data || []);
      
      // Join socket room after conversation is loaded
      if (socketRef.current && conversationId) {
        socketRef.current.emit('joinConversation', conversationId);
        
        // Listen for real-time messages
        socketRef.current.on('receiveMessage', (messageData) => {
          setMessages(prev => [...prev, messageData]);
        });

        // Listen for typing indicators
        socketRef.current.on('userTyping', (data) => {
          if (data.userRole === 'doctor') {
            setIsTyping(true);
          }
        });

        socketRef.current.on('userStoppedTyping', (data) => {
          setIsTyping(false);
        });
      }
    } catch (err) {
      console.error('Message fetch failed');
    }
  };

  /* ---------- TYPING INDICATOR ---------- */
  const handleTyping = () => {
    if (!typing && conversation?._id) {
      setTyping(true);
      socketRef.current?.emit('typing', { conversationId: conversation._id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socketRef.current?.emit('stopTyping', { conversationId: conversation._id });
    }, 1000);
  };

  /* ---------- SEND MESSAGE ---------- */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    // Stop typing indicator
    if (typing) {
      setTyping(false);
      socketRef.current?.emit('stopTyping', { conversationId: conversation._id });
    }

    try {
      setSending(true);
      const response = await messageAPI.sendMessage({
        conversationId: conversation._id,
        messageText: newMessage,
      });
      if (response.data?.success || response.data?.statusCode === 201) {
        const sentMessage = response.data.data;
        const messageText = newMessage; // Save before clearing
        setNewMessage('');
        
        // Emit via socket for real-time delivery
        if (socketRef.current) {
          socketRef.current.emit('sendMessage', {
            conversationId: conversation._id,
            messageText: messageText,
            messageType: 'text',
          });
        }
        
        // Update messages immediately (optimistic update)
        setMessages(prev => [...prev, sentMessage]);
        
        // Refresh conversation for updated lastMessage & unread counts
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

      // Refresh conversation for lastMessage & unread counts
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
          <button onClick={() => navigate('/patient/appointments')}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Doctor Messages</h1>
            <p className="text-gray-600">
              Dr. {appointment?.doctor?.name} •{' '}
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
        <div className="bg-white p-6 rounded-lg shadow-soft h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <MessageSquare className="mx-auto mb-2 w-12 h-12" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start the conversation with your doctor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg._id || msg.createdAt}
                  className={`flex ${msg.senderRole === 'patient' ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div className={`flex items-start space-x-2 max-w-md ${msg.senderRole === 'patient' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.senderRole === 'patient' ? 'bg-primary-600' : 'bg-gray-300'}`}>
                      <span className="text-white text-xs font-semibold">
                        {msg.senderRole === 'patient' ? user?.name?.charAt(0)?.toUpperCase() : 'Dr'}
                      </span>
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`flex flex-col ${msg.senderRole === 'patient' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2 rounded-2xl shadow-sm ${msg.senderRole === 'patient' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                        {msg.messageText && (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.messageText}</p>
                        )}
                        {msg.attachmentUrl && (
                          <div className="mt-2">
                            {msg.messageType === 'image' ? (
                              <div className="relative">
                                <img 
                                  src={msg.attachmentUrl} 
                                  alt="attachment" 
                                  className="max-w-xs rounded-lg shadow-sm"
                                />
                                <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                                  <ImageIcon className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            ) : (
                              <a 
                                href={msg.attachmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`flex items-center space-x-2 p-2 rounded-lg ${msg.senderRole === 'patient' ? 'bg-primary-700 text-white' : 'bg-white text-gray-700'} hover:opacity-90 transition-opacity`}
                              >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">View PDF</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Timestamp */}
                      <span className="text-xs text-gray-500 mt-1 px-2">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-semibold">Dr</span>
                    </div>
                    <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              className="w-full border border-gray-300 rounded-xl p-3 pr-12 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Type your message..."
              rows={3}
            />
            <label className="absolute right-3 bottom-3 cursor-pointer">
              <input type="file" hidden onChange={handleFileUpload} accept="image/*,application/pdf" />
              <Paperclip className="w-5 h-5 text-gray-400 hover:text-primary-600 transition-colors" />
            </label>
          </div>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft hover:shadow-soft-lg flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </form>

      </div>
    </DashboardLayout>
  );
};

export default PatientMessages;
