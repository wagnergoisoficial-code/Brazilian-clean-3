
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  CleanerStatus, SupportStatus, SupportType, 
  AiVerificationResult, PortfolioItem, AdminRole, AdminPermissions, TeamMember, AuditLog
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

const AdminDashboard: React.FC = () => {
  const context = useAppContext();
  const { 
    cleaners, leads, supportRequests, teamMembers, teamInvites, auditLogs, 
    verifyCleaner, rejectCleaner, deleteCleaner, updateSupportStatus, 
    updatePortfolioStatus, inviteTeamMember, updateTeamMemberStatus, removeTeamMember,
    resendCleanerCode, updateCleanerProfile
  } = context;

  const [authenticatedAdminId, setAuthenticatedAdminId] = useState<string | null>(localStorage.getItem('bc_auth_admin_id'));
  const [accessCode, setAccessCode] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'cleaners' | 'leads' | 'support' | 'team' | 'logs' | 'settings'>('overview');

  const currentAdmin = teamMembers.find(m => m.id === authenticatedAdminId);
  const permissions = currentAdmin?.permissions || {
    canApproveDocuments: false, canRejectDocuments: false, canViewPII: false,
    canResetPassword: false, canResendVerificationCode: false, canViewLeads: false,
    canManageTeam: false, canViewAuditLogs: false
  };

  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', role: AdminRole.SUPPORT });
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
      alert('Access Denied');
    }
  };

  if (!authenticatedAdminId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center animate-scale-in">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Admin Terminal</h2>
          <p className="text-slate-500 text-sm mb-8">Enter authorization code to proceed</p>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <input type="password" value={accessCode} onChange={e => setAccessCode(e.target.value)} className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-slate-900 outline-none text-center text-3xl tracking-widest font-mono" placeholder="••••••" autoFocus />
            <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition">Verify Identity</button>
          </form>
          <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">Safe Environment v{SYSTEM_IDENTITY.VERSION}</p>
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
      <aside className="w-72 bg-slate-900 text-white flex flex-col sticky top-0 h-screen shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-8 border-b border-slate-800">
            <h1 className="font-black text-xl tracking-tighter">CONTROLE <span className="text-blue-500 text-xs">v{SYSTEM_IDENTITY.VERSION}</span></h1>
            <p className="text-[10px] text-slate-500 font-bold mt-1">{currentAdmin?.fullName} ({currentAdmin?.role})</p>
        </div>
        <nav className="flex-1 p-6 space-y-1">
            {[
                { id: 'overview', label: 'Dashboard', icon: '📊' },
                { id: 'cleaners', label: 'House Cleaners', icon: '🧹', badge: stats.pending },
                { id: 'leads', label: 'Marketplace Leads', icon: '⚡', badge: stats.leads, show: permissions.canViewLeads },
                { id: 'support', label: 'Support & Tools', icon: '🎧', badge: stats.tickets },
                { id: 'team', label: 'Equipe', icon: '👥', show: permissions.canManageTeam },
                { id: 'logs', label: 'Audit Logs', icon: '📜', show: permissions.canViewAuditLogs },
                { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].filter(t => t.show !== false).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <span className="flex items-center gap-3"><span>{tab.icon}</span> {tab.label}</span>
                    {tab.badge ? <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-slate-800 mt-auto">
            <button onClick={() => { localStorage.removeItem('bc_auth_admin_id'); window.location.reload(); }} className="w-full text-xs font-bold text-slate-500 hover:text-red-400 transition flex items-center gap-2">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto bg-slate-50">
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-fade-in">
            <header>
                <h2 className="text-3xl font-black text-slate-900">Governance Console</h2>
                <p className="text-slate-500">Real-time platform overview and security status.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Pending Apps', value: stats.pending, color: 'text-yellow-600' },
                    { label: 'Active Leads', value: stats.leads, color: 'text-blue-600' },
                    { label: 'Open Tickets', value: stats.tickets, color: 'text-red-600' },
                    { label: 'Team Members', value: stats.teamCount, color: 'text-green-600' }
                ].map(s => (
                    <div key={s.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-4xl font-black mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'cleaners' && (
          <div className="space-y-6 animate-fade-in">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">House Cleaners</h2>
                  <p className="text-slate-500">Manage professional accounts and verifications.</p>
                </div>
                <div className="w-64">
                  <input 
                    type="text" 
                    placeholder="Search by name, email, zip..." 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </div>
              </header>

              <div className="grid gap-6">
                  {filteredCleaners.map(c => (
                      <div key={c.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-6 items-start">
                          <img src={c.photoUrl} className="w-20 h-20 rounded-2xl object-cover border shrink-0 bg-gray-100" />
                          <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <h3 className="font-bold text-lg">{c.fullName}</h3>
                                      <p className="text-xs text-slate-400">{c.email} | {c.phone}</p>
                                      <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase">Step: {c.status}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${c.status === CleanerStatus.VERIFIED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                                      {permissions.canResendVerificationCode && !c.emailVerified && (
                                        <button onClick={() => resendCleanerCode(c.id)} className="text-[9px] font-black text-blue-600 hover:underline">Resend Verification Email</button>
                                      )}
                                  </div>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-4">
                                  <VerificationBadge result={c.aiVerificationResult} />
                                  <div className="flex gap-2">
                                      <button onClick={() => window.open(c.documentFrontUrl)} className="w-12 h-12 rounded-lg border bg-gray-200 overflow-hidden"><img src={c.documentFrontUrl} className="w-full h-full object-cover" /></button>
                                      <button onClick={() => window.open(c.selfieWithDocUrl)} className="w-12 h-12 rounded-lg border bg-gray-200 overflow-hidden"><img src={c.selfieWithDocUrl} className="w-full h-full object-cover" /></button>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  {permissions.canApproveDocuments && (
                                    <button onClick={() => verifyCleaner(c.id, authenticatedAdminId)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-green-700 transition">Approve Documents</button>
                                  )}
                                  {permissions.canRejectDocuments && (
                                    <button onClick={() => rejectCleaner(c.id, authenticatedAdminId)} className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-orange-100 transition">Request Resubmission</button>
                                  )}
                                  {permissions.canResetPassword && (
                                    <button onClick={() => alert('Password reset link sent!')} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold">Reset Password</button>
                                  )}
                                  <button onClick={() => { if(confirm("Suspend account?")) deleteCleaner(c.id, authenticatedAdminId); }} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-bold ml-auto">Suspend</button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-8 animate-fade-in">
              <header className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">Equipe</h2>
                    <p className="text-slate-500">Manage internal staff and permissions.</p>
                  </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
                      <h3 className="font-bold text-lg mb-6">Invite New Member</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
                              <input className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500" value={inviteForm.fullName} onChange={e => setInviteForm({...inviteForm, fullName: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400">Email Address</label>
                              <input className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[10px] font-black uppercase text-slate-400">Role</label>
                              <select className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500" value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value as AdminRole})}>
                                  <option value={AdminRole.SUPPORT}>Support</option>
                                  <option value={AdminRole.ADMIN}>Administrator</option>
                                  <option value={AdminRole.AUDITOR}>Auditor</option>
                              </select>
                          </div>
                          <button onClick={() => inviteTeamMember({ ...inviteForm, permissions: { canApproveDocuments: true, canRejectDocuments: true, canViewPII: false, canResetPassword: true, canResendVerificationCode: true, canViewLeads: true, canManageTeam: false, canViewAuditLogs: false } }, authenticatedAdminId)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest mt-4">Send Invite</button>
                      </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                      <h3 className="font-bold text-lg">Active Team</h3>
                      {teamMembers.map(m => (
                          <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">{m.fullName[0]}</div>
                                  <div>
                                      <p className="font-bold">{m.fullName} {m.id === authenticatedAdminId && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded ml-2">YOU</span>}</p>
                                      <p className="text-xs text-slate-400">{m.email} • {m.role}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.status}</span>
                                  {m.role !== AdminRole.ADMIN_MASTER && (
                                    <button onClick={() => updateTeamMemberStatus(m.id, m.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE', authenticatedAdminId)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                      {m.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                                    </button>
                                  )}
                              </div>
                          </div>
                      ))}
                      
                      <h3 className="font-bold text-lg mt-10">Pending Invites</h3>
                      {teamInvites.filter(i => i.status === 'PENDING').map(i => (
                          <div key={i.id} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between items-center opacity-70 italic">
                              <div>
                                  <p className="font-bold">{i.fullName}</p>
                                  <p className="text-xs text-slate-400">{i.email} • {i.role}</p>
                              </div>
                              <span className="text-[10px] font-black uppercase bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pending Invite</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in">
              <header>
                <h2 className="text-3xl font-black text-slate-900">Audit Logs</h2>
                <p className="text-slate-500">Immutable record of all administrative actions.</p>
              </header>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                              <th className="p-4 text-[10px] font-black uppercase text-slate-400">Timestamp</th>
                              <th className="p-4 text-[10px] font-black uppercase text-slate-400">Admin</th>
                              <th className="p-4 text-[10px] font-black uppercase text-slate-400">Action</th>
                              <th className="p-4 text-[10px] font-black uppercase text-slate-400">Details</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {auditLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 transition">
                                  <td className="p-4 text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                  <td className="p-4 text-xs font-bold text-slate-900">{log.adminName}</td>
                                  <td className="p-4 text-xs font-black text-blue-600">{log.action}</td>
                                  <td className="p-4 text-xs text-slate-600">{log.details}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {auditLogs.length === 0 && <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No logs recorded yet</div>}
              </div>
          </div>
        )}

        {activeTab === 'support' && (
            <div className="space-y-8 animate-fade-in">
                <header>
                    <h2 className="text-3xl font-black text-slate-900">Support Panel</h2>
                    <p className="text-slate-500">Manage support requests and access resolution tools.</p>
                </header>

                <div className="grid gap-6">
                    {supportRequests.map(r => (
                        <div key={r.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-start">
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${r.type === SupportType.CLEANER ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.type}</span>
                                    <h4 className="font-bold text-lg">{r.fullName}</h4>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">"{r.message}"</p>
                                <div className="flex gap-4 text-xs font-bold text-slate-400">
                                    <span>📧 {r.contactEmail || 'N/A'}</span>
                                    <span>📱 {r.contactPhone}</span>
                                    {r.whatsapp && <span className="text-green-600">💬 WA: {r.whatsapp}</span>}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <select 
                                    className="bg-slate-50 border-none rounded-xl text-xs font-bold p-2 outline-none"
                                    value={r.status}
                                    onChange={e => updateSupportStatus(r.id, e.target.value as SupportStatus)}
                                >
                                    <option value={SupportStatus.NEW}>New</option>
                                    <option value={SupportStatus.IN_PROGRESS}>In Progress</option>
                                    <option value={SupportStatus.RESOLVED}>Resolved</option>
                                </select>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">Open User Account</button>
                            </div>
                        </div>
                    ))}
                    {supportRequests.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase text-xs">No active tickets</div>}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
