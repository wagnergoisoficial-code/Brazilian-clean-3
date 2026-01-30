
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CleanerProfile, CleanerStatus, UserRole, Lead, FeedPost, ClientProfile, SupportRequest, SupportStatus, SupportType, Subscription, SubscriptionPlan, PaymentMethodType, Discount, CleanerLevel, BonusCampaign, PortfolioItem, EmailNotification } from '../types';
import { addPoints as serviceAddPoints } from '../services/meritService';

interface AppContextType {
  cleaners: CleanerProfile[];
  clients: ClientProfile[];
  leads: Lead[];
  feedPosts: FeedPost[];
  supportRequests: SupportRequest[];
  bonusCampaigns: BonusCampaign[];
  userRole: UserRole;
  authenticatedCleanerId: string | null;
  authenticatedClientId: string | null;
  pendingClientCode: string | null;
  pendingClientEmail: string | null;
  setUserRole: (role: UserRole) => void;
  registerCleaner: (data: Partial<CleanerProfile>) => Promise<string>;
  loginCleaner: (email: string, password: string) => Promise<CleanerProfile | null>;
  updateCleanerProfile: (id: string, data: Partial<CleanerProfile>) => void;
  verifyCleanerCode: (cleanerId: string, code: string) => boolean;
  resendCleanerCode: (cleanerId: string) => Promise<void>;
  resendClientCode: () => Promise<void>;
  registerClient: (client: Partial<ClientProfile>) => void;
  updateClientProfile: (id: string, data: Partial<ClientProfile>) => void;
  logout: () => void;
  verifyCleaner: (id: string) => void;
  rejectCleaner: (id: string) => void;
  deleteCleaner: (id: string) => void;
  activateSubscription: (id: string, subscription: Subscription) => void;
  addCleanerPoints: (cleanerId: string, amount: number, reason: string) => void;
  searchCleaners: (zip: string) => CleanerProfile[];
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cleaners, setCleaners] = useState<CleanerProfile[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [bonusCampaigns, setBonusCampaigns] = useState<BonusCampaign[]>([]);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);
  const [authenticatedCleanerId, setAuthenticatedCleanerId] = useState<string | null>(null);
  const [authenticatedClientId, setAuthenticatedClientId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastEmail, setLastEmail] = useState<EmailNotification | null>(null);
  const [pendingClientCode, setPendingClientCode] = useState<string | null>(null);
  const [pendingClientEmail, setPendingClientEmail] = useState<string | null>(null);

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
    setAuthenticatedCleanerId(localStorage.getItem('bc_auth_cleaner_id'));
    setAuthenticatedClientId(localStorage.getItem('bc_auth_client_id'));
  }, []);

  useEffect(() => { 
    const filteredCleaners = cleaners.map(c => {
        const { 
          documentFrontUrl, 
          documentBackUrl, 
          facePhotoUrl, 
          selfieWithDocUrl, 
          photoUrl,
          galleryUrls,
          portfolio,
          ...rest 
        } = c;
        return rest;
    });
    localStorage.setItem('bc_cleaners', JSON.stringify(filteredCleaners)); 
  }, [cleaners]);

  useEffect(() => { localStorage.setItem('bc_clients', JSON.stringify(clients)); }, [clients]);
  
  useEffect(() => { 
    if(authenticatedCleanerId) localStorage.setItem('bc_auth_cleaner_id', authenticatedCleanerId);
    else localStorage.removeItem('bc_auth_cleaner_id');
  }, [authenticatedCleanerId]);

  useEffect(() => { 
    if(authenticatedClientId) localStorage.setItem('bc_auth_client_id', authenticatedClientId);
    else localStorage.removeItem('bc_auth_client_id');
  }, [authenticatedClientId]);

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

  const registerCleaner = async (data: Partial<CleanerProfile>): Promise<string> => {
    const id = Math.random().toString(36).substr(2, 9);
    const code = await requestVerificationEmail(data.email || '', 'pt');
    const newCleaner: CleanerProfile = {
      id, 
      fullName: data.fullName || '', 
      email: data.email || '',
      password: data.password || '',
      phone: data.phone || '',
      city: data.city || '',
      state: data.state || '',
      zipCodes: data.zipCodes || [],
      status: CleanerStatus.EMAIL_PENDING,
      rating: 0, 
      reviewCount: 0,
      joinedDate: new Date().toISOString(),
      emailVerified: false,
      verificationCode: code,
      verificationCodeExpires: Date.now() + 600000,
      points: 0, 
      level: CleanerLevel.BRONZE, 
      pointHistory: [],
      portfolio: [], 
      galleryUrls: [], 
      services: [],
      companyName: '', 
      isCompany: false, 
      yearsExperience: 0, 
      description: '', 
      photoUrl: '',
      isListed: true, // Visible by default if other rules met
      profileCompleted: false
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

  const updateCleanerProfile = (id: string, data: Partial<CleanerProfile>) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const verifyCleanerCode = (cleanerId: string, code: string): boolean => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    if (cleaner && cleaner.verificationCode === code) {
      setAuthenticatedCleanerId(cleanerId);
      setUserRole(UserRole.CLEANER);
      updateCleanerProfile(cleanerId, { emailVerified: true, status: CleanerStatus.BUSINESS_PENDING });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthenticatedCleanerId(null);
    setAuthenticatedClientId(null);
    setUserRole(UserRole.CLIENT);
  };

  const registerClient = (data: Partial<ClientProfile>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newClient = { ...data, id, emailVerified: true, joinedDate: new Date().toISOString() } as ClientProfile;
    setClients(prev => [...prev, newClient]);
    setAuthenticatedClientId(id);
    setUserRole(UserRole.CLIENT);
  };

  const updateClientProfile = (id: string, data: Partial<ClientProfile>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const searchCleaners = (zip: string): CleanerProfile[] => {
    // 1. Normalize Search ZIP
    const normalizedZip = zip.trim().substring(0, 5);
    if (normalizedZip.length < 5) return [];

    console.log(`[Marketplace Search] Query: ${normalizedZip}`);

    // 2. Query Logic
    const results = cleaners.filter(cleaner => {
      // Rule A: Served ZIPs match
      const servesZip = cleaner.zipCodes.some(z => z.trim().substring(0, 5) === normalizedZip);
      if (!servesZip) return false;

      // Rule B: Listing Rules
      // Must have basic profile data to be displayed
      const hasPhone = !!cleaner.phone;
      const isPublic = cleaner.isListed !== false; // Discoverability toggle
      
      // Rule C: Verification Threshold
      // For growth, we allow UNDER_REVIEW but prioritize VERIFIED in sorting
      const isDiscoverable = [CleanerStatus.VERIFIED, CleanerStatus.UNDER_REVIEW].includes(cleaner.status);

      return hasPhone && isPublic && isDiscoverable;
    });

    console.log(`[Marketplace Search] Results found: ${results.length}`);
    return results;
  };

  const createLead = async (l: Partial<Lead>) => {
    const code = await requestVerificationEmail(l.clientEmail || '', 'en');
    setPendingClientCode(code);
    setPendingClientEmail(l.clientEmail || '');
    setLeads(p => [{...l, id: Math.random().toString(36).substr(2, 9), status: 'OPEN', createdAt: Date.now()} as Lead, ...p]);
  };

  const verifyCleaner = (id: string) => updateCleanerProfile(id, { status: CleanerStatus.VERIFIED });
  const rejectCleaner = (id: string) => updateCleanerProfile(id, { status: CleanerStatus.REJECTED });
  const deleteCleaner = (id: string) => setCleaners(p => p.filter(c => c.id !== id));
  const activateSubscription = (id: string, s: Subscription) => updateCleanerProfile(id, { subscription: s });
  const addCleanerPoints = (id: string, amt: number, reason: string) => setCleaners(p => p.map(c => c.id === id ? serviceAddPoints(c, amt, reason) : c));
  const deleteLead = (id: string) => setLeads(p => p.filter(l => l.id !== id));
  
  // FIXED: correctly mapping over the leads array to update the accepted lead status and cleaner assignment.
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

  return (
    <AppContext.Provider value={{ 
      cleaners, clients, leads, feedPosts, supportRequests, bonusCampaigns, userRole, setUserRole, 
      authenticatedCleanerId, authenticatedClientId, pendingClientCode, pendingClientEmail,
      registerCleaner, loginCleaner, updateCleanerProfile, verifyCleanerCode, resendCleanerCode: async () => {}, resendClientCode: async () => {}, 
      registerClient, updateClientProfile, logout, verifyCleaner, rejectCleaner, deleteCleaner,
      activateSubscription, addCleanerPoints, searchCleaners, createLead, deleteLead, acceptLead, 
      createSupportRequest: () => {}, updateSupportStatus: () => {}, 
      addPortfolioItem, updatePortfolioStatus,
      isChatOpen, setIsChatOpen, lastEmail, clearLastEmail: () => {}
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
