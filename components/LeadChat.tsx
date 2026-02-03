
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

interface LeadChatProps {
  leadId: string;
  onClose: () => void;
}

const LeadChat: React.FC<LeadChatProps> = ({ leadId, onClose }) => {
  const { getRoomForLead, getMessagesForRoom, sendChatMessage } = useAppContext();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = getRoomForLead(leadId);
  const messages = room ? getMessagesForRoom(room.id) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !room) return;

    setIsSending(true);
    try {
      // Cleaner always sends in PT from their panel
      await sendChatMessage(room.id, input, 'cleaner');
      setInput('');
    } finally {
      setIsSending(false);
    }
  };

  // Utility to test the bilingual flow without a separate client app
  const simulateClientMessage = async () => {
    if (!room || isSending) return;
    setIsSending(true);
    const mockMessages = [
      "Hello! I need a deep cleaning this Friday. Are you available?",
      "Can you bring your own cleaning supplies?",
      "How much do you charge for a 3-bedroom house?"
    ];
    const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
    try {
      await sendChatMessage(room.id, randomMsg, 'client');
    } finally {
      setIsSending(false);
    }
  };

  if (!room) return null;

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-scale-in">
      {/* Header */}
      <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
            US
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-tight">Conversa com Cliente</h4>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Tradução Ativa (Gemini)</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={simulateClientMessage}
                className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition"
                title="Simular resposta do cliente americano"
            >
                Simular Cliente
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-20 px-10">
            <div className="text-4xl mb-4">🌎</div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Inicie a conversa agora.<br/>Suas mensagens serão traduzidas para o Inglês automaticamente.
            </p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.senderRole === 'cleaner';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className="max-w-[85%] group">
                <div className={`p-4 rounded-2xl shadow-sm text-sm ${
                  isMe ? 'bg-slate-900 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}>
                  {/* Rule: Professionals see everything in PT */}
                  <p className="font-medium leading-relaxed">
                    {isMe ? msg.messageOriginal : msg.messageTranslated}
                  </p>
                  
                  {/* Technical Metadata (Audit) */}
                  <div className={`mt-2 pt-2 border-t text-[9px] font-bold uppercase tracking-widest opacity-40 flex justify-between gap-4 ${isMe ? 'border-white/10' : 'border-slate-100'}`}>
                    <span>{isMe ? 'Você enviou' : 'Cliente enviou'}</span>
                    <span className="cursor-help" title={`Original: ${msg.messageOriginal}`}>Ver Original</span>
                  </div>
                </div>
                <p className={`text-[9px] mt-1.5 font-black text-slate-400 uppercase tracking-tighter ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100 flex gap-4">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva em Português..."
          className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold focus:border-slate-900 focus:bg-white outline-none transition"
          disabled={isSending}
        />
        <button 
          type="submit"
          disabled={!input.trim() || isSending}
          className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition disabled:opacity-50 shadow-xl shadow-slate-200"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-6 h-6 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default LeadChat;
