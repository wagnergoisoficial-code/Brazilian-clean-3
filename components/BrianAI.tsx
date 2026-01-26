import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { generateBrianResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

const BrianAI: React.FC = () => {
  const { isChatOpen, setIsChatOpen, userRole, cleaners } = useAppContext();
  const location = useLocation();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const EXTERNAL_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200";
  const BACKUP_AVATAR = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e2e8f0"/><circle cx="100" cy="80" r="40" fill="#94a3b8"/><path d="M40,180 a60,60 0 0,1 120,0" fill="#94a3b8"/></svg>')}`;
  const [avatarSrc, setAvatarSrc] = useState(EXTERNAL_AVATAR);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Standardized, compliant greeting (Bilingual)
    if (history.length === 0) {
      setHistory([{
        id: '1',
        role: 'model',
        text: 'Hello! I am Luna. I am here to help you with Brazilian Clean 😊 | Olá! Sou a Luna. Estou aqui para te ajudar no Brazilian Clean 😊',
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isChatOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // SAFETY VALVE: UI Timeout
    // Guarantees UI doesn't freeze, but uses a natural message instead of "Error"
    const safetyValve = setTimeout(() => {
        setIsTyping((current) => {
            if (current) {
                setHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: "Hmm, demorou um pouquinho... Tente perguntar novamente? 😊 | Hmm, taking a moment... could you ask again? 😊",
                    timestamp: Date.now()
                }]);
                return false;
            }
            return current;
        });
    }, 12000);

    try {
      const apiHistory = history.map(h => ({ role: h.role, text: h.text }));
      apiHistory.push({ role: userMsg.role, text: userMsg.text });

      // Service guarantees a string return and never throws (internally caught)
      const responseText = await generateBrianResponse(apiHistory, userRole, location.pathname, cleaners);
      
      clearTimeout(safetyValve); // Success, clear the valve

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, botMsg]);
    } catch (error) {
      // Emergency UI Fallback (Should rarely be reached due to service layer catch)
      clearTimeout(safetyValve);
      console.error("UI Chat Error:", error);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Desculpe, tive um pequeno lapso. Como posso te ajudar com a plataforma? 😊",
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
      clearTimeout(safetyValve); // Ensure timer is cleared in all paths
    }
  };

  if (!isChatOpen) {
    return (
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition z-50 group"
      >
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        <svg className="w-7 h-7 group-hover:rotate-12 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-48px)] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200 animate-slide-in-up">
      <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <img 
            src={avatarSrc} 
            alt="Luna" 
            className="w-10 h-10 rounded-full object-cover border-2 border-green-400 bg-white"
            onError={() => setAvatarSrc(BACKUP_AVATAR)}
          />
          <div>
            <h3 className="font-bold text-sm">Luna AI</h3>
            <div className="flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
               <p className="text-[10px] text-slate-300 uppercase tracking-wide">Online</p>
            </div>
          </div>
        </div>
        <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 scrollbar-hide">
        {history.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
                <img 
                  src={avatarSrc} 
                  className="w-6 h-6 rounded-full object-cover mr-2 flex-shrink-0 bg-white" 
                  onError={() => setAvatarSrc(BACKUP_AVATAR)}
                  alt="L"
                />
            )}
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none shadow-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 ml-8">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Luna... | Fale com a Luna..."
          className="flex-1 bg-gray-100 text-sm px-4 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-black transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </form>
    </div>
  );
};

export default BrianAI;