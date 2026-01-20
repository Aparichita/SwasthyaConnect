import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { appointmentAPI, messageAPI } from "../services/api";
import { initializeSocket } from "../utils/socket";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import MessageBubble from "../components/MessageBubble";

const DoctorMessages = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // Prevent duplicate messages
  const messageIds = useRef(new Set());

  /* ---------- SOCKET SETUP ---------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = initializeSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Doctor socket connected");
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
  }, []);

  /* ---------- INITIAL LOAD ---------- */
  useEffect(() => {
    if (!appointmentId) return;

    (async () => {
      try {
        // 1. Load appointment
        const aptRes = await appointmentAPI.getDoctorAppointments();
        const apt = aptRes.data?.data?.find(
          (a) => a._id === appointmentId
        );

        if (!apt) {
          toast.error("Appointment not found");
          navigate("/doctor/appointments");
          return;
        }

        setAppointment(apt);

        // 2. Load conversation
        const convoRes = await messageAPI.getConversation(appointmentId);
        const convo = convoRes.data?.data;

        if (!convo) {
          toast.error("Conversation not found");
          navigate("/doctor/appointments");
          return;
        }

        setConversation(convo);

        // 3. Load messages
        const msgRes = await messageAPI.getMessages(convo._id);
        const msgs = msgRes.data?.data || [];

        msgs.forEach((m) => messageIds.current.add(m._id));
        setMessages(msgs);

        // 4. Join socket room
        socketRef.current?.emit("joinConversation", convo._id);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load chat");
        navigate("/doctor/appointments");
      }
    })();
  }, [appointmentId, navigate]);

  /* ---------- SEND MESSAGE ---------- */
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

      // Optimistic UI update (dedup safe)
      if (!messageIds.current.has(msg._id)) {
        messageIds.current.add(msg._id);
        setMessages((prev) => [...prev, msg]);
      }

      setNewMessage("");

      // Emit via socket
      socketRef.current?.emit("sendMessage", msg);
    } catch {
      toast.error("Message failed");
    }
  };

  /* ---------- AUTO SCROLL ---------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------- UI ---------- */
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Patient Messages</h1>
            <p className="text-gray-600">
              {appointment?.patient?.name}
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
                isOwn={msg.senderRole === "doctor"}
                avatar={msg.senderRole === "doctor" ? "Dr" : appointment?.patient?.name?.[0]}
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

export default DoctorMessages;
