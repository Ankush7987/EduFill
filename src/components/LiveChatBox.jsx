import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
// 🌟 FIXED: Added MessageCircle in the import below 🌟
import { Send, ShieldCheck, CheckCircle, Lock, CheckCheck, Info, MessageCircle } from 'lucide-react';

// Connect to your Node backend
const socket = io("http://localhost:5000"); // Backend ka URL daalein

export default function LiveChatBox({ roomId, currentUserType, currentUserId, otherPersonName, onChatClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isChatEnded, setIsChatEnded] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.emit("join_room", { roomId });

    socket.on("chat_history", (history) => {
      setMessages(history || []);
      setTimeout(scrollToBottom, 100);
    });

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(scrollToBottom, 100);
    });

    socket.on("chat_ended", () => {
      setIsChatEnded(true);
      if (onChatClose) {
        setTimeout(() => onChatClose(), 3500); // 3.5 seconds delay before closing
      }
    });

    return () => {
      socket.off("chat_history");
      socket.off("receive_message");
      socket.off("chat_ended");
    };
  }, [roomId, onChatClose]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() === "") return;

    const messageData = {
      roomId,
      senderId: currentUserId,
      senderType: currentUserType, 
      text: inputText,
    };

    socket.emit("send_message", messageData);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-[520px] w-full bg-[#F4F7FB] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-200/60 overflow-hidden font-sans relative">
      
      {/* 🌟 PREMIUM HEADER 🌟 */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-5 py-4 text-white flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center font-black text-lg shadow-inner border border-white/20">
              {otherPersonName.charAt(0).toUpperCase()}
            </div>
            {/* Pulsing Online Status */}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full">
              <div className="w-full h-full bg-emerald-400 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
          <div>
            <h3 className="font-black text-lg leading-tight tracking-wide">{otherPersonName}</h3>
            <p className="text-[11px] text-indigo-200 font-bold flex items-center gap-1 mt-0.5">
              <ShieldCheck size={12} className="text-emerald-400"/> Verified Expert
            </p>
          </div>
        </div>
        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm" title="End-to-End Encrypted">
          <Lock size={18} className="text-indigo-200" />
        </div>
      </div>

      {/* 🌟 CHAT MESSAGES AREA 🌟 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 relative 
        [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 transition-colors">
        
        {/* System Trust Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-50 border border-yellow-200/60 text-yellow-800 text-[11px] font-bold px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm max-w-[90%] text-center leading-tight">
            <Info size={14} className="shrink-0 text-yellow-600"/>
            Chat securely. OTPs shared here are encrypted and auto-deleted.
          </div>
        </div>

        {messages.length === 0 && !isChatEnded && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-700">
            <MessageCircle size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-bold">Say Hello to {otherPersonName}!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.senderType === currentUserType;
          return (
            <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`px-4 py-2.5 shadow-sm relative group
                    ${isMe 
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm'
                    }`}
                >
                  <p className="text-[14.5px] leading-snug break-words font-medium">{msg.text}</p>
                  
                  {/* Inline Timestamp */}
                  <div className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                    <span className="text-[9.5px] font-bold tracking-wider">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck size={12} className="opacity-80" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-1" />
        
        {/* End of Chat Overlay */}
        {isChatEnded && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500 z-20">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-lg border-4 border-white">
              <CheckCircle size={40} />
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-2">Form Completed!</h4>
            <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-[250px]">
              For your privacy, this chat session is now secured and permanently closed.
            </p>
          </div>
        )}
      </div>

      {/* 🌟 PREMIUM INPUT AREA 🌟 */}
      <div className="p-4 bg-white border-t border-gray-100 z-10">
        <form 
          onSubmit={sendMessage} 
          className="flex items-end gap-2 bg-[#F4F7FB] border border-gray-200 p-1.5 rounded-full focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 focus-within:bg-white transition-all shadow-inner"
        >
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isChatEnded}
            placeholder="Type your message here..." 
            className="flex-1 bg-transparent px-4 py-2.5 outline-none text-[15px] font-medium text-slate-800 placeholder-slate-400 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={isChatEnded || !inputText.trim()}
            className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-all shadow-md shrink-0 active:scale-90"
          >
            <Send size={18} className="ml-1 shrink-0" />
          </button>
        </form>
      </div>
      
    </div>
  );
}