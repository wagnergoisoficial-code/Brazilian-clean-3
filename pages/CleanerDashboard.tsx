
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, Lead, LeadStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import LeadChat from '../components/LeadChat';

const LeadCard: React.FC<{ lead: Lead; cleanerId: string }> = ({ lead, cleanerId }) => {
  const { unlockLead, quotes, sendQuote, cleaners } = useAppContext();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMsg, setQuoteMsg] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isUnlocked = lead.unlockedBy.includes(cleanerId);
  const myQuote = quotes.find(q => q.leadId === lead.id && q.cleanerId === cleanerId);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    const result = unlockLead(lead.id, cleanerId);
    if (!result.success) alert(result.error);
    setIsUnlocking(false);
  };

  const handleSendQuote = () => {
    if (!quotePrice) return alert('Insira um preço');
    sendQuote({
      leadId: lead.id,
      cleanerId,
      price: parseFloat(quotePrice),
      message: quoteMsg
    });
    setShowQuoteForm(false);
  };

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-8 transition-all hover:shadow-xl hover:border-blue-100 group">
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">{lead.serviceType}</span>
            <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">ZIP {lead.zipCode}</span>
            {isUnlocked && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">DESBLOQUEADO</span>}
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">{isUnlocked ? lead.clientName : 'Cliente Verificado (Oculto)'}</h3>
          <div className="flex gap-6 text-slate-500">
             <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Tamanho</span>
                <span className="text-sm font-bold">{lead.bedrooms}Bds / {lead.bathrooms}Bth</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Agendamento</span>
                <span className="text-sm font-bold">{new Date(lead.date).toLocaleDateString()}</span>
             </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-center">
          {!isUnlocked ? (
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Oportunidade de Trabalho</p>
              <button 
                onClick={handleUnlock} 
                disabled={isUnlocking}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition disabled:opacity-50 shadow-2xl shadow-slate-200 active:scale-95"
              >
                {isUnlocking ? 'Processando...' : `Unlock for $${lead.leadCost}`}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setIsChatOpen(!isChatOpen)} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition">
                {isChatOpen ? 'Fechar Chat' : 'Abrir Chat'}
              </button>
              {!myQuote && (
                <button onClick={() => setShowQuoteForm(true)} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition">
                  Enviar Orçamento
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isUnlocked && isChatOpen && (
        <div className="mt-8 border-t pt-8 animate-fade-in">
          <LeadChat leadId={lead.id} onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      {showQuoteForm && (
        <div className="mt-8 p-8 bg-slate-50 rounded-[32px] border border-slate-200 animate-slide-in-up">
          <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-6">Proposta Comercial</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Preço Final ($)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={quotePrice} 
                onChange={e => setQuotePrice(e.target.value)} 
                className="w-full p-4 rounded-2xl bg-white border-2 border-slate-100 outline-none focus:border-blue-500 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Informativo</label>
              <input 
                type="text" 
                placeholder="Ex: Material incluso, 4 horas de trabalho..." 
                value={quoteMsg} 
                onChange={e => setQuoteMsg(e.target.value)} 
                className="w-full p-4 rounded-2xl bg-white border-2 border-slate-100 outline-none focus:border-blue-500 font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 items-center">
             <button onClick={() => setShowQuoteForm(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancelar</button>
             <button onClick={handleSendQuote} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition">Enviar Orçamento</button>
          </div>
        </div>
      )}

      {myQuote && (
        <div className="mt-6 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex justify-between items-center animate-scale-in">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-lg">💰</div>
            <div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Seu Orçamento Enviado</span>
              <p className="text-xl font-black text-slate-900">${myQuote.price}</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${myQuote.status === 'ACCEPTED' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
            {myQuote.status}
          </div>
        </div>
      )}
    </div>
  );
};

const CleanerDashboard: React.FC = () => {
  const { cleaners, authenticatedCleanerId, leads, isHydrated } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');

  useEffect(() => {
    if (isHydrated && !authenticatedCleanerId) navigate('/professional');
  }, [authenticatedCleanerId, isHydrated, navigate]);

  if (!authenticatedCleanerId) return null;
  const myProfile = cleaners.find(c => c.id === authenticatedCleanerId);
  if (!myProfile) return null;

  const availableLeads = leads.filter(l => 
    (l.status === LeadStatus.WAVE_1 || l.status === LeadStatus.WAVE_2 || l.status === LeadStatus.OPEN) &&
    !l.unlockedBy.includes(authenticatedCleanerId) &&
    (l.broadcastToIds?.includes(authenticatedCleanerId) || l.status === LeadStatus.OPEN)
  );

  const activeLeads = leads.filter(l => l.unlockedBy.includes(authenticatedCleanerId));

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-slate-900 text-white p-6 sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-900 text-xs">PRO</div>
              <h2 className="text-xl font-black tracking-tighter uppercase">Painel Profissional</h2>
           </div>
           <div className="flex items-center gap-8">
              <button onClick={() => navigate('/wallet')} className="text-right group">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-400 transition">Carteira / Saldo</p>
                <p className="text-xl font-black text-white group-hover:scale-110 transition origin-right">${myProfile.balance.toFixed(2)}</p>
              </button>
              <div className="h-8 w-px bg-white/10 hidden md:block"></div>
              <button onClick={() => navigate('/setup-business')} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition group">
                <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
           </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-12">
        
        {/* Pro Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl">🏆</div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nível Pro</p>
                <p className="font-black text-slate-900">{myProfile.level}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl">⚡</div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pontos de Mérito</p>
                <p className="font-black text-slate-900">{myProfile.points}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-xl">⭐</div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Média Avaliação</p>
                <p className="font-black text-slate-900">{myProfile.rating.toFixed(1)} / 5.0</p>
              </div>
           </div>
        </div>

        <div className="flex gap-4 mb-10">
           <button 
             onClick={() => setActiveTab('available')}
             className={`flex-1 py-5 rounded-[28px] font-black uppercase text-[10px] tracking-[0.2em] transition shadow-lg active:scale-95 ${activeTab === 'available' ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
           >
             Trabalhos Próximos ({availableLeads.length})
           </button>
           <button 
             onClick={() => setActiveTab('active')}
             className={`flex-1 py-5 rounded-[28px] font-black uppercase text-[10px] tracking-[0.2em] transition shadow-lg active:scale-95 ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
           >
             Minhas Conversas ({activeLeads.length})
           </button>
        </div>

        <div className="animate-fade-in pb-20">
          {(activeTab === 'available' ? availableLeads : activeLeads).map(l => (
            <LeadCard key={l.id} lead={l} cleanerId={authenticatedCleanerId} />
          ))}
          {(activeTab === 'available' ? availableLeads : activeLeads).length === 0 && (
            <div className="py-24 text-center bg-white rounded-[48px] border-4 border-dashed border-slate-100">
               <div className="text-5xl mb-6">🏜️</div>
               <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Tudo calmo por aqui</p>
               <p className="text-xs text-slate-300 font-medium">Novas oportunidades aparecerão em tempo real.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanerDashboard;
