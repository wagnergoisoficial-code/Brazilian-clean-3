
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CleanerProfile, CleanerStatus, UserRole, Lead, FeedPost, ClientProfile, 
  SupportRequest, SupportStatus, SupportType, Subscription, SubscriptionPlan, 
  PaymentMethodType, Discount, CleanerLevel, BonusCampaign, PortfolioItem, 
  EmailNotification, AdminRole, TeamMember, TeamInvite, AuditLog, AdminPermissions 
} from '../types';
import { addPoints as serviceAddPoints } from '../services/meritService';
import { canCleanerServeZip } from '../services/locationService';

interface AppContextType {
  cleaners: CleanerProfile[];
  clients: ClientProfile[];
  leads: Lead[];
  feedPosts: FeedPost[];
  supportRequests: SupportRequest[];
  bonusCampaigns: BonusCampaign[];
  teamMembers: TeamMember[];
  teamInvites: TeamInvite[];
  auditLogs: AuditLog[];
  userRole: UserRole;
  authenticatedCleanerId: string | null;
  authenticatedClientId: string | null;
  authenticatedAdminId: string | null;
  pendingClientCode: string | null;
  pendingClientEmail: string | null;
  pendingClientCodeExpires: number | null;
  setUserRole: (role: UserRole) => void;
  registerCleaner: (data: Partial<CleanerProfile>) => Promise<string>;
  loginCleaner: (email: string, password: string) => Promise<CleanerProfile | null>;
  updateCleanerProfile: (id: string, data: Partial<CleanerProfile>) => void;
  verifyCleanerCode: (cleanerId: string, code: string) => { success: boolean; error?: string };
  resendCleanerCode: (cleanerId: string) => Promise<void>;
  resendClientCode: () => Promise<void>;
  registerClient: (client: Partial<ClientProfile>) => void;
  updateClientProfile: (id: string, data: Partial<ClientProfile>) => void;
  logout: () => void;
  verifyCleaner: (id: string, adminId: string) => void;
  rejectCleaner: (id: string, adminId: string) => void;
  deleteCleaner: (id: string, adminId: string) => void;
  activateSubscription: (id: string, subscription: Subscription) => void;
  addCleanerPoints: (cleanerId: string, amount: number, reason: string) => void;
  searchCleaners: (zip: string, serviceKey?: string) => CleanerProfile[];
  createLead: (lead: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => void;
  acceptLead: (leadId: string, cleanerId: string) => void;
  createSupportRequest: (request: Partial<SupportRequest>) => void;
  updateSupportStatus: (id: string, status: SupportStatus) => void;
  addPortfolioItem: (cleanerId: string, item: Omit<PortfolioItem, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updatePortfolioStatus: (cleanerId: string, itemId: string, status: 'APPROVED' | 'REJECTED', note?: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  lastEmail: EmailNotification | null;
  clearLastEmail: () => void;
  // Team Management
  inviteTeamMember: (data: { fullName: string; email: string; role: AdminRole; permissions: AdminPermissions }, adminId: string) => void;
  updateTeamMemberStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED', adminId: string) => void;
  removeTeamMember: (id: string, adminId: string) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const VERIFICATION_TTL = 600000; // 10 minutes

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cleaners, setCleaners] = useState<CleanerProfile[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [bonusCampaigns, setBonusCampaigns] = useState<BonusCampaign[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);
  const [authenticatedCleanerId, setAuthenticatedCleanerId] = useState<string | null>(null);
  const [authenticatedClientId, setAuthenticatedClientId] = useState<string | null>(null);
  const [authenticatedAdminId, setAuthenticatedAdminId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastEmail, setLastEmail] = useState<EmailNotification | null>(null);
  
  const [pendingClientCode, setPendingClientCode] = useState<string | null>(localStorage.getItem('bc_pending_code'));
  const [pendingClientEmail, setPendingClientEmail] = useState<string | null>(localStorage.getItem('bc_pending_email'));
  const [pendingClientCodeExpires, setPendingClientCodeExpires] = useState<number | null>(
    localStorage.getItem('bc_pending_expiry') ? parseInt(localStorage.getItem('bc_pending_expiry')!) : null
  );

  useEffect(() => {
    const safeParse = (key: string, fallback: any) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (e) { return fallback; }
    };
    setCleaners(safeParse('bc_cleaners', []));
    setClients(safeParse('bc_clients', []));
    setLeads(safeParse('bc_leads', []));
    setFeedPosts(safeParse('bc_posts', []));
    setSupportRequests(safeParse('bc_support', []));
    setBonusCampaigns(safeParse('bc_campaigns', []));
    setTeamMembers(safeParse('bc_team', [
      {
        id: 'master_1',
        fullName: 'Admin Master',
        email: 'master@brazilianclean.org',
        role: AdminRole.ADMIN_MASTER,
        status: 'ACTIVE',
        permissions: {
          canApproveDocuments: true,
          canRejectDocuments: true,
          canViewPII: true,
          canResetPassword: true,
          canResendVerificationCode: true,
          canViewLeads: true,
          canManageTeam: true,
          canViewAuditLogs: true,
        }
      }
    ]));
    setTeamInvites(safeParse('bc_invites', []));
    setAuditLogs(safeParse('bc_audit', []));
    setAuthenticatedCleanerId(localStorage.getItem('bc_auth_cleaner_id'));
    setAuthenticatedClientId(localStorage.getItem('bc_auth_client_id'));
    setAuthenticatedAdminId(localStorage.getItem('bc_auth_admin_id'));
  }, []);

  useEffect(() => { localStorage.setItem('bc_cleaners', JSON.stringify(cleaners)); }, [cleaners]);
  useEffect(() => { localStorage.setItem('bc_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('bc_team', JSON.stringify(teamMembers)); }, [teamMembers]);
  useEffect(() => { localStorage.setItem('bc_invites', JSON.stringify(teamInvites)); }, [teamInvites]);
  useEffect(() => { localStorage.setItem('bc_audit', JSON.stringify(auditLogs)); }, [auditLogs]);
  
  useEffect(() => { 
    if(authenticatedAdminId) localStorage.setItem('bc_auth_admin_id', authenticatedAdminId);
    else localStorage.removeItem('bc_auth_admin_id');
  }, [authenticatedAdminId]);

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const registerCleaner = async (data: Partial<CleanerProfile>): Promise<string> => {
    const id = Math.random().toString(36).substr(2, 9);
    const code = await requestVerificationEmail(data.email || '', 'pt');
    const newCleaner: CleanerProfile = {
      id, fullName: data.fullName || '', email: data.email || '', password: data.password || '',
      phone: data.phone || '', city: data.city || '', state: data.state || '', baseZip: data.baseZip || '',
      serviceRadius: 10, zipCodes: [], status: CleanerStatus.EMAIL_PENDING, rating: 0, reviewCount: 0,
      joinedDate: new Date().toISOString(), emailVerified: false, verificationCode: code,
      verificationCodeExpires: Date.now() + VERIFICATION_TTL, points: 0, level: CleanerLevel.BRONZE,
      pointHistory: [], portfolio: [], galleryUrls: [], services: [], companyName: '', isCompany: false,
      yearsExperience: 0, description: '', photoUrl: '', isListed: true, profileCompleted: false
    };
    setCleaners(prev => [...prev, newCleaner]);
    return id;
  };

  const loginCleaner = async (email: string, password: string): Promise<CleanerProfile | null> => {
      const cleaner = cleaners.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
      if (cleaner) {
          setAuthenticatedCleanerId(cleaner.id);
          setUserRole(UserRole.CLEANER);
          return cleaner;
      }
      return null;
  };

  const logout = () => {
    setAuthenticatedCleanerId(null);
    setAuthenticatedClientId(null);
    setAuthenticatedAdminId(null);
    setUserRole(UserRole.CLIENT);
  };

  const inviteTeamMember = (data: { fullName: string; email: string; role: AdminRole; permissions: AdminPermissions }, adminId: string) => {
    const admin = teamMembers.find(m => m.id === adminId);
    const invite: TeamInvite = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      token: Math.random().toString(36).substr(2, 12),
      expiresAt: Date.now() + 86400000,
      status: 'PENDING'
    };
    setTeamInvites(prev => [...prev, invite]);
    addAuditLog({
      adminId,
      adminName: admin?.fullName || 'System',
      action: 'TEAM_INVITE_CREATED',
      details: `Invited ${data.email} as ${data.role}`
    });
    setLastEmail({
      to: data.email,
      subject: 'Invite: Join Brazilian Clean Admin Team',
      body: `Hi ${data.fullName}, you have been invited to join the team. Click the link to set up your account.`,
      actionLink: `/accept-invite?token=${invite.token}`,
      actionText: 'Accept Invite'
    });
  };

  const updateTeamMemberStatus = (id: string, status: 'ACTIVE' | 'SUSPENDED', adminId: string) => {
    const admin = teamMembers.find(m => m.id === adminId);
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    addAuditLog({
      adminId,
      adminName: admin?.fullName || 'System',
      action: 'TEAM_MEMBER_STATUS_UPDATED',
      details: `Updated member ${id} status to ${status}`,
      targetId: id,
      targetType: 'TEAM_MEMBER'
    });
  };

  const removeTeamMember = (id: string, adminId: string) => {
    const admin = teamMembers.find(m => m.id === adminId);
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    addAuditLog({
      adminId,
      adminName: admin?.fullName || 'System',
      action: 'TEAM_MEMBER_REMOVED',
      details: `Removed member ${id}`,
      targetId: id,
      targetType: 'TEAM_MEMBER'
    });
  };

  const verifyCleaner = (id: string, adminId: string) => {
    const admin = teamMembers.find(m => m.id === adminId);
    const cleaner = cleaners.find(c => c.id === id);
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, status: CleanerStatus.VERIFIED } : c));
    addAuditLog({
      adminId,
      adminName: admin?.fullName || 'System',
      action: 'CLEANER_VERIFIED',
      details: `Verified cleaner ${cleaner?.fullName}`,
      targetId: id,
      targetType: 'CLEANER'
    });
  };

  const rejectCleaner = (id: string, adminId: string) => {
    const admin = teamMembers.find(m => m.id === adminId);
    const cleaner = cleaners.find(c => c.id === id);
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, status: CleanerStatus.REJECTED } : c));
    addAuditLog({
      adminId,
      adminName: admin?.fullName || 'System',
      action: 'CLEANER_REJECTED',
      details: `Rejected cleaner ${cleaner?.fullName}`,
      targetId: id,
      targetType: 'CLEANER'
    });
  };

  const deleteCleaner = (id: string, adminId: string) => {
    const admin = teamMembers.find(m => m.id === adminId);
    setCleaners(p => p.filter(c => c.id !== id));
    addAuditLog({
      adminId,
      adminName: admin?.fullName || 'System',
      action: 'CLEANER_DELETED',
      details: `Deleted cleaner profile ${id}`,
      targetId: id,
      targetType: 'CLEANER'
    });
  };

  const updateCleanerProfile = (id: string, data: Partial<CleanerProfile>) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const verifyCleanerCode = (cleanerId: string, code: string): { success: boolean; error?: string } => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    if (!cleaner) return { success: false, error: 'User not found.' };
    if (cleaner.verificationCode !== code) return { success: false, error: 'Código inválido.' };
    if (cleaner.verificationCodeExpires && Date.now() > cleaner.verificationCodeExpires) return { success: false, error: 'Este código expirou.' };
    setAuthenticatedCleanerId(cleanerId);
    setUserRole(UserRole.CLEANER);
    updateCleanerProfile(cleanerId, { emailVerified: true, status: CleanerStatus.BUSINESS_PENDING });
    return { success: true };
  };

  const resendCleanerCode = async (cleanerId: string) => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    if (!cleaner) throw new Error("Profissional não encontrado.");
    const code = await requestVerificationEmail(cleaner.email, 'pt');
    updateCleanerProfile(cleanerId, { verificationCode: code, verificationCodeExpires: Date.now() + VERIFICATION_TTL });
  };

  const searchCleaners = (zip: string, serviceKey?: string): CleanerProfile[] => {
    const targetZip = zip.trim().substring(0, 5);
    if (targetZip.length < 5) return [];

    return cleaners.filter(cleaner => {
      // RULE: Only approved, public, and listed profiles appear
      const isPubliclyVisible = cleaner.status === CleanerStatus.VERIFIED && cleaner.isListed === true;
      if (!isPubliclyVisible) return false;

      // RULE: ZIP/Radius Matching
      if (!canCleanerServeZip(cleaner, targetZip)) return false;

      // RULE: Service Matching (Unified Keys)
      if (serviceKey && serviceKey !== 'All' && !cleaner.services.includes(serviceKey)) return false;

      return true;
    });
  };

  const requestVerificationEmail = async (to: string, lang: 'en' | 'pt') => {
    try {
      const response = await fetch('/.netlify/functions/sendVerificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, language: lang })
      });
      const resData = await response.json();
      return resData.code;
    } catch (e) { return "123456"; }
  };

  const createLead = async (l: Partial<Lead>) => {
    const code = await requestVerificationEmail(l.clientEmail || '', 'en');
    setPendingClientCode(code);
    setPendingClientCodeExpires(Date.now() + VERIFICATION_TTL);
    setPendingClientEmail(l.clientEmail || '');
    setLeads(p => [{...l, id: Math.random().toString(36).substr(2, 9), status: 'OPEN', createdAt: Date.now()} as Lead, ...p]);
  };

  const resendClientCode = async () => {
    if (!pendingClientEmail) throw new Error("E-mail não encontrado.");
    const code = await requestVerificationEmail(pendingClientEmail, 'en');
    setPendingClientCode(code);
    setPendingClientCodeExpires(Date.now() + VERIFICATION_TTL);
  };

  const activateSubscription = (id: string, s: Subscription) => updateCleanerProfile(id, { subscription: s });
  const addCleanerPoints = (id: string, amt: number, reason: string) => setCleaners(p => p.map(c => c.id === id ? serviceAddPoints(c, amt, reason) : c));
  const deleteLead = (id: string) => setLeads(p => p.filter(l => l.id !== id));
  const acceptLead = (lid: string, cid: string) => {
    setLeads(p => p.map(l => l.id === lid ? {...l, status: 'ACCEPTED', acceptedByCleanerId: cid} : l));
    addCleanerPoints(cid, 10, 'Lead Accepted');
  };

  const addPortfolioItem = async (cleanerId: string, item: any) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), status: 'PENDING_REVIEW' };
    setCleaners(prev => prev.map(c => c.id === cleanerId ? { ...c, portfolio: [newItem, ...(c.portfolio || [])] } : c));
  };

  const updatePortfolioStatus = (cleanerId: string, itemId: string, status: any, note?: string) => {
    setCleaners(prev => prev.map(c => c.id === cleanerId ? { ...c, portfolio: c.portfolio.map(p => p.id === itemId ? { ...p, status, adminNote: note } : p) } : c));
  };

  const createSupportRequest = (request: Partial<SupportRequest>) => {
    const newReq: SupportRequest = {
      ...request,
      id: Math.random().toString(36).substr(2, 9),
      status: SupportStatus.NEW,
      createdAt: new Date().toISOString()
    } as SupportRequest;
    setSupportRequests(prev => [newReq, ...prev]);
  };

  const updateSupportStatus = (id: string, status: SupportStatus) => {
    setSupportRequests(prev => prev.map(r => r.id === id ? { ...r, status, resolvedAt: status === SupportStatus.RESOLVED ? new Date().toISOString() : undefined } : r));
  };

  return (
    <AppContext.Provider value={{ 
      cleaners, clients, leads, feedPosts, supportRequests, bonusCampaigns, teamMembers, teamInvites, auditLogs, userRole, setUserRole, 
      authenticatedCleanerId, authenticatedClientId, authenticatedAdminId, pendingClientCode, pendingClientEmail, pendingClientCodeExpires,
      registerCleaner, loginCleaner, updateCleanerProfile, verifyCleanerCode, resendCleanerCode, resendClientCode, 
      registerClient: (d) => {}, updateClientProfile: (i, d) => {}, logout, verifyCleaner, rejectCleaner, deleteCleaner,
      activateSubscription, addCleanerPoints, searchCleaners, createLead, deleteLead, acceptLead, 
      createSupportRequest, updateSupportStatus, addPortfolioItem, updatePortfolioStatus,
      isChatOpen, setIsChatOpen, lastEmail, clearLastEmail: () => setLastEmail(null),
      inviteTeamMember, updateTeamMemberStatus, removeTeamMember, addAuditLog
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
