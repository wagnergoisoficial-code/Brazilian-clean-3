
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CleanerProfile, CleanerStatus, UserRole, Lead, FeedPost, ClientProfile, SupportRequest, SupportStatus, SupportType, Subscription, SubscriptionPlan, PaymentMethodType, Discount, CleanerLevel, BonusCampaign, PortfolioItem, EmailNotification } from '../types';
import { addPoints as serviceAddPoints } from '../services/meritService';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(base64Str);
  });
};

interface AppContextType {
  cleaners: CleanerProfile[];
  clients: ClientProfile[];
  leads: Lead[];
  feedPosts: FeedPost[];
  supportRequests: SupportRequest[];
  bonusCampaigns: BonusCampaign[];
  userRole: UserRole;
  pendingClientCode: string | null;
  pendingClientEmail: string | null;
  setUserRole: (role: UserRole) => void;
  registerCleaner: (cleaner: Partial<CleanerProfile>) => Promise<string>;
  updateCleanerProfile: (id: string, data: Partial<CleanerProfile>) => void;
  verifyCleanerCode: (cleanerId: string, code: string) => boolean;
  resendCleanerCode: (cleanerId: string) => Promise<void>;
  resendClientCode: () => Promise<void>;
  registerClient: (client: Partial<ClientProfile>) => void;
  verifyUserEmail: (token: string) => boolean;
  verifyCleaner: (id: string) => void;
  rejectCleaner: (id: string) => void;
  deleteCleaner: (id: string) => void;
  activateSubscription: (id: string, subscription: Subscription) => void;
  addCleanerPoints: (cleanerId: string, amount: number, reason: string) => void;
  createBonusCampaign: (campaign: BonusCampaign) => void;
  deleteBonusCampaign: (id: string) => void;
  searchCleaners: (zip: string) => CleanerProfile[];
  createLead: (lead: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => void;
  acceptLead: (leadId: string, cleanerId: string) => void;
  createFeedPost: (post: Partial<FeedPost>) => void;
  deleteFeedPost: (id: string) => void;
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
    
    setPendingClientCode(localStorage.getItem('bc_pending_code'));
    setPendingClientEmail(localStorage.getItem('bc_pending_email'));
  }, []);

  useEffect(() => { localStorage.setItem('bc_cleaners', JSON.stringify(cleaners)); }, [cleaners]);
  useEffect(() => { localStorage.setItem('bc_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('bc_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('bc_posts', JSON.stringify(feedPosts)); }, [feedPosts]);
  useEffect(() => { localStorage.setItem('bc_support', JSON.stringify(supportRequests)); }, [supportRequests]);
  useEffect(() => { localStorage.setItem('bc_campaigns', JSON.stringify(bonusCampaigns)); }, [bonusCampaigns]);
  
  useEffect(() => {
    if(pendingClientCode) localStorage.setItem('bc_pending_code', pendingClientCode);
    else localStorage.removeItem('bc_pending_code');
  }, [pendingClientCode]);

  useEffect(() => {
    if(pendingClientEmail) localStorage.setItem('bc_pending_email', pendingClientEmail);
    else localStorage.removeItem('bc_pending_email');
  }, [pendingClientEmail]);

  const requestVerificationEmail = async (to: string, lang: 'en' | 'pt') => {
    try {
      const response = await fetch('/.netlify/functions/sendVerificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, language: lang })
      });
      const resData = await response.json();
      if (!resData.success) throw new Error(resData.error || "Email delivery failed");
      return resData.code;
    } catch (e: any) {
      console.error("Email Dispatch Error:", e);
      throw e;
    }
  };

  const registerCleaner = async (data: Partial<CleanerProfile>): Promise<string> => {
    const id = Math.random().toString(36).substr(2, 9);
    const code = await requestVerificationEmail(data.email || '', 'pt');
    const expires = Date.now() + 10 * 60 * 1000;

    const newCleaner: CleanerProfile = {
      ...data,
      id,
      status: CleanerStatus.EMAIL_PENDING,
      rating: 0,
      reviewCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      portfolio: [],
      points: 0,
      level: CleanerLevel.BRONZE,
      pointHistory: [],
      emailVerified: false,
      verificationCode: code,
      verificationCodeExpires: expires,
      isCompany: false,
      yearsExperience: 0,
      services: [],
      zipCodes: []
    } as CleanerProfile;

    setCleaners(prev => [...prev, newCleaner]);
    return id;
  };

  const updateCleanerProfile = (id: string, data: Partial<CleanerProfile>) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const verifyCleanerCode = (cleanerId: string, code: string): boolean => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    if (!cleaner) return false;

    const isCodeValid = cleaner.verificationCode === code && (cleaner.verificationCodeExpires || 0) > Date.now();

    if (isCodeValid) {
      setCleaners(prev => prev.map(c => 
        c.id === cleanerId ? { 
          ...c, 
          emailVerified: true, 
          status: CleanerStatus.BUSINESS_PENDING, // Next step in Flow 2
          verificationCode: undefined,
          verificationCodeExpires: undefined
        } : c
      ));
      return true;
    }
    return false;
  };

  const resendCleanerCode = async (cleanerId: string) => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    if (!cleaner) return;
    const code = await requestVerificationEmail(cleaner.email, 'pt');
    const expires = Date.now() + 10 * 60 * 1000;
    setCleaners(prev => prev.map(c => c.id === cleanerId ? { ...c, verificationCode: code, verificationCodeExpires: expires } : c));
  };

  const resendClientCode = async () => {
    if (!pendingClientEmail) return;
    const verificationCode = await requestVerificationEmail(pendingClientEmail, 'en');
    setPendingClientCode(verificationCode);
  };

  const createLead = async (l: Partial<Lead>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const verificationCode = await requestVerificationEmail(l.clientEmail || '', 'en');
    
    setPendingClientCode(verificationCode);
    setPendingClientEmail(l.clientEmail || '');
    setLeads(p => [{...l, id, status: 'OPEN', createdAt: Date.now()} as Lead, ...p]);
  };

  const registerClient = (data: Partial<ClientProfile>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setClients(prev => [...prev, { ...data, id, emailVerified: true, joinedDate: new Date().toISOString() } as ClientProfile]);
  };

  const verifyUserEmail = () => true;
  const verifyCleaner = (id: string) => setCleaners(p => p.map(c => c.id === id ? {...c, status: CleanerStatus.VERIFIED} : c));
  const rejectCleaner = (id: string) => setCleaners(p => p.map(c => c.id === id ? {...c, status: CleanerStatus.REJECTED} : c));
  const deleteCleaner = (id: string) => setCleaners(p => p.filter(c => c.id !== id));
  const activateSubscription = (id: string, s: Subscription) => setCleaners(p => p.map(c => c.id === id ? {...c, subscription: s} : c));
  const addCleanerPoints = (id: string, amt: number, reason: string) => setCleaners(p => p.map(c => c.id === id ? serviceAddPoints(c, amt, reason) : c));
  const createBonusCampaign = (c: BonusCampaign) => setBonusCampaigns(p => [c, ...p]);
  const deleteBonusCampaign = (id: string) => setBonusCampaigns(p => p.filter(c => c.id !== id));
  const searchCleaners = (zip: string) => cleaners.filter(c => c.status === CleanerStatus.VERIFIED && c.subscription?.isActive && c.zipCodes.includes(zip));
  const deleteLead = (id: string) => setLeads(p => p.filter(l => l.id !== id));
  const acceptLead = (lid: string, cid: string) => {
    setLeads(p => p.map(l => l.id === lid ? {...l, status: 'ACCEPTED', acceptedByCleanerId: cid} : l));
    addCleanerPoints(cid, 10, 'Lead Aceito');
  };
  const createFeedPost = (post: Partial<FeedPost>) => setFeedPosts(p => [{...post, id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString()} as FeedPost, ...p]);
  const deleteFeedPost = (id: string) => setFeedPosts(p => p.filter(f => f.id !== id));
  const createSupportRequest = (r: Partial<SupportRequest>) => setSupportRequests(p => [{...r, id: Math.random().toString(36).substr(2, 9), status: SupportStatus.NEW, createdAt: new Date().toISOString()} as SupportRequest, ...p]);
  const updateSupportStatus = (id: string, s: SupportStatus) => setSupportRequests(p => p.map(r => r.id === id ? {...r, status: s} : r));
  const addPortfolioItem = async (cleanerId: string, item: Omit<PortfolioItem, 'id' | 'createdAt' | 'status'>) => {
    const compressedBefore = await compressImage(item.beforeImage);
    const compressedAfter = await compressImage(item.afterImage);
    const newItem: PortfolioItem = {
      id: Math.random().toString(36).substr(2, 9),
      serviceType: item.serviceType,
      beforeImage: compressedBefore,
      afterImage: compressedAfter,
      description: item.description,
      createdAt: new Date().toISOString(),
      status: 'PENDING_REVIEW'
    };
    setCleaners(prev => prev.map(c => c.id === cleanerId ? { ...c, portfolio: [newItem, ...(c.portfolio || [])] } : c));
  };
  const updatePortfolioStatus = (cleanerId: string, itemId: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
      setCleaners(prev => prev.map(c => c.id === cleanerId ? { ...c, portfolio: c.portfolio.map(p => p.id === itemId ? { ...p, status, adminNote: note } : p) } : c));
  };
  const clearLastEmail = () => setLastEmail(null);

  return (
    <AppContext.Provider value={{ 
      cleaners, clients, leads, feedPosts, supportRequests, bonusCampaigns, userRole, setUserRole, 
      pendingClientCode, pendingClientEmail,
      registerCleaner, updateCleanerProfile, verifyCleanerCode, resendCleanerCode, resendClientCode, registerClient, verifyUserEmail, verifyCleaner, rejectCleaner, deleteCleaner,
      activateSubscription, addCleanerPoints, createBonusCampaign, deleteBonusCampaign, searchCleaners, createLead, deleteLead, acceptLead, 
      createFeedPost, deleteFeedPost, createSupportRequest, updateSupportStatus, 
      addPortfolioItem, updatePortfolioStatus,
      isChatOpen, setIsChatOpen, lastEmail, clearLastEmail 
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
