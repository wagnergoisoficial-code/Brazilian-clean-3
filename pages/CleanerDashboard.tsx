
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import LeadChat from '../components/LeadChat';

type DashboardTab = 'overview' | 'leads' | 'my_jobs' | 'profile' | 'settings';

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


const CleanerDashboard: React.FC = () => {
  const { cleaners, authenticatedCleanerId, logout, leads, acceptLead, toggleAvailability, SERVICE_UI_MAP_EN } = useAppContext();
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col sticky top-0 h-screen shrink-0 border-r border-slate-800">
          <div className="p-8 border-b border-slate-800">
              <h1 className="font-black text-xl tracking-tighter">Brazilian <span className="text-emerald-500">Pro</span></h1>
          </div>
          <nav className="flex-1 p-6 space-y-1">
              {[
                  { id: 'overview', label: 'Início', icon: '📊' },
                  { id: 'leads', label: 'Novos Leads', icon: '⚡', badge: leadsInArea.length > 0 ? leadsInArea.length : undefined },
                  { id: 'my_jobs', label: 'Meus Contatos', icon: '📩', badge: myAcceptedLeads.length > 0 ? myAcceptedLeads.length : undefined },
                  { id: 'profile', label: 'Meu Perfil', icon: '👤' },
                  { id: 'settings', label: 'Configurações', icon: '⚙️' },
              ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                      <span className="flex items-center gap-3"><span>{tab.icon}</span> {tab.label}</span>
                      {tab.badge && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span>}
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
                    {activeTab === 'overview' ? 'Visão Geral' : activeTab === 'leads' ? 'Leads na Área' : 'Meus Contatos'}
                </h2>
                <p className="text-slate-500 font-medium">Acompanhe suas oportunidades em tempo real.</p>
            </div>
            {activeTab === 'overview' && (
              <AvailabilityToggle isAvailable={myProfile.isAvailable} onToggle={() => toggleAvailability(myProfile.id)} />
            )}
        </header>

        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 group hover:border-emerald-500 transition-colors">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads em sua Área</span>
                    <p className="text-4xl font-black mt-1 text-emerald-600">{leadsInArea.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 group hover:border-blue-500 transition-colors">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contatos Ativos</span>
                    <p className="text-4xl font-black mt-1 text-blue-600">{myAcceptedLeads.length}</p>
                </div>
            </div>
        )}

        {(activeTab === 'leads' || activeTab === 'my_jobs') && (
            <div className="grid grid-cols-1 gap-6 animate-fade-in">
                {(activeTab === 'leads' ? leadsInArea : myAcceptedLeads).map(lead => (
                    <div key={lead.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col gap-8 group hover:shadow-xl transition-all duration-500 overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">{SERVICE_UI_MAP_EN[lead.serviceType.toLowerCase().replace(/ /g, '_')] || lead.serviceType}</span>
                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">ZIP {lead.zipCode}</span>
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
                                    <button 
                                        onClick={() => acceptLead(lead.id, myProfile.id)}
                                        className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
                                    >
                                        Liberar Contato e Abrir Chat
                                    </button>
                                ) : (
                                    <>
                                        <a href={`tel:${lead.clientPhone}`} className="flex-1 md:flex-none bg-slate-100 text-slate-900 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all text-center">
                                            Ligar
                                        </a>
                                        <button 
                                            onClick={() => setOpenChatLeadId(openChatLeadId === lead.id ? null : lead.id)}
                                            className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${openChatLeadId === lead.id ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white hover:bg-slate-900'}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                            {openChatLeadId === lead.id ? 'Fechar Chat' : 'Abrir Chat Bilíngue'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Integrated Chat Panel */}
                        {openChatLeadId === lead.id && (
                          <div className="border-t border-slate-100 pt-8 animate-fade-in-up">
                            <LeadChat leadId={lead.id} onClose={() => setOpenChatLeadId(null)} />
                          </div>
                        )}
                    </div>
                ))}
                {(activeTab === 'leads' ? leadsInArea : myAcceptedLeads).length === 0 && (
                    <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                        <div className="text-4xl mb-4">📭</div>
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Nenhum lead encontrado</p>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default CleanerDashboard;
