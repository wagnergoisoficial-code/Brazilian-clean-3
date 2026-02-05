
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, Lead } from '../types';
import { useNavigate } from 'react-router-dom';
import LeadChat from '../components/LeadChat';
import CleanerProfileTab from '../components/dashboard/CleanerProfileTab';
import FinancialsTab from '../components/dashboard/FinancialsTab';
import SettingsTab from '../components/dashboard/SettingsTab';


type DashboardTab = 'overview' | 'leads' | 'my_jobs' | 'profile' | 'financials' | 'settings';

// FIX: Define a consistent type for tab configurations to resolve type errors.
// This ensures that the 'badge' property is recognized as optional on all tab objects.
interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: string;
  badge?: number;
}

const AvailabilityToggle: React.FC<{ isAvailable: boolean; onToggle: () => void }> = ({ isAvailable, onToggle }) => {
  return (
      <div className="flex items-center gap-4 bg-white p-3 pr-5 rounded-full shadow-md border border-slate-100">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isAvailable ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              {isAvailable ? '⚡' : '🌙'}
          </div>
          <div>
              <p className="font-black text-xs uppercase tracking-widest text-slate-900">
                  {isAvailable ? 'Disponível para Leads' : 'Indisponível'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                  {isAvailable ? 'Você está na fila para receber novos contatos.' : 'Você não receberá novos contatos.'}
              </p>
          </div>
          <button onClick={onToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ml-auto ${isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
      </div>
  );
};

const LeadCard: React.FC<{ lead: Lead; onAccept: (id: string) => void; myProfileId: string; onOpenChat: (id: string) => void; openChatLeadId: string | null; serviceMap: Record<string,string> }> = ({ lead, onAccept, myProfileId, onOpenChat, openChatLeadId, serviceMap }) => {
  const [showNotes, setShowNotes] = useState(false);
  const { updateLead } = useAppContext();
  const [notes, setNotes] = useState(lead.internalNotes || '');

  const handleSaveNotes = () => {
    updateLead(lead.id, { internalNotes: notes });
    setShowNotes(false);
  }

  return (
     <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-8 group hover:shadow-xl transition-all duration-500 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{serviceMap[lead.serviceType.toLowerCase().replace(/ /g, '_')] || lead.serviceType}</span>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">ZIP {lead.zipCode}</span>
                    {lead.context?.origin && <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{lead.context.origin}</span>}
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-1">{lead.clientName}</h4>
                <p className="text-slate-500 text-sm font-medium">Ambiente: {lead.bedrooms} quartos / {lead.bathrooms} banheiros</p>
                <p className="text-slate-400 text-xs mt-2 italic flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Data sugerida: {lead.date}
                </p>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {lead.status === 'OPEN' ? (
                    <button onClick={() => onAccept(lead.id)} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-lg">
                        Liberar Contato e Abrir Chat
                    </button>
                ) : (
                    <>
                        <a href={`tel:${lead.clientPhone}`} className="flex-1 md:flex-none bg-slate-100 text-slate-900 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all text-center">Ligar</a>
                        <button onClick={() => onOpenChat(lead.id)} className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${openChatLeadId === lead.id ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white hover:bg-slate-900'}`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            {openChatLeadId === lead.id ? 'Fechar Chat' : 'Abrir Chat'}
                        </button>
                        <button onClick={() => setShowNotes(!showNotes)} className="flex-1 md:flex-none bg-slate-100/50 text-slate-400 px-4 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all text-center" title="Notas Internas">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                        </button>
                    </>
                )}
            </div>
        </div>

        {showNotes && (
          <div className="border-t border-slate-100 pt-6 space-y-4 animate-fade-in">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas Internas (visível apenas para você)</label>
             <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm" placeholder="Ex: Cliente prefere produtos sem cheiro..."></textarea>
             <button onClick={handleSaveNotes} className="bg-slate-800 text-white px-6 py-2 rounded-lg text-xs font-bold">Salvar Nota</button>
          </div>
        )}
        
        {openChatLeadId === lead.id && (
          <div className="border-t border-slate-100 pt-8 animate-fade-in-up">
            <LeadChat leadId={lead.id} onClose={() => onOpenChat('')} />
          </div>
        )}
    </div>
  );
};


const CleanerDashboard: React.FC = () => {
  const { cleaners, authenticatedCleanerId, logout, leads, acceptLead, toggleAvailability, SERVICE_UI_MAP_EN, updateLead } = useAppContext();
  const navigate = useNavigate();
  const myProfile = cleaners.find(c => c.id === authenticatedCleanerId);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [openChatLeadId, setOpenChatLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticatedCleanerId) navigate('/professional');
  }, [authenticatedCleanerId, navigate]);

  if (!myProfile) return null;

  const isVerified = myProfile.status === CleanerStatus.ACTIVE;
  const leadsInArea = isVerified ? leads.filter(l => l.status === 'OPEN' && l.broadcastToIds?.includes(myProfile.id)) : [];
  const myAcceptedLeads = leads.filter(l => l.acceptedByCleanerId === myProfile.id);

  const TABS_CONFIG: Record<DashboardTab, TabConfig> = {
    overview: { id: 'overview', label: 'Início', icon: '📊' },
    leads: { id: 'leads', label: 'Novos Leads', icon: '⚡', badge: leadsInArea.length > 0 ? leadsInArea.length : undefined },
    my_jobs: { id: 'my_jobs', label: 'Meus Contatos', icon: '📩', badge: myAcceptedLeads.filter(l => l.status === 'ASSIGNED').length > 0 ? myAcceptedLeads.filter(l => l.status === 'ASSIGNED').length : undefined },
    financials: { id: 'financials', label: 'Financeiro', icon: '💰' },
    profile: { id: 'profile', label: 'Meu Perfil', icon: '👤' },
    settings: { id: 'settings', label: 'Configurações', icon: '⚙️' },
  };
  
  const handleAcceptLead = (leadId: string) => {
    acceptLead(leadId, myProfile.id);
    setOpenChatLeadId(leadId);
    setActiveTab('my_jobs');
  };

  const handleOpenChat = (leadId: string) => {
    setOpenChatLeadId(prev => prev === leadId ? null : leadId);
  }

  const renderContent = () => {
    switch (activeTab) {
        case 'overview':
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 group hover:border-emerald-500 transition-colors">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads em sua Área</span>
                        <p className="text-4xl font-black mt-1 text-emerald-600">{leadsInArea.length}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 group hover:border-blue-500 transition-colors">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contatos Ativos</span>
                        <p className="text-4xl font-black mt-1 text-blue-600">{myAcceptedLeads.filter(l => l.status === 'ASSIGNED').length}</p>
                    </div>
                </div>
            );
        case 'leads':
        case 'my_jobs':
            const leadsToShow = activeTab === 'leads' ? leadsInArea : myAcceptedLeads;
            return (
                <div className="grid grid-cols-1 gap-6 animate-fade-in">
                    {leadsToShow.map(lead => (
                        <LeadCard 
                          key={lead.id} 
                          lead={lead} 
                          onAccept={handleAcceptLead} 
                          myProfileId={myProfile.id}
                          onOpenChat={handleOpenChat}
                          openChatLeadId={openChatLeadId}
                          serviceMap={SERVICE_UI_MAP_EN}
                        />
                    ))}
                    {leadsToShow.length === 0 && (
                        <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Nenhum lead encontrado</p>
                        </div>
                    )}
                </div>
            );
        case 'profile':
            return <CleanerProfileTab profile={myProfile} />;
        case 'financials':
            return <FinancialsTab leads={leads} cleanerId={myProfile.id} />;
        case 'settings':
            return <SettingsTab profile={myProfile} />;
        default:
            return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col sticky top-0 h-screen shrink-0 border-r border-slate-800">
          <div className="p-8 border-b border-slate-800">
              <h1 className="font-black text-xl tracking-tighter">Brazilian <span className="text-emerald-500">Pro</span></h1>
          </div>
          <nav className="flex-1 p-6 space-y-1">
              {Object.values(TABS_CONFIG).map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                      <span className="flex items-center gap-3"><span>{tab.icon}</span> {tab.label}</span>
                      {tab.badge != null && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span>}
                  </button>
              ))}
          </nav>
          <div className="p-6 border-t border-slate-800">
              <button onClick={logout} className="w-full text-xs font-bold text-slate-500 hover:text-red-400 flex items-center gap-2">Sair do Painel</button>
          </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                   {TABS_CONFIG[activeTab].label}
                </h2>
                <p className="text-slate-500 font-medium">Acompanhe suas oportunidades e gerencie seu negócio.</p>
            </div>
            {activeTab === 'overview' && (
              <AvailabilityToggle isAvailable={myProfile.isAvailable} onToggle={() => toggleAvailability(myProfile.id)} />
            )}
        </header>

        {renderContent()}

      </main>
    </div>
  );
};

export default CleanerDashboard;
