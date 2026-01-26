
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CleanerProfile, CleanerStatus, UserRole, Lead, FeedPost, ClientProfile, SupportRequest, SupportStatus, SupportType, Subscription, SubscriptionPlan, PaymentMethodType, Discount, CleanerLevel, BonusCampaign, PortfolioItem } from '../types';
import { addPoints as serviceAddPoints } from '../services/meritService';
import { performIdentityVerification } from '../services/geminiService';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

// --- HELPER: IMAGE COMPRESSION ---
// Prevents localStorage from overflowing by resizing images to max 400px
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
      // Reduce quality to 0.6 for storage safety
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(base64Str); // Fallback to original if error
  });
};

// --- MOCK DATA LAYER (STUDIO MODE) ---
const MOCK_CLEANERS: CleanerProfile[] = [
  {
    id: 'c_mock_1', fullName: 'Maria Silva', companyName: "Maria's Magic Touch", isCompany: true, yearsExperience: 10,
    services: ['Deep Clean (Faxina Pesada)', 'Mudança (Move-in/Move-out)', 'Faxina Padrão (Standard Cleaning)'],
    email: 'maria@example.com', phone: '(415) 555-0101', city: 'San Francisco', state: 'CA', zipCodes: ['94103', '94105', '94110'],
    status: CleanerStatus.VERIFIED, emailVerified: true, rating: 4.9, reviewCount: 124, joinedDate: '2023-05-12',
    description: 'Specialized in deep cleaning and move-in/move-out services. 10 years of experience.',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200', galleryUrls: [], points: 1250, level: CleanerLevel.GOLD, pointHistory: [],
    subscription: { isActive: true, plan: SubscriptionPlan.STANDARD_PRO, startDate: '2023-05-12T00:00:00Z', nextBillingDate: '2025-05-12T00:00:00Z', paymentMethod: PaymentMethodType.CREDIT_CARD, lastPaymentAmount: 260.00, billingHistory: [] },
    portfolio: [
        { id: 'p1', serviceType: 'Kitchen Deep Clean', beforeImage: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&q=80&w=200', afterImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=200', status: 'APPROVED', createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'c_mock_2', fullName: 'João Santos', companyName: "JS Cleaning Pro", isCompany: true, yearsExperience: 5,
    services: ['Faxina Padrão (Standard Cleaning)', 'Limpeza Comercial (Commercial)'],
    email: 'joao@example.com', phone: '(305) 555-0202', city: 'Miami', state: 'FL', zipCodes: ['33101', '33130'],
    status: CleanerStatus.VERIFIED, emailVerified: true, rating: 4.7, reviewCount: 89, joinedDate: '2023-08-15',
    description: 'Efficient and reliable cleaning for homes and offices in Miami area.',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200', galleryUrls: [], points: 850, level: CleanerLevel.GOLD, pointHistory: [],
    subscription: { isActive: true, plan: SubscriptionPlan.PROMO_STARTUP, startDate: '2023-08-15T00:00:00Z', nextBillingDate: '2023-10-15T00:00:00Z', paymentMethod: PaymentMethodType.CREDIT_CARD, lastPaymentAmount: 180.00, billingHistory: [] },
    portfolio: []
  },
  {
    id: 'c_mock_3', fullName: 'Ana Oliveira', companyName: "", isCompany: false, yearsExperience: 3,
    services: ['Faxina Padrão (Standard Cleaning)'],
    email: 'ana.o@example.com', phone: '(617) 555-0303', city: 'Boston', state: 'MA', zipCodes: ['02108', '02110'],
    status: CleanerStatus.UNDER_REVIEW, emailVerified: true, rating: 0, reviewCount: 0, joinedDate: '2023-10-25',
    description: 'New to the platform. Hardworking and detailed oriented.',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', galleryUrls: [], points: 100, level: CleanerLevel.BRONZE, pointHistory: [],
    aiVerificationResult: { verification_status: "LIKELY_VALID", confidence_score: 0.92, detected_issues: [], summary: "Documents match selfie. Clear visibility.", recommended_action: "Approve", timestamp: new Date().toISOString() },
    portfolio: []
  },
  {
    id: 'c_mock_4', fullName: 'Carlos Pereira', companyName: "Carlos Cleaners", isCompany: true, yearsExperience: 15,
    services: ['Pós-Obra (Post-Construction)', 'Deep Clean (Faxina Pesada)'],
    email: 'carlos@example.com', phone: '(201) 555-0404', city: 'Newark', state: 'NJ', zipCodes: ['07101', '07102'],
    status: CleanerStatus.REJECTED, emailVerified: true, rating: 0, reviewCount: 0, joinedDate: '2023-10-20',
    description: 'Expert in heavy duty cleaning.',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', galleryUrls: [], points: 0, level: CleanerLevel.BRONZE, pointHistory: [],
    aiVerificationResult: { verification_status: "LIKELY_FRAUD", confidence_score: 0.15, detected_issues: ["Face mismatch", "Document modified"], summary: "Selfie does not match ID photo. ID appears edited.", recommended_action: "Reject", timestamp: new Date().toISOString() },
    portfolio: []
  },
  {
    id: 'c_mock_5', fullName: 'Fernanda Lima', companyName: "Lima Luxury Clean", isCompany: true, yearsExperience: 8,
    services: ['Deep Clean (Faxina Pesada)', 'Organização (Organization)'],
    email: 'fernanda@example.com', phone: '(407) 555-0505', city: 'Orlando', state: 'FL', zipCodes: ['32801', '32803'],
    status: CleanerStatus.VERIFIED, emailVerified: true, rating: 4.8, reviewCount: 45, joinedDate: '2023-06-10',
    description: 'Luxury cleaning service for vacation homes.',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200', galleryUrls: [], points: 450, level: CleanerLevel.SILVER, pointHistory: [],
    subscription: { isActive: true, plan: SubscriptionPlan.STANDARD_PRO, startDate: '2023-06-10T00:00:00Z', nextBillingDate: '2025-06-10T00:00:00Z', paymentMethod: PaymentMethodType.STRIPE, lastPaymentAmount: 260.00, billingHistory: [] },
    portfolio: []
  },
  {
    id: 'c_mock_6', fullName: 'Ricardo Mendes', companyName: "", isCompany: false, yearsExperience: 2,
    services: ['Limpeza de Janelas (Windows)', 'Limpeza Externa (Outdoor)'],
    email: 'ricardo@example.com', phone: '(512) 555-0606', city: 'Austin', state: 'TX', zipCodes: ['73301', '78701'],
    status: CleanerStatus.EMAIL_PENDING, emailVerified: false, rating: 0, reviewCount: 0, joinedDate: '2023-10-27',
    description: 'Specializing in outdoor and window cleaning.',
    photoUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200', galleryUrls: [], points: 0, level: CleanerLevel.BRONZE, pointHistory: [],
    portfolio: []
  },
  {
    id: 'c_mock_7', fullName: 'Beatriz Costa', companyName: "Bia Clean", isCompany: true, yearsExperience: 6,
    services: ['Faxina Padrão (Standard Cleaning)', 'Lavanderia (Laundry)'],
    email: 'bia@example.com', phone: '(206) 555-0707', city: 'Seattle', state: 'WA', zipCodes: ['98101', '98104'],
    status: CleanerStatus.UNDER_REVIEW, emailVerified: true, rating: 0, reviewCount: 0, joinedDate: '2023-10-26',
    description: 'Reliable and friendly service.',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', galleryUrls: [], points: 50, level: CleanerLevel.BRONZE, pointHistory: [],
    aiVerificationResult: { verification_status: "NEEDS_MANUAL_REVIEW", confidence_score: 0.65, detected_issues: ["Blurry Document"], summary: "ID text is slightly blurry but face matches.", recommended_action: "Review", timestamp: new Date().toISOString() },
    portfolio: []
  }
];

const MOCK_LEADS: Lead[] = [
  { id: 'l1', clientName: 'Alice Johnson', clientPhone: '(415) 555-1010', zipCode: '94103', serviceType: 'Deep Clean', bedrooms: 2, bathrooms: 2, date: '2023-11-01', status: 'OPEN', createdAt: Date.now() - 100000 },
  { id: 'l2', clientName: 'Bob Smith', clientPhone: '(415) 555-2020', zipCode: '94110', serviceType: 'Standard Clean', bedrooms: 1, bathrooms: 1, date: '2023-10-30', status: 'ACCEPTED', acceptedByCleanerId: 'c_mock_1', createdAt: Date.now() - 500000 },
  { id: 'l3', clientName: 'Charlie Brown', clientPhone: '(305) 555-3030', zipCode: '33101', serviceType: 'Move In/Out', bedrooms: 3, bathrooms: 2, date: '2023-11-05', status: 'OPEN', createdAt: Date.now() - 20000 },
  { id: 'l4', clientName: 'Diana Prince', clientPhone: '(617) 555-4040', zipCode: '02108', serviceType: 'Post-Construction', bedrooms: 4, bathrooms: 3, date: '2023-11-10', status: 'OPEN', createdAt: Date.now() - 800000 },
  { id: 'l5', clientName: 'Evan Wright', clientPhone: '(201) 555-5050', zipCode: '07102', serviceType: 'Standard Clean', bedrooms: 2, bathrooms: 1, date: '2023-10-29', status: 'COMPLETED', acceptedByCleanerId: 'c_mock_4', createdAt: Date.now() - 1000000 }
];

const MOCK_SUPPORT: SupportRequest[] = [
  { id: 's1', type: SupportType.CLIENT, fullName: 'Alice Johnson', contactEmail: 'alice@example.com', contactPhone: '(415) 555-1010', message: 'How do I cancel a booking?', status: SupportStatus.NEW, createdAt: new Date(Date.now() - 100000).toISOString() },
  { id: 's2', type: SupportType.CLEANER, fullName: 'Maria Silva', contactPhone: '(415) 555-0101', whatsapp: '(415) 555-0101', message: 'Preciso atualizar meus dados bancários.', status: SupportStatus.IN_PROGRESS, createdAt: new Date(Date.now() - 500000).toISOString() },
  { id: 's3', type: SupportType.CLEANER, fullName: 'Carlos Pereira', contactPhone: '(201) 555-0404', whatsapp: '(201) 555-0404', message: 'Por que fui rejeitado?', status: SupportStatus.NEW, createdAt: new Date(Date.now() - 200000).toISOString() },
  { id: 's4', type: SupportType.CLIENT, fullName: 'Bob Smith', contactEmail: 'bob@example.com', contactPhone: '(415) 555-2020', message: 'Cleaner did a great job, how to tip?', status: SupportStatus.RESOLVED, createdAt: new Date(Date.now() - 1000000).toISOString(), resolvedAt: new Date().toISOString() }
];

const INITIAL_CLEANERS_FALLBACK: CleanerProfile[] = [MOCK_CLEANERS[0]]; // Fallback for non-studio

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  actionLink: string;
  actionText: string;
}

interface AppContextType {
  cleaners: CleanerProfile[];
  clients: ClientProfile[];
  leads: Lead[];
  feedPosts: FeedPost[];
  supportRequests: SupportRequest[];
  bonusCampaigns: BonusCampaign[];
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  registerCleaner: (cleaner: Partial<CleanerProfile>) => string;
  verifyCleanerCode: (cleanerId: string, code: string) => boolean;
  resendCleanerCode: (cleanerId: string) => void;
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
  createLead: (lead: Partial<Lead>) => void;
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

  useEffect(() => {
    const safeParse = (key: string, fallback: any) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (e) { return fallback; }
    };

    // STUDIO MODE INJECTION
    if (SYSTEM_IDENTITY.IS_STUDIO_MODE) {
       console.log("🇧🇷 BRAZILIAN CLEAN: STUDIO MOCK MODE ACTIVE");
       setCleaners(safeParse('bc_cleaners', MOCK_CLEANERS));
       setClients(safeParse('bc_clients', []));
       setLeads(safeParse('bc_leads', MOCK_LEADS));
       setSupportRequests(safeParse('bc_support', MOCK_SUPPORT));
       setFeedPosts(safeParse('bc_posts', []));
       setBonusCampaigns(safeParse('bc_campaigns', []));
    } else {
       // STANDARD INITIALIZATION
       setCleaners(safeParse('bc_cleaners', INITIAL_CLEANERS_FALLBACK));
       setClients(safeParse('bc_clients', []));
       setLeads(safeParse('bc_leads', []));
       setFeedPosts(safeParse('bc_posts', []));
       setSupportRequests(safeParse('bc_support', []));
       setBonusCampaigns(safeParse('bc_campaigns', []));
    }
  }, []);

  useEffect(() => { localStorage.setItem('bc_cleaners', JSON.stringify(cleaners)); }, [cleaners]);
  useEffect(() => { localStorage.setItem('bc_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('bc_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('bc_posts', JSON.stringify(feedPosts)); }, [feedPosts]);
  useEffect(() => { localStorage.setItem('bc_support', JSON.stringify(supportRequests)); }, [supportRequests]);
  useEffect(() => { localStorage.setItem('bc_campaigns', JSON.stringify(bonusCampaigns)); }, [bonusCampaigns]);

  const generate6DigitCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const registerCleaner = (data: Partial<CleanerProfile>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const code = generate6DigitCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const newCleaner: CleanerProfile = {
      id,
      fullName: data.fullName || '',
      phone: data.phone || '',
      email: data.email || '',
      city: data.city || '',
      state: data.state || '',
      companyName: data.companyName || '',
      isCompany: !!data.isCompany,
      yearsExperience: data.yearsExperience || 0,
      services: data.services || [],
      zipCodes: data.zipCodes || [],
      description: data.description || '',
      status: CleanerStatus.EMAIL_PENDING,
      rating: 0,
      reviewCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      photoUrl: data.photoUrl || 'https://via.placeholder.com/200',
      galleryUrls: data.galleryUrls || [],
      documentUrl: data.documentUrl,
      selfieUrl: data.selfieUrl,
      portfolio: [], // Init empty portfolio
      points: 0,
      level: CleanerLevel.BRONZE,
      pointHistory: [],
      emailVerified: false,
      verificationCode: code,
      verificationCodeExpires: expires
    };

    setCleaners(prev => [...prev, newCleaner]);

    setLastEmail({
      to: newCleaner.email,
      subject: "Confirm your email — Brazilian Clean",
      body: `Welcome to Brazilian Clean! To finish setting up your account, please use the following verification code: ${code}. This code expires in 10 minutes. If you didn’t request this, ignore this email.`,
      actionLink: `/verify?id=${id}`,
      actionText: "Verify Email Now"
    });

    return id;
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
          status: CleanerStatus.UNDER_REVIEW,
          verificationCode: undefined,
          verificationCodeExpires: undefined
        } : c
      ));

      setLastEmail({
        to: cleaner.email,
        subject: "Welcome to Brazilian Clean",
        body: `Hello ${cleaner.fullName}! Your email is verified. Next steps: 1. Complete your business profile. 2. Upload your identity documents. 3. Wait for our team to review your application. We are excited to have you on board!`,
        actionLink: "/dashboard",
        actionText: "Go to Dashboard"
      });

      // After verification, if docs are present, trigger AI verification
      if (cleaner.documentUrl && cleaner.selfieUrl) {
          performIdentityVerification(cleaner.documentUrl, cleaner.selfieUrl, { fullName: cleaner.fullName, email: cleaner.email })
          .then(result => {
              setCleaners(curr => curr.map(c => c.id === cleanerId ? { ...c, aiVerificationResult: result } : c));
              setLastEmail({
                to: cleaner.email,
                subject: "Your profile is under review",
                body: "Thank you for submitting your documents! Our team (and our AI assistant Luna) are currently reviewing your profile. This usually takes a few minutes but may take up to 24 hours in some cases.",
                actionLink: "/dashboard",
                actionText: "View Status"
              });
          });
      }

      return true;
    }
    return false;
  };

  const resendCleanerCode = (cleanerId: string) => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    if (!cleaner) return;

    const code = generate6DigitCode();
    const expires = Date.now() + 10 * 60 * 1000;

    setCleaners(prev => prev.map(c => 
      c.id === cleanerId ? { ...c, verificationCode: code, verificationCodeExpires: expires } : c
    ));

    setLastEmail({
      to: cleaner.email,
      subject: "New Verification Code — Brazilian Clean",
      body: `Your new verification code is: ${code}. It expires in 10 minutes.`,
      actionLink: `/verify?id=${cleanerId}`,
      actionText: "Enter Code"
    });
  };

  const registerClient = (data: Partial<ClientProfile>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newClient: ClientProfile = { 
        ...data, 
        id, 
        emailVerified: true, // Lower friction for clients
        joinedDate: new Date().toISOString() 
    } as ClientProfile;

    setClients(prev => [...prev, newClient]);

    setLastEmail({
      to: newClient.email,
      subject: "Welcome to Brazilian Clean",
      body: `Hello ${newClient.fullName}! Welcome to the platform. You can now find verified Brazilian cleaners in your area. Use Express Match™ for instant broadcasts or browse our directory to contact pros directly.`,
      actionLink: "/",
      actionText: "Start Searching"
    });
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
  
  const createLead = (l: Partial<Lead>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const verificationCode = '123456'; // FIXED DEMO CODE
    
    setLeads(p => [{...l, id, status: 'OPEN', createdAt: Date.now()} as Lead, ...p]);
    
    // Explicitly include the code in the demo email body and link
    setLastEmail({
        to: l.clientEmail || '',
        subject: 'Confirme seu pedido Brazilian Clean',
        body: `Olá ${l.clientName}, recebemos seu pedido. Seu código de verificação é ${verificationCode}. Clique abaixo para autorizar.`,
        actionLink: `/verify?type=client&code=${verificationCode}`,
        actionText: 'Autorizar Pedido'
    });
  };

  const deleteLead = (id: string) => setLeads(p => p.filter(l => l.id !== id));
  const acceptLead = (lid: string, cid: string) => {
    setLeads(p => p.map(l => l.id === lid ? {...l, status: 'ACCEPTED', acceptedByCleanerId: cid} : l));
    addCleanerPoints(cid, 10, 'Lead Aceito');
  };

  const createFeedPost = (post: Partial<FeedPost>) => setFeedPosts(p => [{...post, id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString()} as FeedPost, ...p]);
  const deleteFeedPost = (id: string) => setFeedPosts(p => p.filter(f => f.id !== id));
  const createSupportRequest = (r: Partial<SupportRequest>) => setSupportRequests(p => [{...r, id: Math.random().toString(36).substr(2, 9), status: SupportStatus.NEW, createdAt: new Date().toISOString()} as SupportRequest, ...p]);
  const updateSupportStatus = (id: string, s: SupportStatus) => setSupportRequests(p => p.map(r => r.id === id ? {...r, status: s} : r));

  // --- PORTFOLIO FEATURES ---
  const addPortfolioItem = async (cleanerId: string, item: Omit<PortfolioItem, 'id' | 'createdAt' | 'status'>) => {
    // Compress images before saving to prevent LocalStorage quota overflow
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

    setCleaners(prev => prev.map(c => 
      c.id === cleanerId 
        ? { ...c, portfolio: [newItem, ...(c.portfolio || [])] }
        : c
    ));
  };

  const updatePortfolioStatus = (cleanerId: string, itemId: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
      setCleaners(prev => prev.map(c => 
          c.id === cleanerId 
            ? {
                ...c,
                portfolio: c.portfolio.map(p => p.id === itemId ? { ...p, status, adminNote: note } : p)
            }
            : c
      ));
  };
  
  const clearLastEmail = () => setLastEmail(null);

  return (
    <AppContext.Provider value={{ 
      cleaners, clients, leads, feedPosts, supportRequests, bonusCampaigns, userRole, setUserRole, 
      registerCleaner, verifyCleanerCode, resendCleanerCode, registerClient, verifyUserEmail, verifyCleaner, rejectCleaner, deleteCleaner,
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
