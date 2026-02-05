
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  CleanerStatus, SupportStatus, SupportType, 
  AiVerificationResult, AdminRole
} from '../types';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';
import { checkSystemHealth, SystemHealth } from '../services/systemGuardianService';

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
            <p className="text-[9px] leading-tight opacity-80">{result.summary || 'Sem resumo disponível.'}</p>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
  const context = useAppContext();
  const { 
    cleaners, leads, supportRequests, teamMembers, auditLogs, 
    verifyCleaner, rejectCleaner, deleteCleaner, updateSupportStatus
  } = context;

  const [authenticatedAdminId, setAuthenticatedAdminId] = useState<string | null>(localStorage.getItem('bc_auth_admin_id'));
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cleaners' | 'leads' | 'support' | 'team' | 'infra' | 'logs'>('overview');
  const [sysHealth, setSysHealth] = useState<SystemHealth>(checkSystemHealth());

  useEffect(() => {
    const interval = setInterval(() => setSysHealth(checkSystemHealth()), 5000);
    return () => clearInterval(interval);
  }, []);

  const currentAdmin = teamMembers.find(m => m.id === authenticatedAdminId);
  const [userSearch, setUserSearch] = useState('');

  const stats = {
    pending: cleaners.filter(c => c?.status === CleanerStatus.UNDER_REVIEW).length,
    leads: leads.filter(l => l?.status === 'OPEN').length,
    tickets: supportRequests.filter(r => r?.status === SupportStatus.NEW).length,
    teamCount: teamMembers.length
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === 'admin123') {
      const master = teamMembers.find(m => m.role === AdminRole.ADMIN_MASTER);
      if (master) {
        setAuthenticatedAdminId(master.id);
        localStorage.setItem('bc_auth_admin_id', master.id);
      }
    } else {
      alert('Acesso Negado');
    }
  };

  if (!authenticatedAdminId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center animate-scale-in">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Terminal Admin</h2>
          <p className="text-slate-500 text-sm mb-8">Digite o código de autorização</p>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="relative">
                <input 
                  type={showCode ? "text" : "password"} 
                  value={accessCode} 
                  onChange={e => setAccessCode(e.target.value)} 
                  className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-slate-900 outline-none text-center text-3xl tracking-widest font-mono pr-12" 
                  placeholder="••••••" 
                  autoFocus 
                />
                <button 
                  type="button" 
                  onClick={() => setShowCode(!showCode)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-2"
                >
                    {showCode ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                </button>
            </div>
            <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition">Verificar Identidade</button>
          </form>
          <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ambiente Seguro v{SYSTEM_IDENTITY.VERSION}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="w-72 bg-slate-900 text-white flex flex-col sticky top-0 h-screen shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-8 border-b border-slate-800">
            <h1 className="font-black text-xl tracking-tighter">GOVERNANÇA <span className="text-blue-500 text-[10px]">v{SYSTEM_IDENTITY.VERSION}</span></h1>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{currentAdmin?.fullName}</p>
        </div>
        <nav className="flex-1 p-6 space-y-1">
            {[
                { id: 'overview', label: 'Painel Geral', icon: '📊' },
                { id: 'cleaners', label: 'House Cleaners', icon: '🧹', badge: stats.pending },
                { id: 'leads', label: 'Marketplace Leads', icon: '⚡', badge: stats.leads },
                { id: 'infra', label: 'Infraestrutura', icon: '🏗️', color: 'text-blue-400' },
                { id: 'support', label: 'Suporte & Tickets', icon: '🎧', badge: stats.tickets },
                { id: 'team', label: 'Equipe Admin', icon: '👥' },
                { id: 'logs', label: 'Logs de Auditoria', icon: '📜' }
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <span className="flex items-center gap-3"><span>{tab.icon}</span> {tab.label}</span>
                    {tab.badge ? <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
                </button>
            ))}
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto bg-slate-50">
        {activeTab === 'infra' && (
          <div className="space-y-8 animate-fade-in">
             <header><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Infraestrutura</h2></header>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                   <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Créditos IA</span></div>
                   <div className="text-3xl font-black text-slate-900">{sysHealth.metrics.aiCredits.used} / {sysHealth.metrics.aiCredits.total}</div>
                </div>
             </div>
          </div>
        )}
        
        {activeTab === 'cleaners' && (
           <div className="space-y-6 animate-fade-in">
              <header><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">House Cleaners</h2></header>
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                       <tr>
                          <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Profissional</th>
                          <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                          <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">IA</th>
                          <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {cleaners.filter(c => c.fullName.toLowerCase().includes(userSearch.toLowerCase())).map(c => (
                          <tr key={c.id}>
                             <td className="p-6"><p className="font-bold text-slate-900 text-sm">{c.fullName}</p></td>
                             <td className="p-6">{c.status}</td>
                             <td className="p-6"><VerificationBadge result={c.aiVerificationResult} /></td>
                             <td className="p-6">
                                <div className="flex gap-2">
                                    {c.status !== 'VERIFIED' && <button onClick={() => verifyCleaner(c.id, authenticatedAdminId!)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Aprovar</button>}
                                    {c.status !== 'REJECTED' && <button onClick={() => rejectCleaner(c.id, authenticatedAdminId!)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold">Reprovar</button>}
                                    <button onClick={() => deleteCleaner(c.id, authenticatedAdminId!)} className="text-slate-400 hover:text-red-500">🗑</button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};
export default AdminDashboard;
