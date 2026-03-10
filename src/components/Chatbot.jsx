import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 🌟 API KEY 🌟
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// 🌟 LATEST MODEL 🌟
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const systemInstruction = `You are 'EduBot', the official helpful AI assistant for 'EduFill'. 
EduFill is a platform that helps students fill their exam forms (NEET, JEE, CUET, etc.) 100% error-free without waiting in cyber cafe queues.
Key Information:
1. Process: Book slot online -> Arrive 10 mins early -> Upload docs -> Expert fills the form.
2. Required Documents: Passport size photo, Signature, 10th Marksheet, Domicile, Caste Certificate.
Tone: Be very polite, concise, and helpful. Reply in Hinglish. Never invent false pricing.`;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  
  // UI me dikhane wale messages
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Namaste! 👋 Main EduFill ka AI Assistant hu. Form filling ya documents se juda koi sawal hai toh poochein!' }
  ]);
  
  // API ko bhejne wali internal history
  const [apiHistory, setApiHistory] = useState([
    { role: 'user', parts: [{ text: "SYSTEM INSTRUCTION (Follow strictly): " + systemInstruction }] },
    { role: 'model', parts: [{ text: "Understood. I am EduBot and I am ready to help." }] }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    // UI Update
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    
    // API History Update
    const newApiHistory = [...apiHistory, { role: 'user', parts: [{ text: userMessage }] }];
    setApiHistory(newApiHistory);
    
    setIsLoading(true);

    try {
      // 🌟 DIRECT GENERATION (Bina startChat ke, ye kabhi fail nahi hota) 🌟
      const result = await model.generateContent({ contents: newApiHistory });
      const botReply = result.response.text();
      
      setMessages((prev) => [...prev, { role: 'model', text: botReply }]);
      setApiHistory((prev) => [...prev, { role: 'model', parts: [{ text: botReply }] }]);
      
    } catch (error) {
      console.error('🚨 Chatbot Error:', error);
      setMessages((prev) => [...prev, { 
        role: 'model', 
        text: `Error aa gaya: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999]">
      {isOpen && (
        <div className="bg-white w-[320px] md:w-[350px] h-[450px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 mb-4 animate-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex justify-between items-center text-white shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-white text-emerald-600 p-1.5 rounded-full"><Bot size={20} /></div>
              <div>
                <h3 className="font-extrabold text-sm">EduBot (AI Support)</h3>
                <p className="text-[10px] text-emerald-100 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span> Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={18} /></button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-500 p-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> <span className="text-xs font-medium">Typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

         {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end">
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // WhatsApp Logic: Enter = Send, Shift+Enter = New Line
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Ask about forms, docs..." 
              className="flex-1 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-0 rounded-2xl px-4 py-2.5 text-sm outline-none transition-all resize-none overflow-y-auto"
              disabled={isLoading}
              rows={Math.min(input.split('\n').length || 1, 4)} 
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white p-2.5 rounded-full transition-all flex-shrink-0 mb-0.5">
              <Send size={18} />
            </button>
          </form>


        </div>
      )}

      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105 active:scale-95 text-white p-4 rounded-full shadow-2xl transition-all flex items-center justify-center relative">
          <MessageSquare size={26} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
          </span>
        </button>
      )}
    </div>
  );
}