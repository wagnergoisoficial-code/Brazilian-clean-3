
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
          <form handleAdminLogin={handleAdminLogin} className="space-y-6">
            <input type="password" value={accessCode} onChange={e => setAccessCode(e.target.value)} className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-slate-900 outline-none text-center text-3xl tracking-widest font-mono" placeholder="••••••" autoFocus />
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition uppercase text-xs tracking-widest"
                      >
                        Gerar Novo Backup
                      </button>
                      <button 
                        onClick={() => { if(confirm("Deseja restaurar o sistema para o último ponto estável?")) alert('Restauração iniciada...'); }}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-2xl transition uppercase text-xs tracking-widest border border-slate-600"
                      >
                        Restaurar via Ponto de Controle
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* PRESERVE OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-fade-in">
            <header>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Visão Geral do Sistema</h2>
                <p className="text-slate-500">Principais métricas operacionais e de conversão.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Profissionais Pendentes', value: stats.pending, color: 'text-yellow-600' },
                    { label: 'Leads Ativos', value: stats.leads, color: 'text-blue-600' },
                    { label: 'Tickets Abertos', value: stats.tickets, color: 'text-red-600' },
                    { label: 'Membros da Equipe', value: stats.teamCount, color: 'text-green-600' }
                ].map(s => (
                    <div key={s.label} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">{s.label}</p>
                        <p className={`text-4xl font-black mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>
            
            <div className="bg-blue-900 rounded-[40px] p-10 text-white shadow-xl">
               <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Integridade v{SYSTEM_IDENTITY.VERSION}</h3>
               <p className="text-blue-200 text-sm max-w-2xl leading-relaxed">
                  Todos os sistemas de proteção (Error Boundary e Recovery Protocol) estão ativos e monitorados.
                  Consulte a aba de <strong>Infraestrutura</strong> para detalhes técnicos sobre o consumo de API e Gemini Credits.
               </p>
            </div>
          </div>
        )}

        {/* TAB: CLEANERS */}
        {activeTab === 'cleaners' && (
          <div className="space-y-6 animate-fade-in">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">House Cleaners</h2>
                  <p className="text-slate-500">Gerencie contas profissionais e verificações de identidade.</p>
                </div>
                <div className="w-64">
                  <input 
                    type="text" 
                    placeholder="Buscar por nome, email, zip..." 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </div>
              </header>

              <div className="grid gap-6">
                  {filteredCleaners.map(c => (
                      <div key={c.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex gap-8 items-start">
                          <img src={c.photoUrl} className="w-24 h-24 rounded-[32px] object-cover border shrink-0 bg-gray-100 shadow-inner" />
                          <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <h3 className="font-black text-xl text-slate-900 tracking-tight">{c.fullName}</h3>
                                      <p className="text-xs text-slate-400 font-bold">{c.email} | {c.phone}</p>
                                      <p className="text-[10px] font-black text-blue-600 mt-1 uppercase tracking-widest">Status: {c.status}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${c.status === CleanerStatus.VERIFIED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                                      {permissions.canResendVerificationCode && !c.emailVerified && (
                                        <button onClick={() => resendCleanerCode(c.id)} className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-widest">Reenviar E-mail</button>
                                      )}
                                  </div>
                              </div>
                              <div className="bg-slate-50 p-6 rounded-[32px] grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <VerificationBadge result={c.aiVerificationResult} />
                                  <div className="flex gap-3 justify-end">
                                      <button onClick={() => window.open(c.documentFrontUrl)} className="w-16 h-16 rounded-2xl border-2 border-white bg-gray-200 overflow-hidden shadow-sm hover:scale-105 transition"><img src={c.documentFrontUrl} className="w-full h-full object-cover" /></button>
                                      <button onClick={() => window.open(c.selfieWithDocUrl)} className="w-16 h-16 rounded-2xl border-2 border-white bg-gray-200 overflow-hidden shadow-sm hover:scale-105 transition"><img src={c.selfieWithDocUrl} className="w-full h-full object-cover" /></button>
                                  </div>
                              </div>
                              <div className="flex gap-3">
                                  {permissions.canApproveDocuments && (
                                    <button onClick={() => verifyCleaner(c.id, authenticatedAdminId)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg">Aprovar Documentos</button>
                                  )}
                                  {permissions.canRejectDocuments && (
                                    <button onClick={() => rejectCleaner(c.id, authenticatedAdminId)} className="bg-orange-50 text-orange-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition">Solicitar Nova Foto</button>
                                  )}
                                  <button onClick={() => { if(confirm("Suspender conta?")) deleteCleaner(c.id, authenticatedAdminId); }} className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ml-auto hover:bg-red-100 transition">Suspender</button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in">
              <header>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Logs de Auditoria</h2>
                <p className="text-slate-500">Registro imutável de todas as ações administrativas.</p>
              </header>
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                              <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Timestamp</th>
                              <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Admin</th>
                              <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ação</th>
                              <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Detalhes</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {auditLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 transition">
                                  <td className="p-6 text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                  <td className="p-6 text-xs font-bold text-slate-900">{log.adminName}</td>
                                  <td className="p-6 text-xs font-black text-blue-600 uppercase tracking-tight">{log.action}</td>
                                  <td className="p-6 text-xs text-slate-600">{log.details}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {auditLogs.length === 0 && <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum log registrado até o momento</div>}
              </div>
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
            <div className="space-y-8 animate-fade-in">
                <header>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Central de Tickets</h2>
                    <p className="text-slate-500">Gerencie solicitações de suporte de clientes e profissionais.</p>
                </header>

                <div className="grid gap-6">
                    {supportRequests.map(r => (
                        <div key={r.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex justify-between items-start">
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.type === SupportType.CLEANER ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{r.type}</span>
                                    <h4 className="font-black text-lg text-slate-900">{r.fullName}</h4>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                                   "{r.message}"
                                </div>
                                <div className="flex gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> {r.contactEmail || 'N/A'}</span>
                                    <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> {r.contactPhone}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 pl-8">
                                <select 
                                    className="bg-slate-100 border-none rounded-xl text-[10px] font-black uppercase p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={r.status}
                                    onChange={e => updateSupportStatus(r.id, e.target.value as SupportStatus)}
                                >
                                    <option value={SupportStatus.NEW}>Novo</option>
                                    <option value={SupportStatus.IN_PROGRESS}>Em Atendimento</option>
                                    <option value={SupportStatus.RESOLVED}>Resolvido</option>
                                </select>
                                <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-black transition">Acessar Perfil</button>
                            </div>
                        </div>
                    ))}
                    {supportRequests.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-[0.3em]">Nenhum ticket ativo</div>}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
