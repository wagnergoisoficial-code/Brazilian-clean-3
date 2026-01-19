import React, { useState, useRef, useEffect } from 'react';
import { generateBrianResponse } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { ChatMessage } from '../types';

// Icons
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z"/></svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);

// LUNA'S AVATAR: Blonde professional woman, approx 28 years old.
const LUNA_AVATAR_URL = "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=256";

const BrianAI: React.FC = () => {
  const { userRole, cleaners, isChatOpen, setIsChatOpen } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting based on role - LUNA (Objective, Intelligent, Female)
    if (messages.length === 0) {
      const greeting = userRole === 'CLIENT' 
        ? "Hello. I am Luna. I am here to facilitate your search and verification process efficiently. How may I assist you?"
        : "Olá. Sou Luna. Estou à disposição para agilizar seus processos na plataforma. Qual é a sua solicitação?";
      
      setMessages([{
        id: 'init',
        role: 'model',
        text: greeting,
        timestamp: Date.now()
      }]);
    }
  }, [userRole]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Prepare history for API
    const history = [...messages, userMsg].map(m => ({ role: m.role, text: m.text }));

    try {
      const responseText = await generateBrianResponse(
        history, 
        userRole, 
        location.pathname,
        cleaners
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isChatOpen && (
        <div className="pointer-events-auto bg-white w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] sm:h-[650px] max-h-[calc(100vh-120px)] rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-2 sm:mb-4 overflow-hidden transition-all duration-300 origin-bottom-right">
          
          {/* Header - Fixed Height, Shrink-0 to prevent disappearing */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex justify-between items-center text-white shadow-md z-20 shrink-0 h-[80px]">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img 
                  src={LUNA_AVATAR_URL} 
                  alt="Luna AI" 
                  className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm bg-gray-300"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Luna</h3>
                <p className="text-xs text-gray-300 font-medium tracking-wide">Platform Intelligence</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white transition p-1 rounded-full hover:bg-white/10">
              <XIcon />
            </button>
          </div>

          {/* Messages Area - Flex 1 to take all remaining height */}
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-4 min-h-0">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                   <img src={LUNA_AVATAR_URL} alt="Luna" className="w-8 h-8 rounded-full object-cover mr-2 self-end mb-1 border border-gray-200 shadow-sm shrink-0 bg-gray-300" />
                )}
                <div 
                  className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                 <img src={LUNA_AVATAR_URL} alt="Luna" className="w-8 h-8 rounded-full object-cover mr-2 self-end mb-1 shrink-0 bg-gray-300" />
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Shrink-0 to always stay visible */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0 h-[80px] flex items-center">
            <div className="flex w-full items-center gap-2 bg-gray-50 rounded-full px-4 py-3 border focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={userRole === 'CLIENT' ? "Type your request..." : "Digite sua mensagem..."}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400"
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="pointer-events-auto bg-slate-900 hover:bg-black text-white p-0 rounded-full shadow-2xl transition-transform hover:scale-105 flex items-center justify-center group w-16 h-16 overflow-hidden border-2 border-white relative z-50"
      >
        {isChatOpen ? (
            <XIcon />
        ) : (
            <img src={LUNA_AVATAR_URL} alt="Chat" className="w-full h-full object-cover" />
        )}
        
        {!isChatOpen && messages.length === 1 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>
    </div>
  );
};

export default BrianAI;