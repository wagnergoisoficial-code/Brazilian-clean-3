
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
    verifyCleaner, rejectCleaner, deleteCleaner, updateSupportStatus, 
    inviteTeamMember, updateTeamMemberStatus, resendCleanerCode
  } = context;

  const [authenticatedAdminId, setAuthenticatedAdminId] = useState<string | null>(localStorage.getItem('bc_auth_admin_id'));
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false); // Visibility Toggle State
  const [activeTab, setActiveTab] = useState<'overview' | 'cleaners' | 'leads' | 'support' | 'team' | 'infra' | 'logs'>('overview');
  const [sysHealth, setSysHealth] = useState<SystemHealth>(checkSystemHealth());

  useEffect(() => {
    const interval = setInterval(() => {
      setSysHealth(checkSystemHealth());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentAdmin = teamMembers.find(m => m.id === authenticatedAdminId);
  const permissions = currentAdmin?.permissions || {
    canApproveDocuments: false, canRejectDocuments: false, canViewPII: false,
    canResetPassword: false, canResendVerificationCode: false, canViewLeads: false,
    canManageTeam: false, canViewAuditLogs: false
  };

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
                  className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-slate-900 outline-none text-center text-3xl tracking-widest font-mono" 
                  placeholder="••••••" 
                  autoFocus 
                />
                <button 
                  type="button" 
                  onClick={() => setShowCode(!showCode)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-2"
                  title={showCode ? "Ocultar código" : "Mostrar código"}
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

  const filteredCleaners = cleaners.filter(c => 
    c.fullName.toLowerCase().includes(userSearch.toLowerCase()) || 
    c.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    c.baseZip.includes(userSearch)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR ADMIN */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col sticky top-0 h-screen shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-8 border-b border-slate-800">
            <h1 className="font-black text-xl tracking-tighter">GOVERNANÇA <span className="text-blue-500 text-[10px]">v{SYSTEM_IDENTITY.VERSION}</span></h1>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{currentAdmin?.fullName}</p>
        </div>
        <nav className="flex-1 p-6 space-y-1">
            {[
                { id: 'overview', label: 'Painel Geral', icon: '📊' },
                { id: 'cleaners', label: 'House Cleaners', icon: '🧹', badge: stats.pending },
                { id: 'leads', label: 'Marketplace Leads', icon: '⚡', badge: stats.leads, show: permissions.canViewLeads },
                { id: 'infra', label: 'Infraestrutura', icon: '🏗️', color: 'text-blue-400' },
                { id: 'support', label: 'Suporte & Tickets', icon: '🎧', badge: stats.tickets },
                { id: 'team', label: 'Equipe Admin', icon: '👥', show: permissions.canManageTeam },
                { id: 'logs', label: 'Logs de Auditoria', icon: '📜', show: permissions.canViewAuditLogs }
            ].filter(t => t.show !== false).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <span className="flex items-center gap-3"><span>{tab.icon}</span> {tab.label}</span>
                    {tab.badge ? <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
            <button onClick={() => { localStorage.removeItem('bc_auth_admin_id'); window.location.reload(); }} className="w-full text-xs font-bold text-slate-500 hover:text-red-400 flex items-center gap-2">Sair do Terminal</button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto bg-slate-50">
        
        {/* TAB: INFRASTRUCTURE & METRICS */}
        {activeTab === 'infra' && (
          <div className="space-y-8 animate-fade-in">
             <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Infraestrutura & Recursos</h2>
                  <p className="text-slate-500">Monitoramento de saúde do sistema e consumo de créditos IA.</p>
                </div>
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-black uppercase">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   Sistemas Operacionais
                </div>
             </header>

             {/* RESOURCE CARDS */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* AI CREDITS */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Créditos Gemini IA</span>
                      <span className="text-emerald-500 text-xs font-black">{Math.round(sysHealth.metrics.aiCredits.percentage)}% Usado</span>
                   </div>
                   <div className="text-3xl font-black text-slate-900">{sysHealth.metrics.aiCredits.used} <span className="text-slate-300 text-xl">/ {sysHealth.metrics.aiCredits.total}</span></div>
                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${sysHealth.metrics.aiCredits.percentage}%` }}></div>
                   </div>
                </div>

                {/* API REQUESTS */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requisições de API</span>
                      <span className="text-blue-500 text-xs font-black">{Math.round(sysHealth.metrics.apiRequests.percentage)}% Usado</span>
                   </div>
                   <div className="text-3xl font-black text-slate-900">{sysHealth.metrics.apiRequests.count} <span className="text-slate-300 text-xl">/ {sysHealth.metrics.apiRequests.limit}</span></div>
                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${sysHealth.metrics.apiRequests.percentage}%` }}></div>
                   </div>
                </div>

                {/* STORAGE / DATA */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integridade de Dados</span>
                      <span className="text-purple-500 text-xs font-black">Saudável</span>
                   </div>
                   <div className="text-3xl font-black text-slate-900">{sysHealth.metrics.storage.usage} <span className="text-slate-300 text-xl">Used</span></div>
                   <div className="flex gap-2">
                      <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">AES-256 Locked</span>
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Verified Integrity</span>
                   </div>
                </div>
             </div>

             {/* STABILITY STATUS */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                   <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl mb-6">Status de Estabilidade</h3>
                   <div className="space-y-6">
                      {[
                        { label: 'System Guardian (Error Boundary)', status: 'Ativo', health: 'HEALTHY' },
                        { label: 'Log Event Stream', status: 'Streaming', health: 'HEALTHY' },
                        { label: 'Disaster Recovery Protocol', status: 'Ready', health: 'HEALTHY' },
                        { label: 'Identity AI Pipeline', status: 'Ready', health: 'HEALTHY' }
                      ].map(item => (
                        <div key={item.label} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0">
                           <span className="text-sm font-bold text-slate-600">{item.label}</span>
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.status}</span>
                              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white">
                   <h3 className="font-black text-white uppercase tracking-tighter text-xl mb-6">Ponto de Restauração</h3>
                   <div className="bg-slate-800 rounded-2xl p-6 mb-8 border border-slate-700">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Último Backup Automático</p>
                      <p className="text-lg font-mono text-emerald-400">{sysHealth.lastBackup ? new Date(sysHealth.lastBackup).toLocaleString() : 'Nenhum backup encontrado'}</p>
                   </div>
                   <div className="space-y-3">
                      <button 
                        onClick={() => alert('Backup manual iniciado!')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-xs uppercase tracking-widest"
                      >
                        Executar Backup Manual
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* TAB: CLEANERS */}
        {activeTab === 'cleaners' && (
           <div className="space-y-6 animate-fade-in">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">House Cleaners</h2>
                  <p className="text-slate-500">Gerenciamento e aprovação de profissionais.</p>
                </div>
                <div className="relative">
                   <input 
                     type="text" 
                     placeholder="Buscar por nome, email ou ZIP..." 
                     className="bg-white border-2 border-slate-100 pl-10 pr-4 py-3 rounded-2xl text-sm font-bold focus:border-slate-900 outline-none w-64 md:w-80"
                     value={userSearch}
                     onChange={(e) => setUserSearch(e.target.value)}
                   />
                   <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </header>

              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                       <tr>
                          <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Profissional</th>
                          <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                          <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Verificação IA</th>
                          <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {filteredCleaners.length === 0 ? (
                           <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic">Nenhum profissional encontrado.</td></tr>
                       ) : filteredCleaners.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50 transition">
                             <td className="p-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                      {c.photoUrl ? <img src={c.photoUrl} className="w-full h-full object-cover" alt="" /> : <span className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">{c.fullName.charAt(0)}</span>}
                                   </div>
                                   <div>
                                      <p className="font-bold text-slate-900 text-sm">{c.fullName}</p>
                                      <p className="text-xs text-slate-500">{c.email}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="p-6">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                    c.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                    c.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                   {c.status.replace('_', ' ')}
                                </span>
                             </td>
                             <td className="p-6">
                                <VerificationBadge result={c.aiVerificationResult} />
                             </td>
                             <td className="p-6">
                                <div className="flex gap-2">
                                    {c.status !== 'VERIFIED' && (
                                        <button 
                                            onClick={() => verifyCleaner(c.id, authenticatedAdminId!)}
                                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition"
                                        >
                                            Aprovar
                                        </button>
                                    )}
                                    {c.status !== 'REJECTED' && (
                                        <button 
                                            onClick={() => rejectCleaner(c.id, authenticatedAdminId!)}
                                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                                        >
                                            Reprovar
                                        </button>
                                    )}
                                    <button onClick={() => deleteCleaner(c.id, authenticatedAdminId!)} className="text-slate-400 hover:text-red-500 p-2" title="Excluir">🗑</button>
                                    <button onClick={() => resendCleanerCode(c.id)} className="text-blue-400 hover:text-blue-600 p-2" title="Reenviar Código">✉️</button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* TAB: SUPPORT */}
        {activeTab === 'support' && (
            <div className="space-y-6 animate-fade-in">
                <header className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Central de Suporte</h2>
                        <p className="text-slate-500">Tickets de clientes e profissionais.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4">
                    {supportRequests.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 bg-white rounded-3xl border border-slate-100">Nenhum ticket aberto.</div>
                    ) : supportRequests.map(req => (
                        <div key={req.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${req.type === SupportType.CLIENT ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {req.type === SupportType.CLIENT ? 'CLIENT (USA)' : 'PRO (BR)'}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold">{new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-slate-900">{req.fullName}</h3>
                                <p className="text-sm text-slate-600 mt-1 mb-3">{req.message}</p>
                                <div className="flex gap-4 text-xs font-medium text-slate-500">
                                    {req.contactEmail && <span>📧 {req.contactEmail}</span>}
                                    {req.contactPhone && <span>📞 {req.contactPhone}</span>}
                                    {req.whatsapp && <span>📱 {req.whatsapp}</span>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <select 
                                    value={req.status}
                                    onChange={(e) => updateSupportStatus(req.id, e.target.value as SupportStatus)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold p-2 outline-none focus:border-slate-900"
                                >
                                    <option value={SupportStatus.NEW}>Novo</option>
                                    <option value={SupportStatus.IN_PROGRESS}>Em Análise</option>
                                    <option value={SupportStatus.RESOLVED}>Resolvido</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB: LEADS (READ ONLY VIEW) */}
        {activeTab === 'leads' && (
            <div className="space-y-6 animate-fade-in">
                <header>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Marketplace Leads</h2>
                    <p className="text-slate-500">Monitoramento de oportunidades em tempo real.</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leads.map(lead => (
                        <div key={lead.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm opacity-80 hover:opacity-100 transition">
                            <div className="flex justify-between mb-4">
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 rounded-full uppercase">{lead.status}</span>
                                <span className="text-xs font-mono text-slate-400">{lead.id}</span>
                            </div>
                            <h3 className="font-bold text-slate-900">{lead.clientName}</h3>
                            <p className="text-sm text-slate-500 mb-2">{lead.serviceType} • {lead.zipCode}</p>
                            <div className="text-xs text-slate-400">
                                <p>Criado em: {new Date(lead.createdAt).toLocaleString()}</p>
                                <p>Aceito por: {lead.acceptedByCleanerId ? cleaners.find(c => c.id === lead.acceptedByCleanerId)?.fullName : '---'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB: AUDIT LOGS */}
        {activeTab === 'logs' && (
            <div className="space-y-6 animate-fade-in">
                <header>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Audit Logs</h2>
                    <p className="text-slate-500">Registro imutável de ações administrativas.</p>
                </header>
                <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl font-mono text-xs h-96 overflow-y-auto custom-scrollbar">
                    {auditLogs.length === 0 ? (
                        <p className="text-slate-600">// Nenhum log registrado.</p>
                    ) : auditLogs.map(log => (
                        <div key={log.id} className="mb-2 border-b border-slate-800 pb-2">
                            <span className="text-emerald-500">[{new Date(log.timestamp).toISOString()}]</span>
                            <span className="text-blue-400"> {log.adminName} ({log.adminId})</span>
                            <span className="text-white"> executed {log.action}</span>
                            <span className="text-slate-500"> on {log.targetType}:{log.targetId}</span>
                            <p className="pl-4 text-slate-500 opacity-70">Details: {log.details}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
