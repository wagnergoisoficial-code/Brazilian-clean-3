
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CleanerProfile, CleanerStatus, UserRole, Lead, FeedPost, ClientProfile, 
  SupportRequest, SupportStatus, SupportType, Subscription, SubscriptionPlan, 
  PaymentMethodType, Discount, CleanerLevel, BonusCampaign, PortfolioItem, 
  EmailNotification, AdminRole, TeamMember, TeamInvite, AuditLog, AdminPermissions 
} from '../types';
import { addPoints as serviceAddPoints } from '../services/meritService';
import { canCleanerServeZip, normalizeZip } from '../services/locationService';

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
  isHydrated: boolean;
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
  inviteTeamMember: (data: { fullName: string; email: string; role: AdminRole; permissions: AdminPermissions }, adminId: string) => void;
  updateTeamMemberStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED', adminId: string) => void;
  removeTeamMember: (id: string, adminId: string) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  requestPasswordReset: (email: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const VERIFICATION_TTL = 600000;

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
  const [isHydrated, setIsHydrated] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastEmail, setLastEmail] = useState<EmailNotification | null>(null);
  const [pendingClientCode, setPendingClientCode] = useState<string | null>(null);
  const [pendingClientEmail, setPendingClientEmail] = useState<string | null>(null);
  const [pendingClientCodeExpires, setPendingClientCodeExpires] = useState<number | null>(null);

  useEffect(() => {
    const hydrate = () => {
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
      setTeamMembers(safeParse('bc_team', [{
        id: 'master_1',
        fullName: 'Admin Master',
        email: 'master@brazilianclean.org',
        role: AdminRole.ADMIN_MASTER,
        status: 'ACTIVE',
        permissions: {
          canApproveDocuments: true, canRejectDocuments: true, canViewPII: true,
          canResetPassword: true, canResendVerificationCode: true, canViewLeads: true,
          canManageTeam: true, canViewAuditLogs: true,
        }
      }]));
      
      const cleanerId = localStorage.getItem('bc_auth_cleaner_id');
      const clientId = localStorage.getItem('bc_auth_client_id');
      const adminId = localStorage.getItem('bc_auth_admin_id');

      if (cleanerId) { setAuthenticatedCleanerId(cleanerId); setUserRole(UserRole.CLEANER); }
      if (clientId) { setAuthenticatedClientId(clientId); setUserRole(UserRole.CLIENT); }
      if (adminId) { setAuthenticatedAdminId(adminId); setUserRole(UserRole.ADMIN); }

      setPendingClientCode(localStorage.getItem('bc_pending_code'));
      setPendingClientEmail(localStorage.getItem('bc_pending_email'));
      const expiry = localStorage.getItem('bc_pending_expiry');
      if (expiry) setPendingClientCodeExpires(parseInt(expiry));

      setIsHydrated(true);
    };

    hydrate();
  }, []);

  // Persistence hooks
  useEffect(() => { if(isHydrated) localStorage.setItem('bc_cleaners', JSON.stringify(cleaners)); }, [cleaners, isHydrated]);
  useEffect(() => { if(isHydrated) localStorage.setItem('bc_leads', JSON.stringify(leads)); }, [leads, isHydrated]);
  useEffect(() => { if(isHydrated) localStorage.setItem('bc_team', JSON.stringify(teamMembers)); }, [teamMembers, isHydrated]);
  
  useEffect(() => {
    if(!isHydrated) return;
    if (authenticatedCleanerId) localStorage.setItem('bc_auth_cleaner_id', authenticatedCleanerId);
    else localStorage.removeItem('bc_auth_cleaner_id');
  }, [authenticatedCleanerId, isHydrated]);

  useEffect(() => {
    if(!isHydrated) return;
    if (authenticatedAdminId) localStorage.setItem('bc_auth_admin_id', authenticatedAdminId);
    else localStorage.removeItem('bc_auth_admin_id');
  }, [authenticatedAdminId, isHydrated]);

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
    localStorage.removeItem('bc_auth_cleaner_id');
    localStorage.removeItem('bc_auth_client_id');
    localStorage.removeItem('bc_auth_admin_id');
  };

  const requestPasswordReset = async (email: string) => {
    const cleaner = cleaners.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!cleaner) throw new Error("E-mail não encontrado em nossa base.");
    setLastEmail({
      to: cleaner.email,
      subject: 'Recuperação de Senha',
      body: `Olá ${cleaner.fullName}, utilize o link abaixo para recuperar seu acesso.`,
      actionLink: `/join`,
      actionText: 'Redefinir Senha'
    });
  };

  const registerCleaner = async (data: Partial<CleanerProfile>): Promise<string> => {
    const id = Math.random().toString(36).substr(2, 9);
    const code = await requestVerificationEmail(data.email || '', 'pt');
    const newCleaner: CleanerProfile = {
      id, fullName: data.fullName || '', email: data.email || '', password: data.password || '',
      phone: data.phone || '', city: data.city || '', state: data.state || '', baseZip: normalizeZip(data.baseZip || ''),
      serviceRadius: 10, zipCodes: (data.zipCodes || []).map(normalizeZip), status: CleanerStatus.EMAIL_PENDING, rating: 0, reviewCount: 0,
      joinedDate: new Date().toISOString(), emailVerified: false, verificationCode: code,
      verificationCodeExpires: Date.now() + VERIFICATION_TTL, points: 0, level: CleanerLevel.BRONZE,
      pointHistory: [], portfolio: [], galleryUrls: [], services: [], companyName: '', isCompany: false,
      yearsExperience: 0, description: '', photoUrl: '', isListed: true, profileCompleted: false,
      notificationCount: 0
    };
    setCleaners(prev => [...prev, newCleaner]);
    return id;
  };

  const updateCleanerProfile = (id: string, data: Partial<CleanerProfile>) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const verifyCleanerCode = (cleanerId: string, code: string): { success: boolean; error?: string } => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    if (!cleaner) return { success: false, error: 'Usuário não encontrado.' };
    if (cleaner.verificationCode !== code) return { success: false, error: 'Código inválido.' };
    setAuthenticatedCleanerId(cleanerId);
    setUserRole(UserRole.CLEANER);
    updateCleanerProfile(cleanerId, { emailVerified: true, status: CleanerStatus.BUSINESS_PENDING });
    return { success: true };
  };

  const resendCleanerCode = async (cleanerId: string) => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    if (!cleaner) return;
    const code = await requestVerificationEmail(cleaner.email, 'pt');
    updateCleanerProfile(cleanerId, { verificationCode: code, verificationCodeExpires: Date.now() + VERIFICATION_TTL });
  };

  const searchCleaners = (zip: string, serviceKey?: string): CleanerProfile[] => {
    const targetZip = normalizeZip(zip);
    return cleaners.filter(c => {
      const isPublic = (c.status === CleanerStatus.VERIFIED || c.status === CleanerStatus.UNDER_REVIEW) && c.isListed;
      if (!isPublic) return false;
      if (!canCleanerServeZip(c, targetZip)) return false;
      if (serviceKey && serviceKey !== 'All' && !c.services.includes(serviceKey)) return false;
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
    const targetZip = normalizeZip(l.zipCode || '');
    const code = await requestVerificationEmail(l.clientEmail || '', 'en');
    setPendingClientCode(code);
    setPendingClientEmail(l.clientEmail || '');
    setPendingClientCodeExpires(Date.now() + VERIFICATION_TTL);
    
    const matchingCleanerIds = cleaners.filter(c => canCleanerServeZip(c, targetZip)).map(c => c.id);
    const newLead: Lead = { ...l, id: Math.random().toString(36).substr(2, 9), status: 'OPEN', createdAt: Date.now(), broadcastToIds: matchingCleanerIds } as Lead;
    setLeads(p => [newLead, ...p]);
    setCleaners(prev => prev.map(c => matchingCleanerIds.includes(c.id) ? { ...c, notificationCount: (c.notificationCount || 0) + 1 } : c));
  };

  const resendClientCode = async () => {
    if (!pendingClientEmail) return;
    const code = await requestVerificationEmail(pendingClientEmail, 'en');
    setPendingClientCode(code);
    setPendingClientCodeExpires(Date.now() + VERIFICATION_TTL);
  };

  const acceptLead = (lid: string, cid: string) => {
    setLeads(p => p.map(l => l.id === lid ? {...l, status: 'ACCEPTED', acceptedByCleanerId: cid} : l));
    addCleanerPoints(cid, 10, 'Lead Aceito');
  };

  const addCleanerPoints = (id: string, amt: number, reason: string) => setCleaners(p => p.map(c => c.id === id ? serviceAddPoints(c, amt, reason) : c));
  const verifyCleaner = (id: string, adminId: string) => updateCleanerProfile(id, { status: CleanerStatus.VERIFIED });
  const rejectCleaner = (id: string, adminId: string) => updateCleanerProfile(id, { status: CleanerStatus.REJECTED });
  const deleteCleaner = (id: string, adminId: string) => setCleaners(p => p.filter(c => c.id !== id));
  const addPortfolioItem = async (cleanerId: string, item: any) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), status: 'PENDING_REVIEW' };
    setCleaners(prev => prev.map(c => c.id === cleanerId ? { ...c, portfolio: [newItem, ...(c.portfolio || [])] } : c));
  };
  const updatePortfolioStatus = (cleanerId: string, itemId: string, status: any, note?: string) => {
    setCleaners(prev => prev.map(c => c.id === cleanerId ? { ...c, portfolio: c.portfolio.map(p => p.id === itemId ? { ...p, status, adminNote: note } : p) } : c));
  };
  const createSupportRequest = (request: Partial<SupportRequest>) => setSupportRequests(p => [...p, { ...request, id: Math.random().toString(36).substr(2, 9), status: SupportStatus.NEW, createdAt: new Date().toISOString() } as SupportRequest]);
  const updateSupportStatus = (id: string, status: SupportStatus) => setSupportRequests(p => p.map(r => r.id === id ? { ...r, status } : r));
  const inviteTeamMember = (data: any, adminId: string) => setTeamInvites(p => [...p, { ...data, id: Math.random().toString(36).substr(2, 9), status: 'PENDING' }]);
  const updateTeamMemberStatus = (id: string, status: any, adminId: string) => setTeamMembers(p => p.map(m => m.id === id ? { ...m, status } : m));
  const removeTeamMember = (id: string, adminId: string) => setTeamMembers(p => p.filter(m => m.id !== id));
  const addAuditLog = (log: any) => setAuditLogs(p => [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() }, ...p]);

  return (
    <AppContext.Provider value={{ 
      cleaners, clients, leads, feedPosts, supportRequests, bonusCampaigns, teamMembers, teamInvites, auditLogs, userRole, setUserRole, 
      authenticatedCleanerId, authenticatedClientId, authenticatedAdminId, pendingClientCode, pendingClientEmail, pendingClientCodeExpires,
      isHydrated, registerCleaner, loginCleaner, updateCleanerProfile, verifyCleanerCode, resendCleanerCode, resendClientCode, 
      registerClient: (d) => {}, updateClientProfile: (i, d) => {}, logout, verifyCleaner, rejectCleaner, deleteCleaner,
      activateSubscription: () => {}, addCleanerPoints, searchCleaners, createLead, deleteLead: () => {}, acceptLead, 
      createSupportRequest, updateSupportStatus, addPortfolioItem, updatePortfolioStatus,
      isChatOpen, setIsChatOpen, lastEmail, clearLastEmail: () => setLastEmail(null),
      inviteTeamMember, updateTeamMemberStatus, removeTeamMember, addAuditLog, requestPasswordReset
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
