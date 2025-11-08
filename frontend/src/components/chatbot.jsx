// src/components/Chatbot.jsx
import React, { useState } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Call your backend chatbot API
      const response = await axios.post('http://192.168.44.72:8000/chat', { message: input });
      const botText = response.data?.reply || 'Sorry, I did not understand that.';

      const botMessage = { sender: 'bot', text: botText };
      setMessages(prev => [...prev, botMessage]);

      // Speak bot response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(botText);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = { sender: 'bot', text: 'Error: Could not reach the chatbot server.' };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="w-full max-w-md mx-auto border rounded-lg overflow-hidden flex flex-col h-[500px]">
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 bg-gray-50" id="chat-container">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-2">Start the conversation...</p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`px-3 py-2 rounded-lg max-w-[80%] break-words ${
              msg.sender === 'user' ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-200 text-gray-900'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="p-2 border-t flex gap-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
