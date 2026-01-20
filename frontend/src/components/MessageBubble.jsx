import React from "react";
import { FileText, Image as ImageIcon } from "lucide-react";

const MessageBubble = ({ message, isOwn, avatar }) => {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`flex items-start space-x-2 max-w-md ${
          isOwn ? "flex-row-reverse space-x-reverse" : ""
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
            isOwn ? "bg-primary-600" : "bg-gray-400"
          }`}
        >
          {avatar}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          <div
            className={`px-4 py-2 rounded-2xl shadow-sm ${
              isOwn
                ? "bg-primary-600 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm"
            }`}
          >
            {message.messageText && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.messageText}
              </p>
            )}

            {message.attachmentUrl && (
              <div className="mt-2">
                {message.messageType === "image" ? (
                  <div className="relative">
                    <img
                      src={message.attachmentUrl}
                      alt="attachment"
                      className="max-w-xs rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <a
                    href={message.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center space-x-2 p-2 rounded-lg ${
                      isOwn
                        ? "bg-primary-700 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">View PDF</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Time */}
          <span className="text-xs text-gray-500 mt-1 px-2">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
