
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  CleanerStatus, SupportStatus, SupportType, 
  AiVerificationResult, PortfolioItem
} from '../types';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

const VerificationBadge: React.FC<{ result?: AiVerificationResult }> = ({ result }) => {
    if (!result) return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[10px] font-bold uppercase">Aguardando IA...</span>;
    const colors = {
        "LIKELY_VALID": "bg-green-100 text-green-800 border-green-200",
        "NEEDS_MANUAL_REVIEW": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "LIKELY_FRAUD": "bg-red-100 text-red-800 border-red-200"
    };
    const statusColor = colors[result.verification_status] || 'bg-gray-100 text-gray-600 border-gray-200';
    
    return (
        <div className={`border p-2 rounded-lg ${statusColor}`}>
            <div className="flex justify-between items-center mb-1 text-[9px] font-bold uppercase">
                <span>{result.verification_status}</span>
                <span>{Math.round((result.confidence_score || 0) * 100)}%</span>
            </div>
            <p className="text-[9px] leading-tight opacity-80">{result.summary || 'No summary available.'}</p>
        </div>
    );
};

const EmptyState: React.FC<{ title: string; message: string; action?: { label: string; onClick: () => void } }> = ({ title, message, action }) => (
    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300 animate-fade-in">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">{message}</p>
        {action && (
            <button 
                onClick={action.onClick}
                className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-black transition"
            >
                {action.label}
            </button>
        )}
    </div>
);

const AdminDashboard: React.FC = () => {
  const context = useAppContext();
  
  // DEFENSIVE DESTRUCTURING
  const cleaners = context?.cleaners || [];
  const leads = context?.leads || [];
  const supportRequests = context?.supportRequests || [];
  const { verifyCleaner, rejectCleaner, deleteCleaner, deleteLead, updateSupportStatus, updatePortfolioStatus } = context;

  const [accessGranted, setAccessGranted] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'cleaners' | 'leads' | 'support' | 'portfolios' | 'ai' | 'settings'>('overview');

  // AGGREGATE PORTFOLIOS
  // We need to flatten the structure safely
  const allPortfolios = cleaners.flatMap(c => 
    (c.portfolio || []).map(item => ({ ...item, cleanerName: c.fullName, cleanerId: c.id }))
  );
  const pendingPortfolios = allPortfolios.filter(p => p.status === 'PENDING_REVIEW');

  // SAFE STATS CALCULATION
  const stats = {
    pending: cleaners.filter(c => c?.status === CleanerStatus.UNDER_REVIEW).length,
    verified: cleaners.filter(c => c?.status === CleanerStatus.VERIFIED).length,
    leads: leads.filter(l => l?.status === 'OPEN').length,
    tickets: supportRequests.filter(r => r?.status === SupportStatus.NEW).length,
    portfolioReviews: pendingPortfolios.length
  };

  const handleResetData = () => {
      if(window.confirm("ATENÇÃO: Isso apagará todos os dados locais e restaurará os dados de demonstração. Continuar?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center animate-scale-in">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Governança BC</h2>
          <p className="text-slate-500 text-sm mb-8">Digite o código de autorização mestre</p>
          <form onSubmit={(e) => { e.preventDefault(); if(accessCode === 'admin123') setAccessGranted(true); else alert('Acesso Negado'); }} className="space-y-6">
            <input type="password" value={accessCode} onChange={e => setAccessCode(e.target.value)} className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-slate-900 outline-none text-center text-3xl tracking-widest font-mono" placeholder="••••••" autoFocus />
            <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition">Entrar no Terminal</button>
          </form>
          <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">Terminal Seguro v{SYSTEM_IDENTITY.VERSION}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar de Controle */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col sticky top-0 h-screen shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-8 border-b border-slate-800">
            <h1 className="font-black text-xl tracking-tighter">CONTROLE <span className="text-blue-500 text-xs">v{SYSTEM_IDENTITY.VERSION}</span></h1>
        </div>
        <nav className="flex-1 p-6 space-y-2">
            {[
                { id: 'overview', label: 'Dashboard', icon: '📊' },
                { id: 'cleaners', label: 'Profissionais', icon: '🧹', badge: stats.pending },
                { id: 'portfolios', label: 'Portfolios', icon: '📸', badge: stats.portfolioReviews },
                { id: 'leads', label: 'Leads Express', icon: '⚡', badge: stats.leads },
                { id: 'support', label: 'Suporte', icon: '🎧', badge: stats.tickets },
                { id: 'ai', label: 'Luna AI (Logs)', icon: '🤖' },
                { id: 'settings', label: 'Configurações', icon: '⚙️' }
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <span className="flex items-center gap-3"><span>{tab.icon}</span> {tab.label}</span>
                    {tab.badge ? <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-slate-800 mt-auto">
            <button onClick={() => setAccessGranted(false)} className="w-full text-xs font-bold text-slate-500 hover:text-red-400 transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Logoff do Sistema
            </button>
        </div>
      </aside>

      {/* Workspace */}
      <main className="flex-1 p-10 overflow-y-auto bg-slate-50">
        
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-fade-in">
            <header>
                <h2 className="text-3xl font-black text-slate-900">Health Check</h2>
                <p className="text-slate-500">Métricas de governança da plataforma (Environment: {SYSTEM_IDENTITY.IS_STUDIO_MODE ? 'STUDIO' : 'PROD'}).</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Pendentes', value: stats.pending, color: 'text-yellow-600' },
                    { label: 'Portfolios', value: stats.portfolioReviews, color: 'text-purple-600' },
                    { label: 'Leads Ativos', value: stats.leads, color: 'text-blue-600' },
                    { label: 'Suporte', value: stats.tickets, color: 'text-red-600' }
                ].map(s => (
                    <div key={s.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-4xl font-black mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB: CLEANERS */}
        {activeTab === 'cleaners' && (
          <div className="space-y-6 animate-fade-in">
              <header><h2 className="text-3xl font-black text-slate-900">Auditoria de Profissionais</h2></header>
              {cleaners.length === 0 ? (
                  <EmptyState title="Nenhum Profissional" message="A base de dados de profissionais está vazia." action={{ label: "Restaurar Dados Mock", onClick: handleResetData }} />
              ) : (
                <div className="grid gap-6">
                    {cleaners.map(c => {
                        if (!c) return null; 
                        return (
                        <div key={c.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-6 items-start">
                            <img src={c.photoUrl} className="w-20 h-20 rounded-2xl object-cover border shrink-0 bg-gray-100" alt="" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/100')} />
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{c.fullName}</h3>
                                        <p className="text-xs text-slate-400">ID: {c.id} | Inscrito em {c.joinedDate}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : c.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4">
                                    <VerificationBadge result={c.aiVerificationResult} />
                                    <div className="flex gap-2">
                                        {c.documentUrl && <button onClick={() => window.open(c.documentUrl)} className="w-12 h-12 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-gray-200"><img src={c.documentUrl} className="w-full h-full object-cover" alt="ID" /></button>}
                                        {c.selfieUrl && <button onClick={() => window.open(c.selfieUrl)} className="w-12 h-12 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-gray-200"><img src={c.selfieUrl} className="w-full h-full object-cover" alt="Selfie" /></button>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {c.status === 'UNDER_REVIEW' && <button onClick={() => verifyCleaner(c.id)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-green-700 transition">Aprovar</button>}
                                    <button onClick={() => rejectCleaner(c.id)} className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-orange-100 transition">Reprovar</button>
                                    <button onClick={() => {if(window.confirm("Deseja deletar permanentemente?")) deleteCleaner(c.id);}} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-bold ml-auto hover:bg-red-100 transition">Deletar</button>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
              )}
          </div>
        )}

        {/* TAB: PORTFOLIOS */}
        {activeTab === 'portfolios' && (
            <div className="space-y-6 animate-fade-in">
                <header><h2 className="text-3xl font-black text-slate-900">Revisão de Portfolios</h2></header>
                {pendingPortfolios.length === 0 ? (
                    <EmptyState title="Tudo Aprovado" message="Não há novas fotos de Antes & Depois para revisar no momento." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pendingPortfolios.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-sm">{item.cleanerName}</h4>
                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold uppercase">{item.serviceType}</span>
                                </div>
                                <div className="flex gap-2 mb-4 h-32">
                                    <div className="w-1/2 relative rounded-xl overflow-hidden bg-gray-100">
                                        <span className="absolute top-2 left-2 bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-md">ANTES</span>
                                        <img src={item.beforeImage} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="w-1/2 relative rounded-xl overflow-hidden bg-gray-100">
                                        <span className="absolute top-2 left-2 bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-md">DEPOIS</span>
                                        <img src={item.afterImage} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                {item.description && <p className="text-xs text-gray-500 mb-4 bg-slate-50 p-2 rounded-lg italic">"{item.description}"</p>}
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => updatePortfolioStatus(item.cleanerId, item.id, 'APPROVED')} className="bg-green-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-700">Aprovar</button>
                                    <button onClick={() => updatePortfolioStatus(item.cleanerId, item.id, 'REJECTED', 'Low quality or irrelevant')} className="bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold hover:bg-red-100">Rejeitar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* TAB: LEADS */}
        {activeTab === 'leads' && (
          <div className="space-y-6 animate-fade-in">
              <header><h2 className="text-3xl font-black text-slate-900">Gestão de Leads</h2></header>
              {leads.length === 0 ? (
                  <EmptyState title="Nenhum Lead" message="Não há leads ativos no momento." />
              ) : (
                <div className="grid gap-4">
                    {leads.map(l => (
                        <div key={l.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">⚡</div>
                                <div>
                                    <h4 className="font-bold">{l.serviceType} em {l.zipCode}</h4>
                                    <p className="text-xs text-slate-400">Cliente: {l.clientName} | {l.clientPhone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${l.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{l.status}</span>
                                <button onClick={() => deleteLead(l.id)} className="bg-red-50 text-red-600 p-3 rounded-xl hover:bg-red-100 transition">✕</button>
                            </div>
                        </div>
                    ))}
                </div>
              )}
          </div>
        )}

        {/* TAB: AI / LUNA */}
        {activeTab === 'ai' && (
           <div className="space-y-6 animate-fade-in">
              <header><h2 className="text-3xl font-black text-slate-900">Módulo Luna AI</h2></header>
              <div className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl flex justify-between items-center">
                  <div>
                      <h3 className="text-xl font-bold mb-1">Status do Modelo: {SYSTEM_IDENTITY.IS_STUDIO_MODE ? 'STUDIO SIMULATION' : 'GEMINI PRODUCTION'}</h3>
                      <p className="text-blue-300 text-sm">Latência média: 1.2s | Respostas bloqueadas: 0</p>
                  </div>
              </div>
           </div>
        )}

         {/* TAB: SETTINGS */}
         {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
                <header><h2 className="text-3xl font-black text-slate-900">Configurações</h2></header>
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold mb-4">Dados & Reset</h3>
                    <button onClick={handleResetData} className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-4 rounded-xl font-bold transition flex items-center gap-2">
                        Factory Reset (Limpar Dados Locais)
                    </button>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;