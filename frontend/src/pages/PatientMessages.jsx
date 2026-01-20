import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { messageAPI, appointmentAPI } from "../services/api";
import { Send, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { initializeSocket } from "../utils/socket";
import MessageBubble from "../components/MessageBubble";


const PatientMessages = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // Prevent duplicates
  const messageIds = useRef(new Set());

  /* ---------- SAFETY ---------- */
  useEffect(() => {
    if (!appointmentId) {
      toast.error("Invalid chat link");
      navigate("/patient/appointments");
    }

    if (user && !user.isVerified) {
      toast.warning("Please verify your account to access chat");
      navigate("/patient/verification");
    }
  }, [appointmentId, navigate, user]);

  /* ---------- SOCKET ---------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user?.isVerified) return;

    const socket = initializeSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Patient socket connected");
    });

    socket.on("receiveMessage", (msg) => {
      if (!messageIds.current.has(msg._id)) {
        messageIds.current.add(msg._id);
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [user]);

  /* ---------- INITIAL LOAD ---------- */
  useEffect(() => {
    if (!appointmentId) return;

    (async () => {
      try {
        setLoading(true);

        // 1. Appointment
        const aptRes = await appointmentAPI.getMyAppointments();
        const apt = aptRes.data?.data?.find(
          (a) => a._id === appointmentId
        );

        if (!apt || apt.status !== "confirmed") {
          toast.error("Chat not available for this appointment");
          navigate("/patient/appointments");
          return;
        }

        setAppointment(apt);

        // 2. Conversation
        const convoRes = await messageAPI.getConversation(appointmentId);
        const convo = convoRes.data?.data;
        setConversation(convo);

        // 3. Messages
        const msgRes = await messageAPI.getMessages(convo._id);
        const msgs = msgRes.data?.data || [];

        msgs.forEach((m) => messageIds.current.add(m._id));
        setMessages(msgs);

        socketRef.current?.emit("joinConversation", convo._id);
      } catch (err) {
        toast.error("Failed to load chat");
        navigate("/patient/appointments");
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId, navigate]);

  /* ---------- SEND ---------- */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    try {
      const res = await messageAPI.sendMessage({
        conversationId: conversation._id,
        messageText: newMessage,
      });

      const msg = res.data?.data;
      if (!msg) return;

      if (!messageIds.current.has(msg._id)) {
        messageIds.current.add(msg._id);
        setMessages((prev) => [...prev, msg]);
      }

      setNewMessage("");
      socketRef.current?.emit("sendMessage", msg);
    } catch {
      toast.error("Message failed");
    }
  };

  /* ---------- SCROLL ---------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          <button onClick={() => navigate("/patient/appointments")}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Doctor Messages</h1>
            <p className="text-gray-600">
              Dr. {appointment?.doctor?.name}
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
            <p className="text-center text-gray-400 mt-20">
              No messages yet
            </p>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwn={msg.senderRole === "patient"}
                avatar={
                  msg.senderRole === "patient"
                    ? user?.name?.[0]
                    : "Dr"
                }
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500"
            placeholder="Type message..."
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary-600 text-white px-6 rounded-xl hover:bg-primary-700 disabled:opacity-50"
          >
            <Send />
          </button>
        </form>

      </div>
    </DashboardLayout>
  );
};

export default PatientMessages;
